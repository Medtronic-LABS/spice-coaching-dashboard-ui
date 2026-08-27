import { Banner, Button, EmptyState, Loader } from '@/components/ui';
import { ModulePreviewNavigator } from '@/features/modules/components/module-preview/ModulePreviewNavigator';
import { useAdminModuleReviewReadonly } from '@/features/modules/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/modules/hooks/useModulePreview';
import { selectAdminModuleWorking } from '@/features/modules/store/adminModuleReviewSlice';
import { useAppSelector } from '@/store/hooks';

export const ModulePreviewPanel = () => {
  const {
    snapshot,
    position,
    syncError,
    isSyncing,
    isStale,
    syncPreview,
    setPosition,
  } = useModulePreview();
  const working = useAppSelector(selectAdminModuleWorking);
  const isReadonly = useAdminModuleReviewReadonly();

  const isEmpty =
    snapshot !== null &&
    snapshot.cards.length === 0 &&
    snapshot.quiz.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-spice-border px-4 py-3 pr-12">
        <div className="min-w-0">
          <h2
            id="module-preview-modal-title"
            className="text-sm font-semibold text-spice-text-primary"
          >
            Module Preview
          </h2>
          {isStale ? (
            <p className="text-xs text-spice-text-muted">Edits not synced</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isReadonly ? (
            <Button
              variant="secondary"
              onClick={syncPreview}
              disabled={isSyncing || !working}
            >
              {isSyncing ? 'Syncing…' : 'Sync preview'}
            </Button>
          ) : null}
        </div>
      </div>

      {syncError ? (
        <div className="mx-4 mt-3 shrink-0">
          <Banner tone="critical">{syncError}</Banner>
        </div>
      ) : null}

      <div className="relative flex h-0 min-h-0 flex-1 flex-col overflow-hidden px-4 py-2">
        {snapshot ? (
          isEmpty ? (
            <EmptyState
              title="No cards or quiz questions to preview"
              description="Add content, then sync preview."
            />
          ) : (
            <ModulePreviewNavigator
              snapshot={snapshot}
              position={position}
              onPositionChange={setPosition}
            />
          )
        ) : null}
      </div>

      <Loader
        open={isSyncing || !snapshot}
        label={isSyncing ? 'Syncing preview…' : 'Loading preview…'}
      />
    </div>
  );
};
