import { useState } from 'react';
import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/module-library/types/modulePreview.types';
import { ModulePreviewNavigator } from '@/features/module-library/components/module-preview/ModulePreviewNavigator';
import { getInitialPosition } from '@/features/module-library/utils/modulePreviewNavigation';

export interface ModulePreviewDevShellProps {
  snapshot: ModulePreviewSnapshot;
  initialPosition?: Partial<ModulePreviewPosition>;
}

export const ModulePreviewDevShell = ({
  snapshot,
  initialPosition,
}: ModulePreviewDevShellProps) => {
  const [position, setPosition] = useState<ModulePreviewPosition>(() =>
    getInitialPosition(snapshot, initialPosition),
  );

  return (
    <ModulePreviewNavigator
      snapshot={snapshot}
      position={position}
      onPositionChange={setPosition}
    />
  );
};
