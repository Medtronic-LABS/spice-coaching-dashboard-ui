import { useRef, useState, type ChangeEvent } from 'react';
import type { AdminModuleDetailResponse } from '@/features/module-library/api/adminModulesApi';
import {
  useLazyGetAdminFilePresignedUrlQuery,
  useUploadAdminFileMutation,
} from '@/features/module-library/api/adminFilesApi';
import { updateDetails } from '@/features/module-library/store/adminModuleReviewSlice';
import { useAppDispatch } from '@/store/hooks';

type ThumbnailSave = (
  detailsOverride?: Partial<AdminModuleDetailResponse>,
) => Promise<void>;

export function useAdminModuleThumbnailUpload(save: ThumbnailSave) {
  const dispatch = useAppDispatch();
  const [uploadAdminFile, { isLoading: isUploading }] =
    useUploadAdminFileMutation();
  const [getPresignedUrl] = useLazyGetAdminFilePresignedUrlQuery();
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError('');
    try {
      const uploadResponse = await uploadAdminFile({
        file,
        prefix: 'uploads',
      }).unwrap();

      const presignedResponse = await getPresignedUrl({
        object_name: uploadResponse.object_name,
        expires_seconds: 600,
      }).unwrap();

      const updates = {
        thumbnail_storage_path: uploadResponse.storage_path,
        thumbnail_presigned_url: presignedResponse.presigned_url,
      };

      dispatch(updateDetails(updates));
      await save(updates);
    } catch {
      setUploadError('Failed to upload image. Please try again.');
    }
  };

  return {
    fileInputRef,
    uploadError,
    isUploading,
    openFilePicker,
    handleImageUpload,
  };
}
