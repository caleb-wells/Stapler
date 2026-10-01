import { contextBridge, ipcRenderer, webUtils } from 'electron';
import { IPC, type Api } from '../shared/ipc';

const api: Api = {
  pickImages: () => ipcRenderer.invoke(IPC.pickImages),
  readFile: (path) => ipcRenderer.invoke(IPC.readFile, path),
  savePdf: (defaultName, bytes) => ipcRenderer.invoke(IPC.savePdf, defaultName, bytes),
  pathsForFiles: (files) => files.map((f) => webUtils.getPathForFile(f)),
};

contextBridge.exposeInMainWorld('api', api);
