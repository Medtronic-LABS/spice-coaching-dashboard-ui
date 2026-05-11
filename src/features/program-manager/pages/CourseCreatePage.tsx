import { useMemo, useRef, useState } from 'react';
import { Button, Card } from '@/components/ui';
import { paths } from '@/constants/routes';
import { adminApiBaseUrl, adminApiCommonHeaders } from '@/store/apis/adminBase';

const V3_ACCEPT =
  '.pdf,.pptx,.docx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

type IngestStreamEventName =
  | 'run_started'
  | 'stage_started'
  | 'stage_succeeded'
  | 'stage_skipped'
  | 'stage_failed'
  | 'pipeline_complete';

type IngestStreamEvent = {
  event: IngestStreamEventName | 'message';
  stage?: string;
  message?: string;
  run_id?: string;
  source_document_id?: string;
  raw?: string;
};

function parseSseEventBlock(block: string): IngestStreamEvent | null {
  const lines = block
    .split('\n')
    .map((l) => l.trimEnd())
    .filter(Boolean);
  if (!lines.length) return null;

  let eventName: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }

  const dataRaw = dataLines.join('\n').trim();
  if (!dataRaw) {
    return { event: (eventName ?? 'message') as IngestStreamEvent['event'] };
  }

  try {
    const parsed: unknown = JSON.parse(dataRaw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>;
      const event =
        typeof obj.event === 'string' ? obj.event : (eventName ?? 'message');
      const stage = typeof obj.stage === 'string' ? obj.stage : undefined;
      const run_id = typeof obj.run_id === 'string' ? obj.run_id : undefined;
      const source_document_id =
        typeof obj.source_document_id === 'string'
          ? obj.source_document_id
          : undefined;
      const message =
        typeof obj.message === 'string'
          ? obj.message
          : typeof obj.detail === 'string'
            ? obj.detail
            : undefined;
      return {
        event: event as IngestStreamEvent['event'],
        stage,
        message,
        run_id,
        source_document_id,
        raw: dataRaw,
      };
    }
    return {
      event: (eventName ?? 'message') as IngestStreamEvent['event'],
      message: dataRaw,
      raw: dataRaw,
    };
  } catch {
    return {
      event: (eventName ?? 'message') as IngestStreamEvent['event'],
      message: dataRaw,
      raw: dataRaw,
    };
  }
}

export const CourseCreatePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState('');
  const [stageState, setStageState] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const [form, setForm] = useState({
    title: '',
    authority_kind: 'official_training',
    authority_label: 'BRAC',
    primary_language: 'bn',
  });

  const v3DocumentTitle = useMemo(() => {
    const fromForm = form.title.trim();
    if (fromForm) return fromForm;
    if (selectedFile?.name) {
      return selectedFile.name.replace(/\.[^.]+$/, '') || selectedFile.name;
    }
    return '';
  }, [form.title, selectedFile]);

  return (
    <section className="space-y-4" aria-busy={isStreaming}>
      <h1 className="text-3xl font-semibold text-spice-brand-pm">
        Create module
      </h1>
      <p className="text-sm text-spice-text-muted">
        Upload a source document and track ingestion progress (stage-wise). When
        the pipeline completes successfully, you’ll be redirected to the Module
        Library to claim and review.
      </p>

      <Card variant="elevated" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Title (required)
            </label>
            <input
              className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
              value={form.title}
              disabled={isStreaming}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  title: event.target.value,
                }))
              }
              placeholder="e.g. গর্ভকালীন রক্ষণাবেক্ষণ"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Authority kind
            </label>
            <input
              className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
              value={form.authority_kind}
              disabled={isStreaming}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  authority_kind: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Authority label
            </label>
            <input
              className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
              value={form.authority_label}
              disabled={isStreaming}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  authority_label: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Primary language
            </label>
            <input
              className="h-11 w-full rounded-lg border border-spice-border bg-spice-bg-surface px-3 text-sm text-spice-text-primary outline-none"
              value={form.primary_language}
              disabled={isStreaming}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  primary_language: event.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-spice-border-mid bg-spice-bg-tint p-8 text-center">
          <div className="text-sm font-semibold text-spice-text-primary">
            Upload document
          </div>
          <div className="text-xs text-spice-text-muted">
            PDF, PowerPoint, or Word —{' '}
            <code className="text-[11px]">POST /admin/v3/ingest/stream</code>
          </div>
          <div className="mt-3">
            <input
              ref={fileInputRef}
              type="file"
              accept={V3_ACCEPT}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                setStreamError('');
              }}
            />
            <Button
              variant="secondary"
              disabled={isStreaming}
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </Button>
            <Button
              className="ml-2"
              disabled={isStreaming || !selectedFile || !v3DocumentTitle.trim()}
              onClick={async () => {
                setStreamError('');
                setCompleted(false);
                setStageState({});
                if (!selectedFile || !v3DocumentTitle.trim()) return;

                setIsStreaming(true);
                try {
                  const formData = new FormData();
                  formData.append('file', selectedFile, selectedFile.name);
                  formData.append('title', v3DocumentTitle.trim());
                  formData.append('authority_kind', form.authority_kind);
                  formData.append('authority_label', form.authority_label);
                  formData.append('primary_language', form.primary_language);

                  const res = await fetch(
                    `${adminApiBaseUrl}/admin/v3/ingest/stream`,
                    {
                      method: 'POST',
                      headers: {
                        ...adminApiCommonHeaders,
                        Accept: 'text/event-stream',
                      },
                      body: formData,
                    },
                  );

                  if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    throw new Error(text || `Ingest failed (${res.status})`);
                  }
                  if (!res.body) {
                    throw new Error('Streaming response body missing.');
                  }

                  const reader = res.body.getReader();
                  const decoder = new TextDecoder('utf-8');
                  let buffer = '';

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });

                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() ?? '';

                    for (const part of parts) {
                      const evt = parseSseEventBlock(part);
                      if (!evt) continue;
                      if (evt.stage) {
                        const stage = evt.stage;
                        setStageState((prev) => ({
                          ...prev,
                          [stage]: evt.event,
                        }));
                      }
                      if (evt.event === 'pipeline_complete') {
                        setCompleted(true);
                        setIsStreaming(false);
                        // Successful end: redirect per requirements.
                        // Use hard redirect to ensure any open SSE is torn down cleanly.
                        window.location.assign(paths.moduleLibrary);
                        return;
                      }
                      if (evt.event === 'stage_failed') {
                        setIsStreaming(false);
                      }
                    }
                  }
                } catch (err) {
                  setStreamError(
                    err instanceof Error ? err.message : String(err),
                  );
                } finally {
                  setIsStreaming(false);
                }
              }}
            >
              {isStreaming ? 'Uploading…' : 'Upload & start ingestion'}
            </Button>
          </div>
          <div className="mt-4 text-xs text-spice-text-medium">
            {selectedFile ? selectedFile.name : 'No file selected'}
          </div>
        </div>

        {streamError ? (
          <div className="rounded-lg bg-spice-semantic-errorBg px-3 py-2 text-xs text-spice-semantic-error">
            {streamError}
          </div>
        ) : null}

        {Object.keys(stageState).length ? (
          <Card variant="bordered" className="space-y-2">
            <div className="text-xs font-semibold tracking-wider text-spice-text-muted">
              Ingestion status
            </div>
            <div className="space-y-2">
              {Object.entries(stageState).map(([stage, status]) => (
                <div
                  key={stage}
                  className="flex items-center justify-between rounded-lg bg-spice-bg-tint px-3 py-2 text-xs"
                >
                  <span className="font-semibold text-spice-text-primary">
                    {stage}
                  </span>
                  <span className="text-spice-text-medium">{status}</span>
                </div>
              ))}
            </div>
          </Card>
        ) : null}

        {completed ? (
          <div className="rounded-lg bg-spice-semantic-successBg px-3 py-2 text-xs text-spice-semantic-success">
            Pipeline complete. Redirecting to Module Library…
          </div>
        ) : null}
      </Card>
    </section>
  );
};
