import type { DecodeRequest, DecodeResponse } from './decode.worker';
import type { ImageFormat } from './format';
import type { PreparedImage } from './prepared-image';

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, { resolve: (img: PreparedImage) => void; reject: (err: Error) => void }>();

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('./decode.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent<DecodeResponse>) => {
      const entry = pending.get(e.data.id);
      if (!entry) return;
      pending.delete(e.data.id);
      if (e.data.ok) entry.resolve(e.data.image);
      else entry.reject(new Error(e.data.error));
    };
    worker.onerror = (e) => {
      for (const entry of pending.values()) entry.reject(new Error(e.message || 'Decoder crashed'));
      pending.clear();
      worker = null;
    };
  }
  return worker;
}

/** Decode off the UI thread. The caller gives up ownership of `bytes`. */
export function prepareImageInWorker(bytes: Uint8Array, format: ImageFormat): Promise<PreparedImage> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    const req: DecodeRequest = { id, bytes, format };
    getWorker().postMessage(req, [bytes.buffer as ArrayBuffer]);
  });
}
