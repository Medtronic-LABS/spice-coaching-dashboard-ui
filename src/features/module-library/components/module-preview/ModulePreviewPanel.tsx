import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ModulePreviewNavigator } from '@/features/module-library/components/module-preview/ModulePreviewNavigator';
import { useAdminModuleReviewReadonly } from '@/features/module-library/hooks/useAdminModuleReviewReadonly';
import { useModulePreview } from '@/features/module-library/hooks/useModulePreview';
import { selectAdminModuleWorking } from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppSelector } from '@/store/hooks';

export interface ModulePreviewPanelProps {
  onClose?: () => void;
}

export const ModulePreviewPanel = ({ onClose }: ModulePreviewPanelProps) => {
  const {
    snapshot,
    position,
    syncError,
    isSyncing,
    isStale,
    syncPreview,
    setPosition,
    closePreview,
  } = useModulePreview();
  const working = useAppSelector(selectAdminModuleWorking);
  const isReadonly = useAdminModuleReviewReadonly();

  const handleClose = () => {
    closePreview();
    onClose?.();
  };

  const isEmpty =
    snapshot !== null &&
    snapshot.cards.length === 0 &&
    snapshot.quiz.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-spice-border px-4 py-3">
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
          {onClose ? (
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
          ) : null}
        </div>
      </div>

      {syncError ? (
        <div className="mx-4 mt-3 shrink-0 rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
          {syncError}
        </div>
      ) : null}

      <div className="relative flex h-0 min-h-0 flex-1 flex-col overflow-hidden px-4 py-2">
        {snapshot ? (
          isEmpty ? (
            <div className="rounded-lg border border-dashed border-spice-border px-4 py-8 text-center text-sm text-spice-text-muted">
              No cards or quiz questions to preview. Add content, then sync
              preview.
            </div>
          ) : (
            <ModulePreviewNavigator
              snapshot={snapshot}
              position={position}
              onPositionChange={setPosition}
            />
          )
        ) : (
          <div className="text-sm text-spice-text-muted">Loading preview…</div>
        )}
      </div>

      <Loader open={isSyncing} label="Syncing preview…" />
    </div>
  );
};
