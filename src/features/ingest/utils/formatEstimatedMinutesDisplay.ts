/**
 * Format estimated duration for list UI as day / hr / min parts.
 * Zero units are omitted; `0` minutes shows as `0 min`.
 */
export function formatEstimatedMinutesDisplay(totalMinutes: number): string {
  if (!Number.isFinite(totalMinutes)) {
    return '0 min';
  }

  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const days = Math.floor(safeMinutes / (24 * 60));
  const hours = Math.floor((safeMinutes % (24 * 60)) / 60);
  const minutes = safeMinutes % 60;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  }
  if (hours > 0) {
    parts.push(`${hours} hr`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes} min`);
  }

  return parts.join(' ');
}
