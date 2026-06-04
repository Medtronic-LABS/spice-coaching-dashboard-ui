import { describe, expect, it } from 'vitest';
import {
  objectNameFromUploadedFileUrl,
  uploadedFileUrl,
} from '@/features/module-library/utils/uploadedFileUrl';
import { apiBaseUrl } from '@/store/apis/base';

describe('uploadedFileUrl', () => {
  it('builds legacy admin files URL from object name', () => {
    expect(uploadedFileUrl('media/test.png')).toBe(
      `${apiBaseUrl}/admin/v3/files/media/test.png`,
    );
  });

  it('extracts object name from legacy admin files URL', () => {
    const url = uploadedFileUrl('media/e1b67458_file.png');
    expect(objectNameFromUploadedFileUrl(url)).toBe('media/e1b67458_file.png');
  });
});
