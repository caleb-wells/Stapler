import { useEffect, useState, type ReactElement } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const spring = { type: 'spring', stiffness: 300, damping: 30 } as const;

export function Preview({ items, index, onClose, onStep, onRotate }: Props): ReactElement | null {
  const item = items[index];
  const [direction, setDirection] = useState<1 | -1>(1);

  function step(delta: 1 | -1): void {
    setDirection(delta);
    onStep(delta);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key.toLowerCase() === 'r' && item) onRotate(item.id);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, onStep, onRotate, item]);

  if (!item) return null;
  const sideways = item.rotation === 90 || item.rotation === 270;

  return (
    <motion.div
      className="preview-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${item.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <motion.div
        className="preview-top glass-dark"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
      >
        <span className="preview-title">{item.name}</span>
        <span className="preview-sub">
          {index + 1} of {items.length} · {item.prepared.width} × {item.prepared.height}
          {item.rotation !== 0 && ` · rotated ${item.rotation}°`}
        </span>
        <motion.button className="preview-btn" onClick={() => onRotate(item.id)} aria-label="Rotate 90°" title="Rotate (R)" whileTap={{ scale: 0.85, rotate: 45 }}>
          <RotateIcon size={18} />
        </motion.button>
        <motion.button className="preview-btn" onClick={onClose} aria-label="Close preview" title="Close (Esc)" whileTap={{ scale: 0.85 }}>
          <CloseIcon size={16} />
        </motion.button>
      </motion.div>

      <motion.button
        className="preview-nav preview-prev"
        onClick={(e) => { e.stopPropagation(); step(-1); }}
        disabled={index === 0}
        aria-label="Previous image"
        whileTap={{ scale: 0.85 }}
      >
        <ChevronIcon dir="left" />
      </motion.button>
      <div className="preview-stage" onClick={(e) => e.stopPropagation()}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.img
            key={item.id}
            src={item.thumbUrl}
            alt={item.name}
            className={sideways ? 'preview-img sideways' : 'preview-img'}
            custom={direction}
            initial={{ opacity: 0, x: direction * 80, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: item.rotation }}
            exit={{ opacity: 0, x: direction * -80, scale: 0.94, transition: { duration: 0.15 } }}
            transition={spring}
          />
        </AnimatePresence>
      </div>
      <motion.button
        className="preview-nav preview-next"
        onClick={(e) => { e.stopPropagation(); step(1); }}
        disabled={index === items.length - 1}
        aria-label="Next image"
        whileTap={{ scale: 0.85 }}
      >
        <ChevronIcon dir="right" />
      </motion.button>
    </motion.div>
  );
}
