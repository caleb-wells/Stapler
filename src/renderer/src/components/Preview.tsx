import { useEffect, type ReactElement } from 'react';
import type { ImageItem } from '../lib/items';
import { ChevronIcon, CloseIcon, RotateIcon } from './icons';

type ReadyItem = Extract<ImageItem, { status: 'ready' }>;

interface Props {
  items: ReadyItem[];
  index: number;
  onClose: () => void;
  onStep: (delta: 1 | -1) => void;
  onRotate: (id: string) => void;
}

export function Preview({ items, index, onClose, onStep, onRotate }: Props): ReactElement | null {
  const item = items[index];

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onStep(1);
      else if (e.key === 'ArrowLeft') onStep(-1);
      else if (e.key.toLowerCase() === 'r' && item) onRotate(item.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onStep, onRotate, item]);

  if (!item) return null;
  const sideways = item.rotation === 90 || item.rotation === 270;

  return (
    <div className="preview-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Preview of ${item.name}`}>
      <div className="preview-top" onClick={(e) => e.stopPropagation()}>
        <span className="preview-title">{item.name}</span>
        <span className="preview-sub">
          {index + 1} of {items.length} · {item.prepared.width} × {item.prepared.height}
          {item.rotation !== 0 && ` · rotated ${item.rotation}°`}
        </span>
        <button className="preview-btn" onClick={() => onRotate(item.id)} aria-label="Rotate 90°" title="Rotate (R)">
          <RotateIcon size={18} />
        </button>
        <button className="preview-btn" onClick={onClose} aria-label="Close preview" title="Close (Esc)">
          <CloseIcon size={16} />
        </button>
      </div>

      <button
        className="preview-nav preview-prev"
        onClick={(e) => { e.stopPropagation(); onStep(-1); }}
        disabled={index === 0}
        aria-label="Previous image"
      >
        <ChevronIcon dir="left" />
      </button>
      <div className="preview-stage" onClick={(e) => e.stopPropagation()}>
        <img
          src={item.thumbUrl}
          alt={item.name}
          className={sideways ? 'preview-img sideways' : 'preview-img'}
          style={{ transform: `rotate(${item.rotation}deg)` }}
        />
      </div>
      <button
        className="preview-nav preview-next"
        onClick={(e) => { e.stopPropagation(); onStep(1); }}
        disabled={index === items.length - 1}
        aria-label="Next image"
      >
        <ChevronIcon dir="right" />
      </button>
    </div>
  );
}
