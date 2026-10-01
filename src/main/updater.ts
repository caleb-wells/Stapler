import { app, BrowserWindow, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import { shouldAutoUpdate } from './updater-policy';

const RECHECK_INTERVAL_MS = 4 * 60 * 60 * 1000;

/** Check GitHub Releases for a newer version, download it quietly, then offer a restart. */
export function setupAutoUpdate(getWindow: () => BrowserWindow | null): void {
  if (!shouldAutoUpdate(process.platform, app.isPackaged)) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('error', (err) => {
    console.error('[updater]', err.message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    const win = getWindow();
    const options = {
      type: 'info' as const,
      title: 'Update ready',
      message: `${app.getName()} ${info.version} has been downloaded.`,
      detail: 'Restart now to install it, or it will install the next time you quit.',
      buttons: ['Restart now', 'Later'],
      defaultId: 0,
      cancelId: 1,
    };
    const ask = win ? dialog.showMessageBox(win, options) : dialog.showMessageBox(options);
    void ask.then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  const check = (): void => {
    autoUpdater.checkForUpdates().catch((err: unknown) => {
      console.error('[updater]', err instanceof Error ? err.message : String(err));
    });
  };
  check();
  setInterval(check, RECHECK_INTERVAL_MS).unref();
}
