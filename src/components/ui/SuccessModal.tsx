import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';

export interface SuccessModalProps {
  open: boolean;
  title: string;
  description: string;
  primaryLabel: string;
  /** Seconds before `onRedirect` runs automatically. Defaults to 5. */
  redirectSeconds?: number;
  onRedirect: () => void;
}

export const SuccessModal = ({
  open,
  title,
  description,
  primaryLabel,
  redirectSeconds = 5,
  onRedirect,
}: SuccessModalProps) => {
  const [secondsLeft, setSecondsLeft] = useState(redirectSeconds);
  const onRedirectRef = useRef(onRedirect);

  onRedirectRef.current = onRedirect;

  useEffect(() => {
    if (!open) return undefined;

    setSecondsLeft(redirectSeconds);

    const intervalId = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      onRedirectRef.current();
    }, redirectSeconds * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [open, redirectSeconds]);

  if (!open) return null;

  const handleRedirect = () => {
    onRedirectRef.current();
  };

  return (
    <Modal open={open} labelledBy="success-modal-title">
      <Card
        variant="elevated"
        className="w-full max-w-md space-y-4 border-spice-border p-4 shadow-lg sm:space-y-5 sm:p-6"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-spice-semantic-successBg text-2xl text-spice-semantic-success">
          ✓
        </div>
        <div className="space-y-2 text-center">
          <h2
            id="success-modal-title"
            className="text-xl font-semibold text-spice-text-primary"
          >
            {title}
          </h2>
          <p className="text-sm text-spice-text-muted">{description}</p>
          <p className="text-xs text-spice-text-medium">
            Redirecting to module library in {secondsLeft}s…
          </p>
        </div>
        <Button className="w-full" onClick={handleRedirect}>
          {primaryLabel}
        </Button>
      </Card>
    </Modal>
  );
};
