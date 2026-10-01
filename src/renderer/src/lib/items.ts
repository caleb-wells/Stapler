import { detectFormat } from './format';
import { prepareImageInWorker } from './decode-client';
import type { PreparedImage } from './prepared-image';
import { baseName } from './names';
import type { Rotation } from './rotation';

export type ImageItem =
  | { id: string; path: string; name: string; status: 'loading' }
  | { id: string; path: string; name: string; status: 'ready'; prepared: PreparedImage; thumbUrl: string; rotation: Rotation }
  | { id: string; path: string; name: string; status: 'error'; error: string };

let counter = 0;
export function newItemId(): string {
  counter += 1;
  return `item-${Date.now()}-${counter}`;
}

export function pendingItem(path: string): ImageItem {
  return { id: newItemId(), path, name: baseName(path), status: 'loading' };
}

/** Load and decode one file; never throws, returns the resolved item. */
export async function loadItem(item: ImageItem): Promise<ImageItem> {
  const base = { id: item.id, path: item.path, name: item.name };
  try {
    const bytes = await window.api.readFile(item.path);
    const format = detectFormat(bytes);
    if (!format) return { ...base, status: 'error', error: 'Unsupported file type' };
    const prepared = await prepareImageInWorker(bytes, format);
    const buffer = new ArrayBuffer(prepared.bytes.byteLength);
    new Uint8Array(buffer).set(prepared.bytes);
    const thumbUrl = URL.createObjectURL(
      new Blob([buffer], { type: prepared.kind === 'jpeg' ? 'image/jpeg' : 'image/png' }),
    );
    return { ...base, status: 'ready', prepared, thumbUrl, rotation: 0 };
  } catch (err) {
    return { ...base, status: 'error', error: err instanceof Error ? err.message : String(err) };
  }
}
