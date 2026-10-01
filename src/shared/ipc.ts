export const IPC = {
  pickImages: 'pick-images',
  readFile: 'read-file',
  savePdf: 'save-pdf',
} as const;

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tif', 'tiff', 'heic', 'heif'];

export interface Api {
  /** Open a multi-select file dialog. Resolves to [] when cancelled. */
  pickImages(): Promise<string[]>;
  /** Read a file's bytes. Rejects with the OS error message. */
  readFile(path: string): Promise<Uint8Array>;
  /** Show a save dialog and write the PDF. Resolves to the saved path, or null if cancelled. */
  savePdf(defaultName: string, bytes: Uint8Array): Promise<string | null>;
  /** Resolve dropped File objects to absolute paths. Synchronous, preload-side. */
  pathsForFiles(files: File[]): string[];
}
