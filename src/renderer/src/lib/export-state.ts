import type { ImageItem } from './items';

/** Export is allowed only when nothing is still decoding and at least one image is ready. */
export function canExport(items: ImageItem[]): boolean {
  return items.some((i) => i.status === 'ready') && !items.some((i) => i.status === 'loading');
}
