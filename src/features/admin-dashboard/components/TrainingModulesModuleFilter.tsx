import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronIcon } from '@/assets/icon';
import { Button, SearchInput } from '@/components/ui';
import { SPICE_CHECKBOX_CLASSNAME } from '@/constants/formControls';
import { useFetchModulesQuery } from '@/features/modules/api/adminModulesApi';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { resolveDisplayText } from '@/config/deploymentLocale';
import { cn } from '@/utils';

const FILTER_PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
/** Matches Tailwind `w-72`. */
const PANEL_WIDTH_PX = 288;
const PANEL_GAP_PX = 4;
const VIEWPORT_EDGE_PX = 8;

interface TrainingModulesModuleFilterProps {
  selectedIds: string[];
  onChange: (moduleIds: string[]) => void;
}

function sameIdSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

function computePanelStyle(trigger: HTMLElement): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = rect.right - PANEL_WIDTH_PX;
  left = Math.max(
    VIEWPORT_EDGE_PX,
    Math.min(left, viewportWidth - PANEL_WIDTH_PX - VIEWPORT_EDGE_PX),
  );

  const spaceBelow =
    viewportHeight - rect.bottom - PANEL_GAP_PX - VIEWPORT_EDGE_PX;
  const spaceAbove = rect.top - PANEL_GAP_PX - VIEWPORT_EDGE_PX;
  const placeBelow = spaceBelow >= 200 || spaceBelow >= spaceAbove;

  return {
    position: 'fixed',
    top: placeBelow ? rect.bottom + PANEL_GAP_PX : undefined,
    bottom: placeBelow ? undefined : viewportHeight - rect.top + PANEL_GAP_PX,
    left,
    width: PANEL_WIDTH_PX,
    maxHeight: Math.max(160, placeBelow ? spaceBelow : spaceAbove),
    zIndex: 40,
  };
}

/**
 * Multi-select module filter with draft selection.
 * Checkboxes update a draft; Apply commits to the parent (one API refetch).
 * Clear empties the applied filter immediately.
 *
 * Panel is portaled to `document.body` so it is not clipped by
 * `DashboardWidgetShell`'s `overflow-hidden` when the widget is short.
 */
export const TrainingModulesModuleFilter = ({
  selectedIds,
  onChange,
}: TrainingModulesModuleFilterProps) => {
  const { t } = useTranslation();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const draftSet = useMemo(() => new Set(draftIds), [draftIds]);
  const hasDraftChanges = !sameIdSet(draftIds, selectedIds);

  const { data, isFetching } = useFetchModulesQuery({
    status: 'published',
    chatbot_faqs_only: false,
    limit: FILTER_PAGE_SIZE,
    offset: 0,
    q: debouncedSearch.trim() || undefined,
    sort_by: 'title',
    sort_dir: 'asc',
  });

  const options = useMemo(
    () =>
      (data?.modules ?? []).map((module) => ({
        id: module.id,
        title: resolveDisplayText(module.title) || module.id,
      })),
    [data?.modules],
  );

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    setPanelStyle(computePanelStyle(trigger));
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePanelPosition();
    return undefined;
  }, [open, updatePanelPosition, options.length, isFetching]);

  useEffect(() => {
    if (!open) return undefined;

    const onReposition = () => updatePanelPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
      setSearchTerm('');
      setDraftIds(selectedIds);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, selectedIds]);

  const discardAndClose = () => {
    setOpen(false);
    setSearchTerm('');
    setDraftIds(selectedIds);
  };

  const openPanel = () => {
    setDraftIds(selectedIds);
    setSearchTerm('');
    if (triggerRef.current) {
      setPanelStyle(computePanelStyle(triggerRef.current));
    }
    setOpen(true);
  };

  const toggleDraft = (moduleId: string) => {
    setDraftIds((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId],
    );
  };

  const applyDraft = () => {
    onChange(draftIds);
    setOpen(false);
    setSearchTerm('');
  };

  const clearApplied = () => {
    setDraftIds([]);
    onChange([]);
    setOpen(false);
    setSearchTerm('');
  };

  const selectedLabel =
    selectedIds.length === 0
      ? t('adminDashboard.trainingModules.filter.allModules')
      : t('adminDashboard.trainingModules.filter.selectedCount', {
          count: selectedIds.length,
        });

  const panel =
    open && panelStyle
      ? createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="flex flex-col rounded-lg border border-spice-border-mid bg-spice-bg-surface p-2 shadow-lg"
          >
            <div className="mb-2 shrink-0">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder={t(
                  'adminDashboard.trainingModules.filter.searchPlaceholder',
                )}
                aria-label={t(
                  'adminDashboard.trainingModules.filter.searchAriaLabel',
                )}
              />
            </div>
            <ul
              id={listId}
              role="listbox"
              aria-multiselectable
              className="min-h-0 max-h-56 flex-1 space-y-1 overflow-y-auto"
            >
              {isFetching && options.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-spice-text-muted">
                  {t('adminDashboard.trainingModules.filter.loading')}
                </li>
              ) : options.length === 0 ? (
                <li className="px-2 py-1.5 text-xs text-spice-text-muted">
                  {t('adminDashboard.trainingModules.filter.empty')}
                </li>
              ) : (
                options.map((option) => {
                  const checked = draftSet.has(option.id);
                  return (
                    <li key={option.id} role="option" aria-selected={checked}>
                      <label className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-xs text-spice-text-primary hover:bg-spice-bg-tint">
                        <input
                          type="checkbox"
                          className={SPICE_CHECKBOX_CLASSNAME}
                          checked={checked}
                          onChange={() => toggleDraft(option.id)}
                        />
                        <span className="min-w-0 break-words">
                          {option.title}
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="mt-2 flex shrink-0 items-center justify-between gap-2 border-t border-spice-border pt-2">
              <Button
                variant="ghost"
                className="h-8 px-2 text-xs"
                disabled={selectedIds.length === 0 && draftIds.length === 0}
                onClick={clearApplied}
              >
                {t('adminDashboard.trainingModules.filter.clear')}
              </Button>
              <Button
                className="h-8 px-3 text-xs"
                disabled={!hasDraftChanges}
                onClick={applyDraft}
              >
                {t('adminDashboard.trainingModules.filter.apply')}
              </Button>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative w-56">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-spice-border-mid bg-spice-bg-surface px-3 text-left text-xs text-spice-text-primary',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('adminDashboard.trainingModules.filter.ariaLabel')}
        onClick={() => {
          if (open) {
            discardAndClose();
            return;
          }
          openPanel();
        }}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronIcon
          className="h-3.5 w-3.5 shrink-0 text-spice-text-muted"
          expanded={open}
        />
      </button>
      {panel}
    </div>
  );
};
