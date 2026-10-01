import { useCallback, useEffect, useRef, useState, type DragEvent, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ImageGrid } from './components/ImageGrid';
import { Preview } from './components/Preview';
import { nextRotation } from './lib/rotation';
import { buildPdf } from './lib/build-pdf';
import { loadItem, pendingItem, type ImageItem } from './lib/items';
import { defaultPdfName } from './lib/names';
import { canExport } from './lib/export-state';
import { mapWithConcurrency } from './lib/concurrency';

const DECODE_CONCURRENCY = 3;

type Toast = { kind: 'ok' | 'err'; text: string } | null;

export function App(): ReactElement {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);
  const [dragOver, setDragOver] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const ready = items.filter((i): i is Extract<ImageItem, { status: 'ready' }> => i.status === 'ready');
  const previewIndex = previewId === null ? -1 : ready.findIndex((i) => i.id === previewId);
  const loadingCount = items.filter((i) => i.status === 'loading').length;
  const exportable = canExport(items);

  const addPaths = useCallback(async (paths: string[]) => {
    if (paths.length === 0) return;
    const pending = paths.map(pendingItem);
    setItems((prev) => [...prev, ...pending]);
    await mapWithConcurrency(pending, DECODE_CONCURRENCY, async (p) => {
      const loaded = await loadItem(p);
      setItems((prev) => prev.map((i) => (i.id === loaded.id ? loaded : i)));
    });
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

  const rotate = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id && i.status === 'ready' ? { ...i, rotation: nextRotation(i.rotation) } : i)));
  }, []);

  const closePreview = useCallback(() => setPreviewId(null), []);
  const stepPreview = useCallback(
    (delta: 1 | -1) => {
      setPreviewId((current) => {
        const list = itemsRef.current.filter((i) => i.status === 'ready');
        const at = list.findIndex((i) => i.id === current);
        const next = list[at + delta];
        return next ? next.id : current;
      });
    },
    [],
  );

  function clearAll(): void {
    for (const i of itemsRef.current) if (i.status === 'ready') URL.revokeObjectURL(i.thumbUrl);
    setItems([]);
  }

  async function exportPdf(): Promise<void> {
    if (!exportable || exporting) return;
    setExporting(true);
    setToast(null);
    try {
      const bytes = await buildPdf(
        ready.map((i) => ({ ...i.prepared, rotation: i.rotation })),
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
        <h1>Stapler</h1>
        <div className="actions">
          <motion.button onClick={pick} whileTap={{ scale: 0.95 }}>Add images</motion.button>
          <motion.button onClick={clearAll} disabled={items.length === 0} whileTap={{ scale: 0.95 }}>Clear</motion.button>
        </div>
      </header>

      <main className="content">
        {items.length === 0 ? (
          <motion.div className="empty glass" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <motion.div
              className="empty-icon"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              aria-hidden="true"
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="12" width="24" height="30" rx="3" />
                <path d="M16 6h24v30" />
                <circle cx="17" cy="22" r="3" />
                <path d="M8 36l8-8 6 6 4-4 6 6" />
              </svg>
            </motion.div>
            <p>Drop images here or click <strong>Add images</strong>.</p>
            <p className="hint">JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC</p>
          </motion.div>
        ) : (
          <ImageGrid items={items} onReorder={setItems} onRemove={remove} onRotate={rotate} onOpen={setPreviewId} />
        )}
      </main>

      <footer className="bottombar">
        <span className="count">
          {ready.length} {ready.length === 1 ? 'page' : 'pages'}
          {items.length !== ready.length && ` (${items.length - ready.length} not ready)`}
        </span>
        <span className="progress">{progress}</span>
        <motion.button className="primary" onClick={exportPdf} disabled={!exportable || exporting} whileTap={{ scale: 0.95 }} whileHover={{ y: -1 }}>
          {exporting ? 'Exporting…' : loadingCount > 0 ? `Loading ${loadingCount}…` : 'Export PDF'}
        </motion.button>
      </footer>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className={`toast toast-${toast.kind} glass-dark`}
            initial={{ opacity: 0, y: 24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 12, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewIndex >= 0 && (
          <Preview key="preview" items={ready} index={previewIndex} onClose={closePreview} onStep={stepPreview} onRotate={rotate} />
        )}
      </AnimatePresence>
    </div>
  );
}
