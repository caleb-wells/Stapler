export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp' | 'tiff' | 'heic';

const HEIF_BRANDS = new Set(['heic', 'heix', 'hevc', 'hevx', 'heif', 'mif1', 'msf1']);

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if (bytes[0] === 0x89 && asciiAt(bytes, 1, 3) === 'PNG') return 'png';
  if (asciiAt(bytes, 0, 4) === 'RIFF' && asciiAt(bytes, 8, 4) === 'WEBP') return 'webp';
  if (asciiAt(bytes, 0, 4) === 'GIF8') return 'gif';
  if (asciiAt(bytes, 0, 2) === 'BM') return 'bmp';
  if (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) return 'tiff';
  if (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a) return 'tiff';
  if (asciiAt(bytes, 4, 4) === 'ftyp' && HEIF_BRANDS.has(asciiAt(bytes, 8, 4))) return 'heic';
  return null;
}
