/** Safe browser download basename from a knowledge document title. */
export function knowledgeDownloadFilename(title: string): string {
  const stem =
    title
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, ' ')
      .replace(/\.+$/g, '')
      .slice(0, 180) || 'document';
  return stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`;
}

/**
 * Download a remote file under an explicit local filename.
 * Uses a blob URL so the name is honored even for cross-origin storage URLs
 * (where `<a download>` is ignored).
 */
export async function downloadFileAs(
  url: string,
  filename: string,
): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed (${response.status}).`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noreferrer';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
