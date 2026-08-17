/** Turn a blob/data URL (PDF preview) into a File for `POST /admin/files`. */
export async function fileFromObjectUrl(
  url: string,
  filename: string,
): Promise<File> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not read thumbnail preview');
  }
  const blob = await response.blob();
  return new File([blob], filename, {
    type: blob.type || 'image/png',
  });
}
