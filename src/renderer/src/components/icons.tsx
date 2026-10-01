import type { ReactElement } from 'react';

export function RotateIcon({ size = 14 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
      <path d="M13.5 2.5v3h-3" />
    </svg>
  );
}

export function ChevronIcon({ dir, size = 20 }: { dir: 'left' | 'right'; size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {dir === 'left' ? <path d="M12.5 4l-6 6 6 6" /> : <path d="M7.5 4l6 6-6 6" />}
    </svg>
  );
}

export function CloseIcon({ size = 14 }: { size?: number }): ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M2 2l8 8M10 2l-8 8" />
    </svg>
  );
}
