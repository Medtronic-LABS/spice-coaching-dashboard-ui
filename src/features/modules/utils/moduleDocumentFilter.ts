/** Last path segment extension including the leading dot, lowercased. */
export function extensionFromFilename(
  filename: string | null | undefined,
): string {
  const trimmed = filename?.trim();
  if (!trimmed) return '';
  const base = trimmed.split(/[/\\]/).pop() ?? trimmed;
  const lastDot = base.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === base.length - 1) return '';
  return base.slice(lastDot).toLowerCase();
}

export function sourceDocumentFilterLabel(
  sourceDocumentId: string,
  title?: string,
  originalFilename?: string | null,
): string {
  const base = title?.trim()
    ? title.trim()
    : `Document ${sourceDocumentId.slice(0, 8)}`;
  const extension = extensionFromFilename(originalFilename);
  if (!extension) return base;
  if (base.toLowerCase().endsWith(extension)) return base;
  return `${base} (${extension})`;
}
