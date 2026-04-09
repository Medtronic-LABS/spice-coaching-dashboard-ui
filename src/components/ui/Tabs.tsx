import { type KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';

/**
 * Tabs
 * Accessible tab switcher for toggling between content views.
 *
 * Usage:
 * <Tabs items={[...]} value={active} onChange={setActive} />
 */
export interface TabItem {
  /** Visible tab label. */
  label: string;
  /** Stable tab identifier used for selection state. */
  value: string;
}

export interface TabsProps {
  /** Ordered list of tabs to render. */
  items: TabItem[];
  /** Currently active tab value. */
  value: string;
  /** Callback fired when a tab is selected. */
  onChange: (value: string) => void;
  /** Optional class overrides for the outer tabs container. */
  className?: string;
}

export const Tabs = ({ items, value, onChange, className }: TabsProps) => {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (items.length === 0) {
      return;
    }

    // Supports circular keyboard navigation (last -> first, first -> last).
    const moveBy = (offset: number) => {
      const nextIndex = (selectedIndex + offset + items.length) % items.length;
      onChange(items[nextIndex].value);
    };

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        moveBy(1);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        moveBy(-1);
        break;
      case 'Home':
        event.preventDefault();
        onChange(items[0].value);
        break;
      case 'End':
        event.preventDefault();
        onChange((items.at(-1) ?? items[0]).value);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={cn(
        'flex w-full overflow-x-auto rounded-lg bg-slate-100 p-1 scrollbar-thin',
        className,
      )}
      role="tablist"
    >
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
