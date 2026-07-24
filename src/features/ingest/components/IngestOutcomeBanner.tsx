import { Button } from '@/components/ui';
import {
  hasGeneratedIngestModules,
  isIngestSucceeded,
} from '@/features/ingest/utils/ingestStatus';

interface IngestOutcomeBannerProps {
  status: string | undefined;
  generatedModuleCount: number | undefined;
  onGoToDrafts: () => void;
}

export const IngestOutcomeBanner = ({
  status,
  generatedModuleCount,
  onGoToDrafts,
}: IngestOutcomeBannerProps) => {
  const ingestionSucceeded = isIngestSucceeded(status);
  const hasGeneratedModules = hasGeneratedIngestModules(generatedModuleCount);

  if (!ingestionSucceeded) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success sm:flex-row sm:items-center sm:justify-between">
      {hasGeneratedModules ? (
        <>
          <span>
            Ingestion generated draft modules. Review them or upload another
            document.
          </span>
          <Button className="h-8 shrink-0 text-xs" onClick={onGoToDrafts}>
            Go to Drafts
          </Button>
        </>
      ) : (
        <span>
          Ingestion completed successfully, but no draft modules were created.
        </span>
      )}
    </div>
  );
};
