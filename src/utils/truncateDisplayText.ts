/** Truncate long labels for inline display (e.g. delete confirmations). */
export function truncateDisplayText(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

export function isDisplayTextTruncated(
  text: string,
  maxLength: number,
): boolean {
  return text.trim().length > maxLength;
}
