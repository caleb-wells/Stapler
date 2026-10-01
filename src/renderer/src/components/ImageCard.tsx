import type { ReactElement } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ImageItem } from '../lib/items';

interface Props {
  item: ImageItem;
  index: number;
  onRemove: (id: string) => void;
}

export function ImageCard({ item, index, onRemove }: Props): ReactElement {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <li ref={setNodeRef} style={style} className={`card card-${item.status}`}>
      <button className="handle" aria-label="Drag to reorder" {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <div className="thumb">
        {item.status === 'ready' && <img src={item.thumbUrl} alt="" />}
        {item.status === 'loading' && <span className="spinner" aria-label="Loading" />}
        {item.status === 'error' && <span className="error-badge">!</span>}
      </div>
      <div className="meta">
        <span className="page-no">{index + 1}</span>
        <span className="name" title={item.path}>{item.name}</span>
        {item.status === 'ready' && (
          <span className="dims">{item.prepared.width} × {item.prepared.height}</span>
        )}
        {item.status === 'error' && <span className="error-text">{item.error}</span>}
      </div>
      <button className="remove" aria-label={`Remove ${item.name}`} onClick={() => onRemove(item.id)}>
        ×
      </button>
    </li>
  );
}
