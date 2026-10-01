declare module 'libheif-js' {
  export interface HeifImage {
    get_width(): number;
    get_height(): number;
    display(target: ImageData, callback: (result: ImageData | null) => void): void;
    free(): void;
  }
  export class HeifDecoder {
    decode(data: Uint8Array): HeifImage[];
  }
  const libheif: { HeifDecoder: typeof HeifDecoder };
  export default libheif;
}
