/** Auto-update is enabled only for packaged Windows builds for now (macOS needs a signed app). */
export function shouldAutoUpdate(platform: NodeJS.Platform, isPackaged: boolean): boolean {
  return platform === 'win32' && isPackaged;
}
