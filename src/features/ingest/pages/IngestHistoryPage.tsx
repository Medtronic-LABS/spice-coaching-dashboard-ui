import { ModuleLibraryNavButton } from '@/components/common/ModuleLibraryNavButton';
import { PageTitle } from '@/components/common/PageTitle';
import { IngestRunHistoryTable } from '@/features/ingest/components/IngestRunHistoryTable';

export const IngestHistoryPage = () => {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <PageTitle
          title="Ingestion History"
          subtitle="Track previous ingestion runs and access the generated modules for each uploaded document."
        />
        <ModuleLibraryNavButton />
      </div>

      <IngestRunHistoryTable />
    </section>
  );
};
