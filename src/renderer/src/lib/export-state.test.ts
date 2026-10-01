import { describe, expect, it } from 'vitest';
import { canExport } from './export-state';
import type { ImageItem } from './items';

const ready = (id: string): ImageItem => ({ id, path: id, name: id, status: 'ready', thumbUrl: '', rotation: 0, prepared: { kind: 'png', bytes: new Uint8Array(), width: 1, height: 1 } });
const loading = (id: string): ImageItem => ({ id, path: id, name: id, status: 'loading' });
const error = (id: string): ImageItem => ({ id, path: id, name: id, status: 'error', error: 'x' });

describe('canExport', () => {
  it('is false with no ready items', () => {
    expect(canExport([])).toBe(false);
    expect(canExport([error('a')])).toBe(false);
  });
  it('is false while any item is still loading', () => {
    expect(canExport([ready('a'), loading('b')])).toBe(false);
  });
  it('is true when at least one ready item and nothing loading', () => {
    expect(canExport([ready('a'), error('b')])).toBe(true);
  });
});
