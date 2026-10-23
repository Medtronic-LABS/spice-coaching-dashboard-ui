import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon } from '@/assets/icon';
import { Button } from '@/components/ui';
import { paths } from '@/constants/routes';

/** Header CTA shared by ingest/knowledge pages to open Module Library. */
export const ModuleLibraryNavButton = () => {
  const navigate = useNavigate();

  return (
    <Button
      variant="secondary"
      className="inline-flex shrink-0 items-center gap-1.5 self-start"
      onClick={() => navigate(paths.moduleLibrary)}
    >
      Module Library
      <ArrowRightIcon className="h-3.5 w-3.5" />
    </Button>
  );
};
