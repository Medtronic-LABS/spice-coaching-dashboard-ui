import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { cn } from '@/utils';

export type ReorderableDragHandleProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    ref?: Ref<HTMLButtonElement>;
  };

export interface ReorderableItemControls {
  dragHandleProps: ReorderableDragHandleProps;
}

export type ReorderableListRowVariant = 'default' | 'plain';

export interface ReorderableListProps<T> {
  items: T[];
  getItemId: (item: T, index: number) => string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (
    item: T,
    index: number,
    controls: ReorderableItemControls,
  ) => ReactNode;
  disabled?: boolean;
  /** When true, reordering is disabled and drag handles are hidden (e.g. supervisor read-only). */
  readOnly?: boolean;
  /** `plain` omits the outer row chrome when the child supplies its own card border. */
  rowVariant?: ReorderableListRowVariant;
}

interface SortableRowProps<T> {
  item: T;
  index: number;
  itemId: string;
  disabled: boolean;
  readOnly: boolean;
  rowVariant: ReorderableListRowVariant;
  renderItem: ReorderableListProps<T>['renderItem'];
}

function SortableRow<T>({
  item,
  index,
  itemId,
  disabled,
  readOnly,
  rowVariant,
  renderItem,
}: SortableRowProps<T>) {
  const reorderDisabled = disabled || readOnly;
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId, disabled: reorderDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const controls: ReorderableItemControls = {
    dragHandleProps: {
      ref: setActivatorNodeRef,
      ...attributes,
      ...listeners,
      'aria-label': 'Drag to reorder',
      className: cn(
        'cursor-grab touch-none active:cursor-grabbing',
        reorderDisabled && 'pointer-events-none cursor-not-allowed opacity-50',
      ),
    },
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        rowVariant === 'default' &&
          'rounded-xl bg-spice-bg-surface p-3 ring-1 ring-spice-border/70',
        isDragging && 'opacity-80 shadow-md',
      )}
    >
      {renderItem(item, index, controls)}
    </div>
  );
}

export function ReorderDragHandle({
  dragHandleProps,
}: {
  dragHandleProps: ReorderableDragHandleProps;
}) {
  return (
    <button
      type="button"
      {...dragHandleProps}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded p-1 text-spice-text-medium hover:bg-spice-bg-tint',
        dragHandleProps.className,
      )}
    >
      <GripIcon />
    </button>
  );
}

function GripIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="5" cy="4" r="1.25" />
      <circle cx="11" cy="4" r="1.25" />
      <circle cx="5" cy="8" r="1.25" />
      <circle cx="11" cy="8" r="1.25" />
      <circle cx="5" cy="12" r="1.25" />
      <circle cx="11" cy="12" r="1.25" />
    </svg>
  );
}

export function ReorderableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  disabled = false,
  readOnly = false,
  rowVariant = 'default',
}: ReorderableListProps<T>) {
  const reorderDisabled = disabled || readOnly;
  const itemIds = items.map((item, index) => getItemId(item, index));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || reorderDisabled) return;

    const fromIndex = itemIds.indexOf(String(active.id));
    const toIndex = itemIds.indexOf(String(over.id));
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    onReorder(fromIndex, toIndex);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <SortableRow
              key={itemIds[index]}
              item={item}
              index={index}
              itemId={itemIds[index]}
              disabled={disabled}
              readOnly={readOnly}
              rowVariant={rowVariant}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
