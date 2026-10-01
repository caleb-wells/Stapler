# img-to-pdf: design spec

Date: 2026-09-30

## Purpose

A cross-platform desktop app (Windows first, also macOS and Linux) that takes
multiple images and merges them into a single PDF, one image per page. The
primary use is bundling phone photos as proof of completing an assignment.

Success: the user adds several photos, reorders or removes some, clicks
Export, and gets a PDF that opens in any viewer with the images in the chosen
order, upright, at original quality.

## Scope

In scope:

- Add images via a file picker (multi-select) or drag-and-drop from the OS.
- Thumbnail list with drag-to-reorder and per-item remove.
- Export to a single PDF via a save dialog.
- Supported inputs: JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF.
- Each page sized to its image's aspect ratio; image fills the page.
- Per-file error reporting without aborting the whole export.

Out of scope: OCR, cropping/rotating/editing, fixed page sizes or margins,
compression settings, cloud sync, CLI mode.

## Stack

- Electron, scaffolded with electron-vite, TypeScript throughout.
- React in the renderer; `@dnd-kit/core` + `@dnd-kit/sortable` for reordering.
- `pdf-lib` for PDF construction (runs in the renderer).
- `utif` for TIFF decoding, `libheif-js` (WASM) for HEIC decoding.
- `electron-builder` for packaging: NSIS installer (Windows), DMG (macOS),
  AppImage (Linux).
- `vitest` for unit tests.
- No native Node modules, so no rebuild step is needed per platform.

## Architecture

### Process split

- **Main process** owns the file system and dialogs: open-file dialog, read
  file bytes, save dialog, write PDF bytes. Nothing else.
- **Preload** exposes a typed `window.api` bridge with `contextIsolation: true`
  and `nodeIntegration: false`. It also resolves dropped `File` objects to
  paths via `webUtils.getPathForFile`.
- **Renderer** owns all state (the ordered image list), image decoding,
  thumbnails, and the PDF build.

### IPC surface (`src/shared/ipc.ts`)

```ts
interface Api {
  pickImages(): Promise<string[]>;                   // paths, [] if cancelled
  readFile(path: string): Promise<Uint8Array>;
  savePdf(defaultName: string, bytes: Uint8Array): Promise<string | null>; // saved path or null if cancelled
  pathsForFiles(files: File[]): string[];           // preload-only, sync
}
```

### Renderer modules

- `format.ts` — `detectFormat(bytes): ImageFormat | null` from magic bytes
  (JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC). Pure, unit tested.
- `decode.ts` — `prepareImage(bytes, format): Promise<PreparedImage>` where
  `PreparedImage = { kind: 'jpeg' | 'png', bytes: Uint8Array, width, height }`.
  - JPEG and PNG: pass through unchanged. Dimensions read by `createImageBitmap`
    (or by pdf-lib's embed result; either is fine but must respect EXIF
    orientation for JPEG — see below).
  - WebP, GIF, BMP: `createImageBitmap(blob, { imageOrientation: 'from-image' })`
    then draw to an `OffscreenCanvas`.
  - TIFF: `utif` decodes to RGBA, put into an `OffscreenCanvas`.
  - HEIC: `libheif-js` decodes to RGBA, put into an `OffscreenCanvas`.
  - Canvas output: PNG for GIF and BMP (lossless), JPEG quality 0.9 for WebP,
    TIFF and HEIC.
  - JPEG EXIF orientation: pdf-lib embeds raw JPEG bytes and ignores EXIF.
    To keep phone photos upright, JPEG files whose EXIF orientation is not 1
    are *also* routed through the canvas path (re-encoded as JPEG 0.92).
    JPEGs with orientation 1 or no EXIF pass through untouched.
- `page.ts` — `pageSizeFor(width, height): { w, h }` in PDF points at 96 DPI
  (`px * 72 / 96`). Pure, unit tested.
- `build-pdf.ts` — `buildPdf(images: PreparedImage[]): Promise<Uint8Array>`.
  Creates a `PDFDocument`, for each image embeds (`embedJpg`/`embedPng`),
  adds a page of `pageSizeFor(...)`, draws the image at (0,0) filling the
  page. Pure given `PreparedImage`s; unit tested in Node with fixtures.
- `App.tsx` — state and UI (see below).

### Data flow

1. User picks or drops files → paths.
2. For each path: `readFile` → `detectFormat` → if unsupported, record an
   error item; else `prepareImage` → create an object URL for the thumbnail
   → append `ImageItem { id, path, name, prepared, thumbUrl }` to the list.
3. User reorders/removes items.
4. Export: `buildPdf(items.map(i => i.prepared))` → `savePdf(...)`.
   Default filename `images.pdf`; the first image's basename is used if there
   is one (`<name>.pdf`).

Decoding happens at add time so export is fast and errors surface early.

### UI

Single window. Top: drop zone with an "Add images" button. Middle: sortable
grid of thumbnails, each with a drag handle, filename, pixel dimensions, and
a remove button. Items that failed to decode show an error badge with the
reason and a remove button, and are excluded from export. Bottom bar: page
count and an "Export PDF" button (disabled when there are no valid items).
During export the button shows a spinner and is disabled. After export a
toast shows the saved path, or the error message.

### Error handling

- Unsupported or corrupt file: item is kept in the list with an error state;
  export skips it. Export is only blocked when zero valid items remain.
- Read or write failures in main are returned as rejected promises; the
  renderer shows the message in the toast.
- Very large images: no special handling beyond relying on Chromium; a
  future cap can be added if memory becomes a problem.

## Packaging

`electron-builder` config in `electron-builder.yml`: appId
`com.calebwells.imgtopdf`, product name "Image to PDF", targets NSIS (x64),
DMG, AppImage. `npm run dist` produces installers in `dist/`.

## Testing

- `vitest` unit tests:
  - `format.test.ts`: magic-byte detection for each format and an unknown
    buffer.
  - `page.test.ts`: point conversion for a few sizes.
  - `build-pdf.test.ts`: builds a PDF from a tiny JPEG and PNG fixture,
    reloads it with pdf-lib, asserts page count and page sizes match
    `pageSizeFor`.
- Manual smoke test before completion: run `npm run dev`, add a JPEG, a PNG,
  a HEIC and a WebP, reorder, remove one, export, open the PDF.

## Project layout

```
img-to-pdf/
  package.json
  electron.vite.config.ts
  electron-builder.yml
  tsconfig*.json
  src/
    main/index.ts
    preload/index.ts
    shared/ipc.ts
    renderer/
      index.html
      src/main.tsx
      src/App.tsx
      src/lib/format.ts
      src/lib/decode.ts
      src/lib/page.ts
      src/lib/build-pdf.ts
      src/lib/*.test.ts
  test/fixtures/
```
