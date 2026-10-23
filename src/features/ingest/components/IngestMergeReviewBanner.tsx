import { EyeIcon } from '@/assets/icon';
import { Banner, Button } from '@/components/ui';

export interface IngestMergeReviewBannerProps {
  onViewDetails: () => void;
}

export const IngestMergeReviewBanner = ({
  onViewDetails,
}: IngestMergeReviewBannerProps) => {
  return (
    <Banner tone="warning">
      <div
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        role="status"
        aria-live="polite"
      >
        <span className="text-sm font-medium">
          Some modules require your approval before ingestion can continue.
        </span>
        <Button
          variant="secondary"
          className="h-8 shrink-0 gap-1.5 text-xs"
          onClick={onViewDetails}
        >
          <EyeIcon className="h-3.5 w-3.5" />
          View Details
        </Button>
      </div>
    </Banner>
  );
};
