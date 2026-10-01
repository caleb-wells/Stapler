import { describe, expect, it } from 'vitest';
import { defaultPdfName } from './names';

describe('defaultPdfName', () => {
  it('replaces the extension of the first file name', () => {
    expect(defaultPdfName('IMG_0001.HEIC')).toBe('IMG_0001.pdf');
    expect(defaultPdfName('photo.final.jpeg')).toBe('photo.final.pdf');
  });
  it('appends .pdf when there is no extension', () => {
    expect(defaultPdfName('scan')).toBe('scan.pdf');
  });
  it('falls back to images.pdf', () => {
    expect(defaultPdfName(undefined)).toBe('images.pdf');
    expect(defaultPdfName('')).toBe('images.pdf');
    expect(defaultPdfName('.hidden')).toBe('images.pdf');
  });
});
