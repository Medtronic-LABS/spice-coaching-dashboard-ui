import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export interface ModulePublishedSuccessSummary {
  title: string;
  topic: string;
  lessonCount: number;
  quizCount: number;
  estimateMinutes: number;
  sourceFileName?: string;
}

export interface ModulePublishedSuccessModalProps {
  open: boolean;
  summary: ModulePublishedSuccessSummary;
  primaryLabel?: string;
  redirectSeconds?: number;
  onRedirect: () => void;
  onCreateAnother?: () => void;
}

export const ModulePublishedSuccessModal = ({
  open,
  summary,
  primaryLabel = 'Back to Module Library',
  redirectSeconds = 5,
  onRedirect,
  onCreateAnother,
}: ModulePublishedSuccessModalProps) => {
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

  const lessonLabel =
    summary.lessonCount === 1 ? '1 lesson' : `${summary.lessonCount} lessons`;
  const quizLabel =
    summary.quizCount === 1 ? '1 question' : `${summary.quizCount} questions`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-spice-text-primary/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="module-published-title"
    >
      <Card
        variant="elevated"
        className="w-full max-w-xl space-y-5 border-spice-border p-6 shadow-lg"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-spice-semantic-successBg text-2xl text-spice-semantic-success">
          ✓
        </div>
        <div className="space-y-2 text-center">
          <Badge className="bg-spice-semantic-successBg text-spice-semantic-success">
            PUBLISHED
          </Badge>
          <h2
            id="module-published-title"
            className="text-2xl font-semibold text-spice-text-primary"
          >
            Module is Live
          </h2>
          <p className="text-sm text-spice-text-muted">
            {summary.title} has been published to the Module Library and is
            ready to use.
          </p>
          <p className="text-xs text-spice-text-medium">
            Redirecting to module library in {secondsLeft}s…
          </p>
        </div>

        <div className="rounded-xl bg-spice-bg-tint p-4 space-y-3">
          <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
            MODULE SUMMARY
          </div>
          <div className="rounded-lg bg-spice-bg-surface p-3 ring-1 ring-spice-border">
            <div className="text-xs text-spice-text-muted">Module</div>
            <div className="font-semibold text-spice-text-primary">
              {summary.title}
            </div>
            <div className="text-xs text-spice-text-muted">
              {summary.topic} · Published just now
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-spice-bg-surface p-3 ring-1 ring-spice-border">
              <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                LESSONS
              </div>
              <div className="font-semibold text-spice-text-primary">
                {lessonLabel}
              </div>
            </div>
            <div className="rounded-lg bg-spice-bg-surface p-3 ring-1 ring-spice-border">
              <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                QUIZ
              </div>
              <div className="font-semibold text-spice-text-primary">
                {quizLabel}
              </div>
            </div>
            <div className="rounded-lg bg-spice-bg-surface p-3 ring-1 ring-spice-border">
              <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                EST. TIME
              </div>
              <div className="font-semibold text-spice-text-primary">
                ~{summary.estimateMinutes} min
              </div>
            </div>
            {summary.sourceFileName ? (
              <div className="rounded-lg bg-spice-bg-surface p-3 ring-1 ring-spice-border">
                <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
                  SOURCE
                </div>
                <div className="truncate font-semibold text-spice-text-primary">
                  {summary.sourceFileName}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[10px] font-semibold tracking-wider text-spice-text-muted">
            WHAT&apos;S NEXT
          </div>
          <button
            type="button"
            onClick={() => onRedirectRef.current()}
            className="flex w-full items-center justify-between rounded-lg bg-spice-bg-tint px-4 py-3 text-left ring-1 ring-spice-border transition hover:bg-spice-bg-surface"
          >
            <div>
              <div className="text-sm font-semibold text-spice-text-primary">
                {primaryLabel}
              </div>
              <div className="text-xs text-spice-text-muted">
                Return to browse and manage modules
              </div>
            </div>
            <span className="text-spice-text-muted" aria-hidden="true">
              ›
            </span>
          </button>
          {onCreateAnother ? (
            <button
              type="button"
              onClick={onCreateAnother}
              className="flex w-full items-center justify-between rounded-lg bg-spice-bg-tint px-4 py-3 text-left ring-1 ring-spice-border transition hover:bg-spice-bg-surface"
            >
              <div>
                <div className="text-sm font-semibold text-spice-text-primary">
                  Create another module
                </div>
                <div className="text-xs text-spice-text-muted">
                  Build a new module from a document or from scratch
                </div>
              </div>
              <span className="text-spice-text-muted" aria-hidden="true">
                ›
              </span>
            </button>
          ) : null}
        </div>

        <Button className="w-full" onClick={() => onRedirectRef.current()}>
          {primaryLabel}
        </Button>
      </Card>
    </div>
  );
};
