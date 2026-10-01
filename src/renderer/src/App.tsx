import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactElement } from 'react';
import { ImageGrid } from './components/ImageGrid';
import { buildPdf } from './lib/build-pdf';
import { loadItem, pendingItem, type ImageItem } from './lib/items';
import { defaultPdfName } from './lib/names';

type Toast = { kind: 'ok' | 'err'; text: string } | null;

export function App(): ReactElement {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [dragOver, setDragOver] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const ready = items.filter((i) => i.status === 'ready');

  const addPaths = useCallback(async (paths: string[]) => {
    if (paths.length === 0) return;
    const pending = paths.map(pendingItem);
    setItems((prev) => [...prev, ...pending]);
    await Promise.all(
      pending.map(async (p) => {
        const loaded = await loadItem(p);
        setItems((prev) => prev.map((i) => (i.id === loaded.id ? loaded : i)));
      }),
    );
  }, []);

  async function pick(): Promise<void> {
    await addPaths(await window.api.pickImages());
  }

  function onDrop(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    setDragOver(false);
    void addPaths(window.api.pathsForFiles([...e.dataTransfer.files]));
  }

  function remove(id: string): void {
    setItems((prev) => {
      const gone = prev.find((i) => i.id === id);
      if (gone?.status === 'ready') URL.revokeObjectURL(gone.thumbUrl);
      return prev.filter((i) => i.id !== id);
    });
  }

  function clearAll(): void {
    for (const i of itemsRef.current) if (i.status === 'ready') URL.revokeObjectURL(i.thumbUrl);
    setItems([]);
  }

  async function exportPdf(): Promise<void> {
    if (ready.length === 0 || exporting) return;
    setExporting(true);
    setToast(null);
    try {
      const bytes = await buildPdf(
        ready.map((i) => i.prepared),
        (done, total) => setProgress(`Building page ${done} of ${total}`),
      );
      setProgress('Saving…');
      const saved = await window.api.savePdf(defaultPdfName(ready[0]?.name), bytes);
      setToast(saved ? { kind: 'ok', text: `Saved ${saved}` } : null);
    } catch (err) {
      setToast({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
    } finally {
      setExporting(false);
      setProgress(null);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div
      className={`app ${dragOver ? 'drag-over' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <header className="topbar">
        <h1>Image to PDF</h1>
        <div className="actions">
          <button onClick={pick}>Add images</button>
          <button onClick={clearAll} disabled={items.length === 0}>Clear</button>
        </div>
      </header>

      <main className="content">
        {items.length === 0 ? (
          <div className="empty">
            <p>Drop images here or click <strong>Add images</strong>.</p>
            <p className="hint">JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC</p>
          </div>
        ) : (
          <ImageGrid items={items} onReorder={setItems} onRemove={remove} />
        )}
      </main>

      <footer className="bottombar">
        <span className="count">
          {ready.length} {ready.length === 1 ? 'page' : 'pages'}
          {items.length !== ready.length && ` (${items.length - ready.length} not ready)`}
        </span>
        <span className="progress">{progress}</span>
        <button className="primary" onClick={exportPdf} disabled={ready.length === 0 || exporting}>
          {exporting ? 'Exporting…' : 'Export PDF'}
        </button>
      </footer>

      {toast && <div className={`toast toast-${toast.kind}`}>{toast.text}</div>}
    </div>
  );
}
