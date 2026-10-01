import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ImageItem } from '../lib/items';
import { RotateIcon } from './icons';

interface Props {
  item: ImageItem;
  index: number;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onOpen: (id: string) => void;
}

const spring = { type: 'spring', stiffness: 320, damping: 28 } as const;

export function ImageCard({ item, index, onRemove, onRotate, onOpen }: Props): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 5 : undefined };

  return (
    <li ref={setNodeRef} style={style} className={`card-slot ${isDragging ? 'dragging' : ''}`}>
      <motion.div
        className={`card card-${item.status}`}
        initial={{ opacity: 0, scale: 0.88, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.18 } }}
        transition={spring}
        whileHover={{ y: -3 }}
      >
        <button className="handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
          <svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
            <circle cx="2.5" cy="8" r="1.5" /><circle cx="7.5" cy="8" r="1.5" />
            <circle cx="2.5" cy="13.5" r="1.5" /><circle cx="7.5" cy="13.5" r="1.5" />
          </svg>
        </button>
        <button
          type="button"
          className={`thumb ${item.status === 'ready' ? 'thumb-clickable' : ''}`}
          onClick={() => item.status === 'ready' && onOpen(item.id)}
          aria-label={item.status === 'ready' ? `Preview ${item.name}` : undefined}
          disabled={item.status !== 'ready'}
        >
          {item.status === 'ready' && (
            <motion.img
              src={item.thumbUrl}
              alt=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, rotate: item.rotation }}
              transition={{ opacity: { duration: 0.25 }, rotate: spring }}
            />
          )}
          {item.status === 'loading' && <span className="spinner" aria-label="Loading" />}
          {item.status === 'error' && (
            <motion.span className="error-badge" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}>
              !
            </motion.span>
          )}
        </button>
        <div className="meta">
          <span className="page-no">{index + 1}</span>
          <span className="name" title={item.path}>{item.name}</span>
          {item.status === 'ready' && (
            <span className="dims">
              {item.prepared.width} × {item.prepared.height}
              {item.rotation !== 0 && <span className="rot-badge">{item.rotation}°</span>}
            </span>
          )}
          {item.status === 'error' && <span className="error-text">{item.error}</span>}
        </div>
        {item.status === 'ready' && (
          <motion.button
            className="rotate"
            aria-label={`Rotate ${item.name}`}
            title="Rotate 90°"
            onClick={() => onRotate(item.id)}
            whileTap={{ scale: 0.85, rotate: 45 }}
          >
            <RotateIcon />
          </motion.button>
        )}
        <motion.button className="remove" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)} whileTap={{ scale: 0.85 }}>
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M2 2l8 8M10 2l-8 8" />
          </svg>
        </motion.button>
      </motion.div>
    </li>
  );
}
