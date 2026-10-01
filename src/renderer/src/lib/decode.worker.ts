import { prepareImage } from './decode';
import type { ImageFormat } from './format';
import type { PreparedImage } from './prepared-image';

export interface DecodeRequest { id: number; bytes: Uint8Array; format: ImageFormat }
export type DecodeResponse = { id: number; ok: true; image: PreparedImage } | { id: number; ok: false; error: string };

self.onmessage = async (e: MessageEvent<DecodeRequest>) => {
  const { id, bytes, format } = e.data;
  try {
    const image = await prepareImage(bytes, format);
    const msg: DecodeResponse = { id, ok: true, image };
    (self as unknown as Worker).postMessage(msg, [image.bytes.buffer as ArrayBuffer]);
  } catch (err) {
    const msg: DecodeResponse = { id, ok: false, error: err instanceof Error ? err.message : String(err) };
    (self as unknown as Worker).postMessage(msg);
  }
};
