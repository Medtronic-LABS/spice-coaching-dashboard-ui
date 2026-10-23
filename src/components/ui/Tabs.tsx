import { type KeyboardEvent, useEffect, useId, useRef } from 'react';
import { cn } from '@/utils';

/**
 * Tabs
 * Accessible tab switcher for toggling between content views.
 *
 * Usage:
 * <Tabs items={[...]} value={active} onChange={setActive} />
 */
export interface TabItem {
  /** Visible tab label. */
  label: React.ReactNode;
  /** Stable tab identifier used for selection state. */
  value: string;
}

export type TabsVariant = 'underline' | 'default' | 'moduleLibrary';

export interface TabsProps {
  /** Ordered list of tabs to render. */
  items: TabItem[];
  /** Currently active tab value. */
  value: string;
  /** Callback fired when a tab is selected. */
  onChange: (value: string) => void;
  /** Optional id prefix used to connect each tab with a tabpanel. */
  idBase?: string;
  /** Optional class overrides for the outer tabs container. */
  className?: string;
  /**
   * `underline` — Team View style (default): text labels with purple underline.
   * `default` and `moduleLibrary` are deprecated pill variants; do not use in new code.
   */
  variant?: TabsVariant;
}

const toIdFragment = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9_-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '') || 'tab';

export const getTabsA11yIds = (idBase: string, value: string) => {
  const itemIdFragment = toIdFragment(value);

  return {
    tabId: `${idBase}-tab-${itemIdFragment}`,
    panelId: `${idBase}-panel-${itemIdFragment}`,
  };
};

export const Tabs = ({
  items,
  value,
  onChange,
  idBase,
  className,
  variant = 'underline',
}: TabsProps) => {
  const reactId = useId();
  const tabsIdBase = idBase ?? `tabs-${reactId.replaceAll(':', '')}`;
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const matchedIndex = items.findIndex((item) => item.value === value);
  let activeIndex = -1;
  if (items.length > 0) {
    activeIndex = matchedIndex === -1 ? 0 : matchedIndex;
  }

  useEffect(() => {
    if (items.length > 0 && matchedIndex === -1) {
      onChange(items[0].value);
    }
  }, [items, matchedIndex, onChange]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (activeIndex === -1) {
      return;
    }

    const focusTab = (index: number) => {
      buttonRefs.current[index]?.focus();
    };

    const moveBy = (offset: number) => {
      const nextIndex = (activeIndex + offset + items.length) % items.length;
      onChange(items[nextIndex].value);
      focusTab(nextIndex);
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
        focusTab(0);
        break;
      case 'End':
        event.preventDefault();
        onChange((items.at(-1) ?? items[0]).value);
        focusTab(items.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      className={cn(
        'flex w-full',
        variant === 'underline'
          ? 'gap-6 border-b border-spice-border'
          : variant === 'default'
            ? 'gap-1 overflow-x-auto rounded-lg bg-spice-bg-tint p-1'
            : 'items-center gap-2 overflow-x-auto',
        className,
      )}
      role="tablist"
    >
      {items.map((item, index) => {
        const isActive = index === activeIndex;
        const { tabId, panelId } = getTabsA11yIds(tabsIdBase, item.value);

        return (
          <button
            key={item.value}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            id={tabId}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'whitespace-nowrap transition',
              variant === 'underline'
                ? cn(
                    '-mb-px border-b-2 pb-2.5 text-sm font-medium',
                    isActive
                      ? 'border-spice-palette-purple text-spice-palette-purple'
                      : 'border-transparent text-spice-text-muted hover:text-spice-text-primary',
                  )
                : variant === 'default'
                  ? cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium',
                      isActive
                        ? 'bg-spice-bg-surface text-spice-palette-violetDeep shadow-sm'
                        : 'text-spice-text-muted hover:text-spice-palette-violetDeep',
                    )
                  : cn(
                      'inline-flex h-8 items-center rounded-lg border px-3 py-0 text-sm leading-none',
                      isActive
                        ? 'border-spice-palette-violet bg-spice-palette-violetLt font-semibold text-spice-palette-violetDeep'
                        : 'border-spice-border font-normal text-spice-text-onSurfaceVariant hover:text-spice-palette-violetDeep',
                    ),
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};
