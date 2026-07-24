import { useContext } from 'react';
import {
  ModulePreviewContext,
  type ModulePreviewContextValue,
} from '@/features/modules/context/ModulePreviewContext';

export function useModulePreview(): ModulePreviewContextValue {
  const context = useContext(ModulePreviewContext);
  if (!context) {
    throw new Error(
      'useModulePreview must be used within ModulePreviewProvider',
    );
  }
  return context;
}
