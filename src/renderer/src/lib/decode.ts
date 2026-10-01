import exifr from 'exifr';
import UTIF from 'utif2';
import type { ImageFormat } from './format';
import { outputEncodingFor } from './encoding';
import type { PreparedImage } from './prepared-image';

const MIME: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tiff: 'image/tiff',
  heic: 'image/heic',
};

export async function prepareImage(bytes: Uint8Array, format: ImageFormat): Promise<PreparedImage> {
  const orientation = format === 'jpeg' ? await readOrientation(bytes) : undefined;
  const encoding = outputEncodingFor(format, orientation);

  if (encoding.passthrough) {
    const bitmap = await decodeWithBrowser(bytes, format);
    const { width, height } = bitmap;
    bitmap.close();
    return { kind: encoding.kind, bytes, width, height };
  }

  const canvas = await toCanvas(bytes, format);
  const mime = encoding.kind === 'jpeg' ? 'image/jpeg' : 'image/png';
  const blob = await canvas.convertToBlob({ type: mime, quality: encoding.quality });
  return {
    kind: encoding.kind,
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: canvas.width,
    height: canvas.height,
  };
}

async function readOrientation(bytes: Uint8Array): Promise<number | undefined> {
  try {
    const value = await exifr.orientation(bytes);
    return typeof value === 'number' ? value : undefined;
  } catch {
    return undefined;
  }
}

async function decodeWithBrowser(bytes: Uint8Array, format: ImageFormat): Promise<ImageBitmap> {
  const blob = new Blob([toArrayBuffer(bytes)], { type: MIME[format] });
  try {
    return await createImageBitmap(blob, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`Could not decode ${format.toUpperCase()} image (file may be corrupt)`);
  }
}

async function toCanvas(bytes: Uint8Array, format: ImageFormat): Promise<OffscreenCanvas> {
  switch (format) {
    case 'tiff':
      return rgbaToCanvas(decodeTiff(bytes));
    case 'heic':
      return rgbaToCanvas(await decodeHeic(bytes));
    default: {
      const bitmap = await decodeWithBrowser(bytes, format);
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
      bitmap.close();
      return canvas;
    }
  }
}

interface Rgba {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

function rgbaToCanvas({ data, width, height }: Rgba): OffscreenCanvas {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const pixels = new Uint8ClampedArray(toArrayBuffer(data));
  ctx.putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas;
}

/** Copy a typed array's bytes into a standalone ArrayBuffer (never a SharedArrayBuffer). */
function toArrayBuffer(view: ArrayBufferView): ArrayBuffer {
  const out = new ArrayBuffer(view.byteLength);
  new Uint8Array(out).set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
  return out;
}

function decodeTiff(bytes: Uint8Array): Rgba {
  const buffer = toArrayBuffer(bytes);
  const ifds = UTIF.decode(buffer);
  if (ifds.length === 0) throw new Error('TIFF contains no images');
  const first = ifds[0];
  UTIF.decodeImage(buffer, first);
  const rgba = UTIF.toRGBA8(first);
  return { data: new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.byteLength), width: first.width, height: first.height };
}

async function decodeHeic(bytes: Uint8Array): Promise<Rgba> {
  const libheif = (await import('libheif-js')).default;
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(bytes);
  if (images.length === 0) throw new Error('HEIC contains no images');
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();
  const target = new ImageData(width, height);
  try {
    const result = await new Promise<ImageData | null>((resolve) => image.display(target, resolve));
    if (!result) throw new Error('HEIC decoding failed');
    return { data: result.data, width, height };
  } finally {
    for (const img of images) img.free();
  }
}
