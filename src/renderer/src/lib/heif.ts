import type { HeifDecoder } from 'libheif-js';

let decoderPromise: Promise<HeifDecoder> | null = null;

/**
 * One decoder for the whole session. libheif-js keeps the previous file's
 * context alive until the next decode() on the same instance, so creating a
 * decoder per image leaks one file's worth of memory each time.
 */
export function getHeifDecoder(): Promise<HeifDecoder> {
  if (!decoderPromise) {
    decoderPromise = import('libheif-js').then((m) => new m.default.HeifDecoder());
  }
  return decoderPromise;
}
