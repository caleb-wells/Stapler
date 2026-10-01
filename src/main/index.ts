import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { IMAGE_EXTENSIONS, IPC } from '../shared/ipc';
import { setupAutoUpdate } from './updater';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    title: 'Stapler',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

function registerIpc(): void {
  ipcMain.handle(IPC.pickImages, async () => {
    const options: Electron.OpenDialogOptions = {
      title: 'Add images',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: IMAGE_EXTENSIONS }],
    };
    const result = mainWindow ? await dialog.showOpenDialog(mainWindow, options) : await dialog.showOpenDialog(options);
    return result.canceled ? [] : result.filePaths;
  });

  ipcMain.handle(IPC.readFile, async (_event, path: string) => {
    const buf = await readFile(path);
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  });

  ipcMain.handle(IPC.savePdf, async (_event, defaultName: string, bytes: Uint8Array) => {
    const options: Electron.SaveDialogOptions = {
      title: 'Save PDF',
      defaultPath: defaultName,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    };
    const result = mainWindow ? await dialog.showSaveDialog(mainWindow, options) : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) return null;
    await writeFile(result.filePath, bytes);
    return result.filePath;
  });
}

void app.whenReady().then(() => {
  registerIpc();
  createWindow();
  setupAutoUpdate(() => mainWindow);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
