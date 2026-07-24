import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';
import { IngestRunHistoryTable } from '@/features/ingest/components/IngestRunHistoryTable';

export const IngestHistoryPage = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-spice-text-primary">
            Ingestion History
          </h1>
          <p className="mt-1 text-sm text-spice-text-muted">
            Track previous ingestion runs and access the generated modules for
            each uploaded document.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="h-9 text-xs"
            onClick={() => navigate(paths.moduleLibrary)}
          >
            Module Library
          </Button>
          <Button
            className="h-9 text-xs"
            onClick={() => navigate(paths.ingestDocument)}
          >
            Upload Document
          </Button>
        </div>
      </div>

      <IngestRunHistoryTable />
    </section>
  );
};
