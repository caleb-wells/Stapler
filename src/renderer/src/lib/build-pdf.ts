import { PDFDocument } from 'pdf-lib';
import { pageSizeFor } from './page';
import type { PreparedImage } from './prepared-image';

export type ProgressCallback = (done: number, total: number) => void;

export async function buildPdf(images: PreparedImage[], onProgress?: ProgressCallback): Promise<Uint8Array> {
  if (images.length === 0) throw new Error('Need at least one image to build a PDF');

  const doc = await PDFDocument.create();
  doc.setProducer('Image to PDF');
  doc.setCreator('Image to PDF');

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    let embedded;
    try {
      embedded = img.kind === 'jpeg' ? await doc.embedJpg(img.bytes) : await doc.embedPng(img.bytes);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      throw new Error(`Image ${i + 1} could not be embedded: ${reason}`);
    }
    const { width, height } = pageSizeFor(img.width, img.height);
    const page = doc.addPage([width, height]);
    page.drawImage(embedded, { x: 0, y: 0, width, height });
    onProgress?.(i + 1, images.length);
  }

  return doc.save();
}
