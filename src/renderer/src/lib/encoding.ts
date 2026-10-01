import type { ImageFormat } from './format';
import type { PreparedKind } from './prepared-image';

export interface OutputEncoding {
  kind: PreparedKind;
  passthrough: boolean;
  quality?: number;
}

export function outputEncodingFor(format: ImageFormat, exifOrientation: number | undefined): OutputEncoding {
  switch (format) {
    case 'jpeg':
      return exifOrientation === undefined || exifOrientation === 1
        ? { kind: 'jpeg', passthrough: true }
        : { kind: 'jpeg', passthrough: false, quality: 0.92 };
    case 'png':
      return { kind: 'png', passthrough: true };
    case 'gif':
    case 'bmp':
      return { kind: 'png', passthrough: false };
    case 'webp':
    case 'tiff':
    case 'heic':
      return { kind: 'jpeg', passthrough: false, quality: 0.9 };
  }
}
