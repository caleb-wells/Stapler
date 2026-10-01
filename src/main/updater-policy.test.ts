import { describe, expect, it } from 'vitest';
import { shouldAutoUpdate } from './updater-policy';

describe('shouldAutoUpdate', () => {
  it('runs only for packaged Windows builds', () => {
    expect(shouldAutoUpdate('win32', true)).toBe(true);
  });
  it('is off in development', () => {
    expect(shouldAutoUpdate('win32', false)).toBe(false);
  });
  it('is off on macOS and Linux for now', () => {
    expect(shouldAutoUpdate('darwin', true)).toBe(false);
    expect(shouldAutoUpdate('linux', true)).toBe(false);
  });
});
