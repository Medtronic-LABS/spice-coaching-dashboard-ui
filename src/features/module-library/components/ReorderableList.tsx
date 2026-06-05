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
  moveUp: () => void;
  moveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
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
  /** `plain` omits the outer row chrome when the child supplies its own card border. */
  rowVariant?: ReorderableListRowVariant;
}

interface SortableRowProps<T> {
  item: T;
  index: number;
  itemId: string;
  disabled: boolean;
  itemCount: number;
  rowVariant: ReorderableListRowVariant;
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: ReorderableListProps<T>['renderItem'];
}

function SortableRow<T>({
  item,
  index,
  itemId,
  disabled,
  itemCount,
  rowVariant,
  onReorder,
  renderItem,
}: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: itemId, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const canMoveUp = !disabled && index > 0;
  const canMoveDown = !disabled && index < itemCount - 1;

  const controls: ReorderableItemControls = {
    dragHandleProps: {
      ref: setActivatorNodeRef,
      ...attributes,
      ...listeners,
      'aria-label': 'Drag to reorder',
      className: cn(
        'cursor-grab touch-none active:cursor-grabbing',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
      ),
    },
    moveUp: () => {
      if (canMoveUp) onReorder(index, index - 1);
    },
    moveDown: () => {
      if (canMoveDown) onReorder(index, index + 1);
    },
    canMoveUp,
    canMoveDown,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        rowVariant === 'default' &&
          'rounded-xl bg-spice-bg-surface ring-1 ring-spice-border/70',
        isDragging && 'opacity-80 shadow-md',
      )}
    >
      <div
        className={cn(
          'flex items-start gap-2',
          rowVariant === 'default' ? 'p-3' : 'py-0',
        )}
      >
        <div className="min-w-0 flex-1">
          {renderItem(item, index, controls)}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <MoveButton
            label="Move up"
            disabled={!canMoveUp}
            onClick={controls.moveUp}
          >
            <ChevronUpIcon />
          </MoveButton>
          <MoveButton
            label="Move down"
            disabled={!canMoveDown}
            onClick={controls.moveDown}
          >
            <ChevronDownIcon />
          </MoveButton>
        </div>
      </div>
    </div>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-spice-text-medium ring-1 ring-spice-border hover:bg-spice-bg-tint disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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

function ChevronUpIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.5 7 5l3.5 3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        d="M3.5 5.5 7 9l3.5-3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ReorderableList<T>({
  items,
  getItemId,
  onReorder,
  renderItem,
  disabled = false,
  rowVariant = 'default',
}: ReorderableListProps<T>) {
  const itemIds = items.map((item, index) => getItemId(item, index));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;

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
              itemCount={items.length}
              rowVariant={rowVariant}
              onReorder={onReorder}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
