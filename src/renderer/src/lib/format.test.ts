import { describe, expect, it } from 'vitest';
import { detectFormat } from './format';

const ascii = (s: string): number[] => [...s].map((c) => c.charCodeAt(0));
const bytes = (...parts: Array<number[] | number>): Uint8Array =>
  new Uint8Array(parts.flatMap((p) => (typeof p === 'number' ? [p] : p)));

describe('detectFormat', () => {
  it('detects JPEG', () => {
    expect(detectFormat(bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe('jpeg');
  });
  it('detects PNG', () => {
    expect(detectFormat(bytes(0x89, ascii('PNG'), 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0))).toBe('png');
  });
  it('detects WebP', () => {
    expect(detectFormat(bytes(ascii('RIFF'), 0, 0, 0, 0, ascii('WEBP')))).toBe('webp');
  });
  it('detects GIF', () => {
    expect(detectFormat(bytes(ascii('GIF89a'), 0, 0, 0, 0, 0, 0))).toBe('gif');
    expect(detectFormat(bytes(ascii('GIF87a'), 0, 0, 0, 0, 0, 0))).toBe('gif');
  });
  it('detects BMP', () => {
    expect(detectFormat(bytes(ascii('BM'), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0))).toBe('bmp');
  });
  it('detects TIFF in both byte orders', () => {
    expect(detectFormat(bytes(ascii('II'), 0x2a, 0x00, 0, 0, 0, 0, 0, 0, 0, 0))).toBe('tiff');
    expect(detectFormat(bytes(ascii('MM'), 0x00, 0x2a, 0, 0, 0, 0, 0, 0, 0, 0))).toBe('tiff');
  });
  it('detects HEIC/HEIF brands', () => {
    for (const brand of ['heic', 'heix', 'hevc', 'heif', 'mif1', 'msf1']) {
      expect(detectFormat(bytes(0, 0, 0, 0x18, ascii('ftyp'), ascii(brand), 0, 0, 0, 0))).toBe('heic');
    }
  });
  it('returns null for a RIFF that is not WebP', () => {
    expect(detectFormat(bytes(ascii('RIFF'), 0, 0, 0, 0, ascii('WAVE')))).toBeNull();
  });
  it('returns null for unknown data, PDF, and empty input', () => {
    expect(detectFormat(bytes(ascii('%PDF-1.4'), 0, 0, 0, 0))).toBeNull();
    expect(detectFormat(bytes(ascii('hello world!')))).toBeNull();
    expect(detectFormat(new Uint8Array(0))).toBeNull();
    expect(detectFormat(bytes(0xff))).toBeNull();
  });
});
