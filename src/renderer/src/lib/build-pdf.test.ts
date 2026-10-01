import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { buildPdf } from './build-pdf';
import { JPEG_1x1, PNG_1x1 } from './fixtures';
import type { PreparedImage } from './prepared-image';

const jpeg: PreparedImage = { kind: 'jpeg', bytes: JPEG_1x1, width: 1, height: 1 };
const png: PreparedImage = { kind: 'png', bytes: PNG_1x1, width: 1, height: 1 };

describe('buildPdf', () => {
  it('creates one page per image, in order, sized from pixel dimensions', async () => {
    const wide: PreparedImage = { ...png, width: 192, height: 96 };
    const bytes = await buildPdf([jpeg, wide, png]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getSize()).toEqual({ width: 0.75, height: 0.75 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 144, height: 72 });
  });

  it('reports progress per image', async () => {
    const calls: Array<[number, number]> = [];
    await buildPdf([jpeg, png], (done, total) => calls.push([done, total]));
    expect(calls).toEqual([[1, 2], [2, 2]]);
  });

  it('rejects an empty list', async () => {
    await expect(buildPdf([])).rejects.toThrow(/at least one image/i);
  });

  it('rejects garbage bytes with a readable message', async () => {
    const bad: PreparedImage = { kind: 'jpeg', bytes: new Uint8Array([1, 2, 3]), width: 1, height: 1 };
    await expect(buildPdf([bad])).rejects.toThrow(/image 1/i);
  });
});

describe('buildPdf with rotation', () => {
  it('swaps page dimensions for 90 and 270 degree turns', async () => {
    const wide: PreparedImage = { ...png, width: 192, height: 96 };
    const bytes = await buildPdf([
      { ...wide, rotation: 90 },
      { ...wide, rotation: 180 },
      { ...wide, rotation: 270 },
    ]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPage(0).getSize()).toEqual({ width: 72, height: 144 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 144, height: 72 });
    expect(doc.getPage(2).getSize()).toEqual({ width: 72, height: 144 });
  });
});
