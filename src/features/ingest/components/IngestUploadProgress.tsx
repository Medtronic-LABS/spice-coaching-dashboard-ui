import { useEffect, useState } from 'react';
import { ProgressBar } from '@/components/common/ProgressBar';

export interface IngestUploadProgressProps {
  active: boolean;
  complete?: boolean;
  label?: string;
}

/**
 * Soft progress while multipart upload is in flight (RTK has no byte progress).
 * Caps below 100 until `complete` is true.
 */
export const IngestUploadProgress = ({
  active,
  complete = false,
  label = 'Uploading files…',
}: IngestUploadProgressProps) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (complete) {
      setValue(100);
      return;
    }
    if (!active) {
      setValue(0);
      return;
    }

    setValue(8);
    const timer = window.setInterval(() => {
      setValue((prev) => {
        if (prev >= 92) return prev;
        const step = prev < 40 ? 7 : prev < 70 ? 4 : 2;
        return Math.min(92, prev + step);
      });
    }, 280);

    return () => window.clearInterval(timer);
  }, [active, complete]);

  if (!active && !complete) return null;

  return (
    <div className="space-y-1.5" role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-2 text-xs text-spice-text-muted">
        <span>{complete ? 'Upload completed' : label}</span>
        <span className="font-mono">{Math.round(value)}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
};
