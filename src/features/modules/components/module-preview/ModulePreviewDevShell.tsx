import { useState } from 'react';
import type {
  ModulePreviewPosition,
  ModulePreviewSnapshot,
} from '@/features/modules/types/modulePreview.types';
import { ModulePreviewNavigator } from '@/features/modules/components/module-preview/ModulePreviewNavigator';
import { getInitialPosition } from '@/features/modules/utils/modulePreviewNavigation';

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
