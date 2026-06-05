import { Button, Card, Loader } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useAdminModuleReviewEditor } from '@/features/module-library/hooks/useAdminModuleReviewEditor';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import {
  selectAdminModuleBaseline,
  insertCardAtIndex,
  removeCardAtIndex,
  updateCardAtIndex,
} from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cardTitle(card: unknown): string {
  if (!isPlainObject(card)) return 'Untitled card';
  const title =
    (typeof card.title_en === 'string' && card.title_en) ||
    (typeof card.title_bn === 'string' && card.title_bn) ||
    (typeof card.title === 'string' && card.title) ||
    '';
  return title || 'Untitled card';
}

function cardSubtitle(card: unknown): string {
  if (!isPlainObject(card)) return '';
  const bn = typeof card.title_bn === 'string' ? card.title_bn : '';
  const en = typeof card.title_en === 'string' ? card.title_en : '';
  if (bn && en) return bn;
  return bn || en ? '' : '';
}

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function hasEnglishContent(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  const titleEn =
    typeof value.title_en === 'string' ? value.title_en.trim() : '';
  const bodyEn = typeof value.body_en === 'string' ? value.body_en.trim() : '';
  return Boolean(titleEn || bodyEn);
}

function createEmptyCard(): AdminModuleCard {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `card-${Date.now()}`;
  return {
    id,
    title_bn: null,
    title_en: null,
    body_bn: normalizeCardBody(''),
    body_en: null,
    previous_practice_bn: null,
    current_practice_bn: null,
    previous_practice_en: null,
    current_practice_en: null,
  };
}

export const AdminModuleLessonsStep = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const baseline = useAppSelector(selectAdminModuleBaseline);
  const {
    working,
    isLoading,
    isFetching,
    error,
    refetch,
    isSaving,
    save,
    formatError,
  } = useAdminModuleReviewEditor(moduleId);

  const [actionError, setActionError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editorRevision, setEditorRevision] = useState(0);
  const [sourceDocOpen, setSourceDocOpen] = useState(false);
  const isReadonly = useAdminModuleReviewReadonly();

  useEffect(() => {
    setSelectedIndex(0);
  }, [working?.id]);

  const cards = (working?.cards ?? []) as unknown[];
  const selectedCard = cards[selectedIndex] as unknown;

  const patchSelectedCard = (patch: Record<string, unknown>) => {
    if (!isPlainObject(selectedCard)) return;
    dispatch(
      updateCardAtIndex({
        index: selectedIndex,
        card: { ...selectedCard, ...patch },
      }),
    );
  };

  if (isLoading && !working) {
    return <Loader label="Loading module…" />;
  }

  if (error || !working) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatError(error) : 'Module not found.'}
        </p>
        <Button variant="secondary" onClick={() => void refetch()}>
          Retry
        </Button>
      </Card>
    );
  }

  const busy = isFetching || isSaving;
  const showEnglishFields =
    Boolean(data.title_en && data.title_en.trim()) ||
    cards.some((c) => hasEnglishContent(c));
  const showCardTitleEn =
    showEnglishFields || hasEnglishContent(mergedSelectedCard);

  return (
    <section className="space-y-4">
      {actionError ? (
        <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card variant="elevated" className="space-y-3 p-4">
          <div>
            <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Module
            </div>
            <div className="mt-1 text-sm font-semibold text-spice-text-primary">
              {working.title_en ?? working.title_bn ?? 'Untitled module'}
            </div>
            <div className="mt-1 text-xs text-spice-text-muted">
              {cards.length} cards · ~{working.estimated_minutes} min
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {cards.map((c, idx) => (
              <button
                key={String(
                  isPlainObject(c) && typeof c.id === 'string' ? c.id : idx,
                )}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                  selectedIndex === idx
                    ? 'bg-spice-bg-tint text-spice-brand-primary ring-1 ring-spice-border'
                    : 'text-spice-text-medium'
                }`}
              >
                <div className="truncate font-semibold">{cardTitle(c)}</div>
                {cardSubtitle(c) ? (
                  <div className="truncate text-[11px] text-spice-text-muted">
                    {cardSubtitle(c)}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-spice-text-muted">
                  <span>Card {idx + 1}</span>
                </div>
              </button>
            ))}
            {!cards.length ? (
              <div className="text-xs text-spice-text-muted">No cards.</div>
            ) : null}
          </div>
        </Card>

        <Card variant="elevated" className="space-y-4 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div className="text-2xl font-semibold text-spice-text-primary">
                Lesson content
              </div>
              <div className="mt-1 text-xs text-spice-text-muted">
                Editing card {cards.length ? selectedIndex + 1 : 0} of{' '}
                {cards.length}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {hasSourceDocuments ? (
                <Button
                  variant="secondary"
                  className="h-9 text-xs"
                  onClick={() => setSourceDocOpen((open) => !open)}
                >
                  {sourceDocOpen
                    ? 'Hide source'
                    : sourceDocuments.length > 1
                      ? `Show source (${sourceDocuments.length})`
                      : 'Show source'}
                </Button>
              ) : null}
              {!isReadonly ? (
                <>
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    disabled={busy}
                    onClick={() => {
                      setActionError('');
                      const next = createEmptyCard();
                      const insertAt = cards.length ? selectedIndex + 1 : 0;
                      dispatch(
                        insertCardAtIndex({ index: insertAt, card: next }),
                      );
                      setSelectedIndex(insertAt);
                      setEditorRevision((revision) => revision + 1);
                    }}
                  >
                    Add card
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    disabled={busy || !cards.length}
                    onClick={() => {
                      setActionError('');
                      const idx = selectedIndex;
                      dispatch(removeCardAtIndex({ index: idx }));
                      const nextIndex =
                        idx > 0 ? idx - 1 : Math.max(0, cards.length - 2);
                      setSelectedIndex(nextIndex);
                      setEditorRevision((revision) => revision + 1);
                    }}
                  >
                    Delete card
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-9 text-xs"
                    disabled={busy || !cards.length || !cardIsEdited}
                    onClick={() => {
                      setActionError('');
                      if (baselineCard) {
                        dispatch(
                          updateCardAtIndex({
                            index: selectedIndex,
                            card: baselineCard,
                          }),
                        );
                        setEditorRevision((revision) => revision + 1);
                      }
                    }}
                  >
                    Reset card
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {cards.length ? (
            <>
              <div
                className={`grid gap-3 ${
                  showCardTitleEn ? 'md:grid-cols-2' : 'md:grid-cols-1'
                }`}
              >
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Title (BN)
                  </span>
                  <input
                    className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                    value={safeString(selectedCard.title_bn)}
                    disabled={busy || isReadonly}
                    onChange={(e) =>
                      patchSelectedCard({ title_bn: e.target.value })
                    }
                    placeholder="Bangla title…"
                  />
                </label>
                {showCardTitleEn ? (
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-spice-text-primary">
                      Title (EN)
                    </span>
                    <input
                      className="h-10 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm"
                      value={safeString(
                        selectedCard.title_en ?? selectedCard.title,
                      )}
                      disabled={busy || isReadonly}
                      onChange={(e) =>
                        updateSelectedCard({ title_en: e.target.value })
                      }
                      placeholder="English title…"
                    />
                  </label>
                ) : null}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-spice-text-primary">
                  Body/content (BN)
                </span>
                <RichTextEditor
                  key={`card-body-${selectedIndex}-${selectedCard.id}-${editorRevision}`}
                  value={selectedBody}
                  onChange={(body_bn) => updateSelectedCard({ body_bn })}
                  minHeightClassName="min-h-[220px]"
                  readOnly={isReadonly}
                />
              </div>
            </>
          ) : (
            <div className="text-sm text-spice-text-muted">
              No cards to edit.
            </div>
          )}

          <div className="flex justify-end gap-2">
            {!isReadonly ? (
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={busy}
                onClick={async () => {
                  setActionError('');
                  try {
                    await save();
                  } catch (err) {
                    setActionError(formatError(err));
                  }
                }}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            ) : null}
            <Button
              className="h-9 text-xs"
              disabled={busy}
              onClick={() =>
                navigate(
                  paths.adminModuleReviewQuiz.replace(
                    ':moduleId',
                    encodeURIComponent(working.id),
                  ),
                )
              }
            >
              Continue to Quiz
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
};
