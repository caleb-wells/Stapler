import type { ReactElement } from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable';
import type { ImageItem } from '../lib/items';
import { ImageCard } from './ImageCard';

interface Props {
  items: ImageItem[];
  onReorder: (items: ImageItem[]) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
  onOpen: (id: string) => void;
}

export function ImageGrid({ items, onReorder, onRemove, onRotate, onOpen }: Props): ReactElement {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
        <ul className="grid">
          {items.map((item, index) => (
            <ImageCard key={item.id} item={item} index={index} onRemove={onRemove} onRotate={onRotate} onOpen={onOpen} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
