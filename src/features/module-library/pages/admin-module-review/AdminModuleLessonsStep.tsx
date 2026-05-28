import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, LoadingState } from '@/components/ui';
import { paths } from '@/constants/routes';
import { useEditModuleMutation } from '@/features/module-library/api/adminModulesApi';
import { useAdminModuleDetailQuery } from '@/features/module-library/hooks/useAdminModuleDetailQuery';
import { applyEditModuleAndSyncRoute } from '@/features/module-library/utils/applyEditModuleAndSyncRoute';
import { formatRtkQueryError } from '@/features/program-manager/utils/formatRtkQueryError';

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

export const AdminModuleLessonsStep = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { moduleId = '' } = useParams<{ moduleId: string }>();
  const { data, isLoading, isFetching, error, refetch } =
    useAdminModuleDetailQuery(moduleId, { skip: !moduleId });
  const [editModule, { isLoading: isSaving }] = useEditModuleMutation();

  const [actionError, setActionError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cardEdits, setCardEdits] = useState<Record<number, unknown>>({});

  useEffect(() => {
    if (!data) return;
    setSelectedIndex(0);
    setCardEdits({});
  }, [data]);

  const cards = (data?.cards ?? []) as unknown[];
  const selectedCard = cards[selectedIndex];
  const mergedSelectedCard = (cardEdits[selectedIndex] ??
    selectedCard) as unknown;

  if (isLoading && !data) {
    return (
      <Card variant="elevated" className="p-10">
        <LoadingState label="Loading module…" />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card variant="elevated" className="space-y-3 p-6">
        <p className="text-sm text-spice-semantic-error">
          {error ? formatRtkQueryError(error) : 'Module not found.'}
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
              {data.title_en ?? data.title_bn ?? 'Untitled module'}
            </div>
            <div className="mt-1 text-xs text-spice-text-muted">
              {cards.length} cards · ~{data.estimated_minutes} min
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
                  {cardEdits[idx] ? (
                    <span className="rounded-full bg-spice-bg-surface px-2 py-0.5 font-semibold ring-1 ring-spice-border">
                      Edited
                    </span>
                  ) : null}
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
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="h-9 text-xs"
                disabled={busy || !cards.length}
                onClick={() => {
                  setActionError('');
                  setCardEdits((prev) => {
                    const next = { ...prev };
                    delete next[selectedIndex];
                    return next;
                  });
                }}
              >
                Reset card
              </Button>
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
                    value={
                      isPlainObject(mergedSelectedCard)
                        ? safeString(mergedSelectedCard.title_bn)
                        : ''
                    }
                    onChange={(e) =>
                      setCardEdits((prev) => ({
                        ...prev,
                        [selectedIndex]: {
                          ...(isPlainObject(mergedSelectedCard)
                            ? mergedSelectedCard
                            : {}),
                          title_bn: e.target.value,
                        },
                      }))
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
                      value={
                        isPlainObject(mergedSelectedCard)
                          ? safeString(
                              mergedSelectedCard.title_en ??
                                mergedSelectedCard.title,
                            )
                          : ''
                      }
                      onChange={(e) =>
                        setCardEdits((prev) => ({
                          ...prev,
                          [selectedIndex]: {
                            ...(isPlainObject(mergedSelectedCard)
                              ? mergedSelectedCard
                              : {}),
                            title_en: e.target.value,
                          },
                        }))
                      }
                      placeholder="English title…"
                    />
                  </label>
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-1">
                <label className="block space-y-1">
                  <span className="text-xs font-semibold text-spice-text-primary">
                    Body/content (BN)
                  </span>
                  <textarea
                    className="min-h-[220px] w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 py-2 text-sm"
                    value={
                      isPlainObject(mergedSelectedCard)
                        ? safeString(mergedSelectedCard.body_bn)
                        : ''
                    }
                    onChange={(e) =>
                      setCardEdits((prev) => ({
                        ...prev,
                        [selectedIndex]: {
                          ...(isPlainObject(mergedSelectedCard)
                            ? mergedSelectedCard
                            : {}),
                          body_bn: e.target.value,
                        },
                      }))
                    }
                    placeholder="Bangla content…"
                  />
                </label>
                {/*
                Card body (EN) intentionally hidden.
                */}
              </div>
            </>
          ) : (
            <div className="text-sm text-spice-text-muted">
              No cards to edit.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              className="h-9 text-xs"
              disabled={busy}
              onClick={async () => {
                setActionError('');
                try {
                  const nextCards = cards.map((c, idx) => cardEdits[idx] ?? c);
                  await applyEditModuleAndSyncRoute({
                    editModule,
                    navigate,
                    pathname,
                    moduleEntityId: data.id,
                    body: {
                      title_en: showEnglishFields
                        ? (data.title_en ?? undefined)
                        : undefined,
                      module_json: { cards: nextCards, quiz: data.quiz },
                    },
                    refetch,
                  });
                } catch (err) {
                  setActionError(formatRtkQueryError(err));
                }
              }}
            >
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
            <Button
              className="h-9 text-xs"
              disabled={busy}
              onClick={() =>
                navigate(
                  paths.adminModuleReviewQuiz.replace(
                    ':moduleId',
                    encodeURIComponent(data.id),
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
