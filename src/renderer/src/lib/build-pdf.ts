import { PDFDocument, degrees } from 'pdf-lib';
import { pageSizeFor } from './page';
import type { PreparedImage } from './prepared-image';
import { placementFor, rotatedSize, type Rotation } from './rotation';

export type ProgressCallback = (done: number, total: number) => void;
export type PageImage = PreparedImage & { rotation?: Rotation };

export async function buildPdf(images: PageImage[], onProgress?: ProgressCallback): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('Need at least one image to build a PDF');

  const doc = await PDFDocument.create();
  doc.setProducer('Stapler');
  doc.setCreator('Stapler');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let embedded;
    try {
      embedded = img.kind === 'jpeg' ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Image ${i + 1} could not be embedded: ${reason}`);
    }
    const rotation = img.rotation ?? 0;
    const { width, height } = pageSizeFor(img.width, img.height);
    const pageSize = rotatedSize(width, height, rotation);
    const place = placementFor(width, height, rotation);
    const page = doc.addPage([pageSize.width, pageSize.height]);
    page.drawImage(embedded, { x: place.x, y: place.y, width, height, rotate: degrees(place.degrees) });
    onProgress?.(i + 1, images.length);
  }

  return doc.save();
}
