import { useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/common/PageTitle';
import { ArrowRightIcon } from '@/assets/icon';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';
import { IngestRunHistoryTable } from '@/features/ingest/components/IngestRunHistoryTable';

export const IngestHistoryPage = () => {
  const navigate = useNavigate();

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          title="Ingestion History"
          subtitle="Track previous ingestion runs and access the generated modules for each uploaded document."
        />
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="inline-flex items-center gap-1.5"
            onClick={() => navigate(paths.moduleLibrary)}
          >
            Module Library
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <IngestRunHistoryTable />
    </section>
  );
};
