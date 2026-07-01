import { Button, Modal } from '@/components/ui';
import { ModulePreviewPanel } from '@/features/module-library/components/module-preview/ModulePreviewPanel';
import { useModulePreview } from '@/features/module-library/hooks/useModulePreview';
import { useEffect, useState, type ReactNode } from 'react';

function SmartphonePreviewIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="5.5" y="2.5" width="9" height="15" rx="1.5" />
      <circle cx="10" cy="15.5" r="0.75" fill="currentColor" stroke="none" />
      <path d="M8.5 4.5h3" strokeLinecap="round" />
    </svg>
  );
}

function PanelCloseIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 shrink-0"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M5 5l10 10M15 5 5 15" strokeLinecap="round" />
    </svg>
  );
}

function PreviewToggleLabel({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <>
      {icon}
      <span>{label}</span>
    </>
  );
}

function useIsXlScreen(): boolean {
  const [isXl, setIsXl] = useState(
    () => window.matchMedia('(min-width: 1280px)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const handleChange = () => setIsXl(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isXl;
}

export const ModulePreviewToggleButton = () => {
  const { isOpen, isStale, openPreview, closePreview } = useModulePreview();

  return (
    <Button
      variant="secondary"
      className="relative inline-flex h-9 items-center gap-1.5 text-xs"
      onClick={() => (isOpen ? closePreview() : openPreview())}
    >
      {isOpen ? (
        <PreviewToggleLabel icon={<PanelCloseIcon />} label="Hide preview" />
      ) : (
        <PreviewToggleLabel icon={<SmartphonePreviewIcon />} label="Preview" />
      )}
      {!isOpen && isStale ? (
        <span
          className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-amber-400"
          aria-hidden="true"
        />
      ) : null}
    </Button>
  );
};

export const ModulePreviewSidePanel = () => {
  const { isOpen } = useModulePreview();
  const isXl = useIsXlScreen();

  if (!isOpen || !isXl) return null;

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-11rem)] max-h-[calc(100vh-11rem)] w-[400px] shrink-0 self-start xl:block">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-spice-bg-surface ring-1 ring-spice-border">
        <ModulePreviewPanel />
      </div>
    </aside>
  );
};

export const ModulePreviewModal = () => {
  const { isOpen, closePreview } = useModulePreview();
  const isXl = useIsXlScreen();

  if (isXl) return null;

  return (
    <Modal
      open={isOpen}
      labelledBy="module-preview-modal-title"
      onClose={closePreview}
    >
      <div className="flex h-[min(90vh,800px)] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-spice-bg-surface shadow-xl">
        <ModulePreviewPanel onClose={closePreview} />
      </div>
    </Modal>
  );
};

export const ModulePreviewChrome = () => {
  return (
    <>
      <ModulePreviewSidePanel />
      <ModulePreviewModal />
    </>
  );
};
