# Stapler

Staple your photos into one PDF, a page per image. A small desktop app.
Runs on Windows, macOS and Linux.

Supported inputs: JPEG, PNG, WebP, GIF, BMP, TIFF, HEIC/HEIF.
Each page matches its image's aspect ratio (sized at 96 DPI). JPEG and PNG
files are embedded without re-encoding; other formats are converted in-app.

## Develop

    npm install
    npm run dev        # launches the app with hot reload
    npm test           # unit tests
    npm run smoke      # end-to-end: launches the app, adds test/fixtures, exports a PDF
    npm run typecheck

## Build installers

    npm run dist:win     # dist/Stapler Setup x.y.z.exe
    npm run dist:mac     # dist/Stapler-x.y.z.dmg
    npm run dist:linux   # dist/Stapler-x.y.z.AppImage

The Windows installer can also be built from macOS or Linux (electron-builder
downloads a NSIS toolset; no Wine needed). macOS and Linux builds must run on
their own OS. The GitHub Actions workflow in `.github/workflows/build.yml`
builds all three natively on every push to `main` and attaches them to a
release when a `v*` tag is pushed.

## Updates

Windows installs check GitHub Releases on launch, download new versions in the
background, and offer a restart. macOS and Linux users download new builds from
the Releases page.

## Install

- **Windows:** run `Stapler Setup x.y.z.exe`. Windows SmartScreen will
  warn because the installer is not code-signed; choose "More info" then
  "Run anyway".
- **macOS:** open the `.dmg` and drag the app to Applications.
- **Linux:** `chmod +x` the AppImage and run it.
