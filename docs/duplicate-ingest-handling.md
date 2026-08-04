# Duplicate Ingest Handling — Implementation Guide

This document describes the frontend work required to handle `duplicate_content` (HTTP 409) and partial-batch `skipped_duplicates` (HTTP 202) when uploading files via `POST /admin/ingest`.

## Background

When uploaded file bytes match an already-ingested `source_document`, the backend blocks ingestion unless the client opts in via `override_duplicates`.

| Scenario | HTTP | Client action |
|----------|------|---------------|
| All files are duplicates | **409** | Show confirm dialog → retry with `override_duplicates: "[true,...]"` |
| Mixed batch (some new, some duplicate) | **202** | Queue new files immediately → prompt for skipped → retry skipped only with override |
| User confirms re-ingest | **202** | Normal success flow |

### API payload

`override_duplicates` is a **JSON-stringified boolean array**, one entry per file in upload order:

```http
override_duplicates: "[true, false, true]"
```

Backend reference: `coaching-platform/services/platform/src/platform_service/api/admin_ingest.py`

---

## Architecture

```
IngestDocumentPage / CourseCreatePage
        │
        ▼
useIngestWithDuplicateHandling (hook)
        │
        ├── ingestDocuments() ──► adminIngestApi (FormData + override_duplicates)
        │
        ├── parseIngestDuplicateError() on 409
        │
        └── DuplicateIngestConfirmDialog (blocked | skipped)
```

---

## File checklist

| Action | Path |
|--------|------|
| Modify | `src/features/module-library/api/adminIngestApi.ts` |
| Create | `src/features/module-library/utils/parseIngestDuplicateError.ts` |
| Create | `src/features/module-library/utils/parseIngestDuplicateError.test.ts` |
| Create | `src/features/module-library/components/DuplicateIngestConfirmDialog.tsx` |
| Create | `src/features/module-library/hooks/useIngestWithDuplicateHandling.ts` |
| Modify | `src/features/module-library/pages/IngestDocumentPage.tsx` |
| Modify | `src/features/program-manager/pages/CourseCreatePage.tsx` |

---

## Step 1 — API types (`adminIngestApi.ts`)

Add types and extend payload/response:

```typescript
export interface ExistingIngestedSourceSummary {
  source_document_id: string;
  title: string;
  original_filename: string | null;
  ingested_at: string;
  status: string;
}

export interface IngestDuplicateConflict {
  filename: string;
  title: string;
  content_sha256: string;
  existing_source_documents: ExistingIngestedSourceSummary[];
}

export interface IngestDuplicateErrorDetail {
  code: 'duplicate_content';
  message: string;
  conflicts: IngestDuplicateConflict[];
}

// AdminV3IngestBatchFormPayload — add:
override_duplicates?: boolean[];

// AdminV3IngestAcceptedResponse — add:
skipped_duplicates?: IngestDuplicateConflict[];
```

In the `ingestDocuments` query builder, after other form fields:

```typescript
if (payload.override_duplicates?.length) {
  form.append(
    'override_duplicates',
    JSON.stringify(payload.override_duplicates),
  );
}
```

---

## Step 2 — Error parser (`parseIngestDuplicateError.ts`)

RTK Query surfaces FastAPI errors as:

```json
{ "status": 409, "data": { "detail": { "code": "duplicate_content", "conflicts": [...] } } }
```

Export:

- `parseIngestDuplicateError(error)` → `IngestDuplicateErrorDetail | null`
- `buildOverrideFlags(files, conflictFilenames)` → `boolean[]`
- `conflictFilenamesFromList(conflicts)` → `Set<string>`
- `selectFilesForConflicts(files, titles, conflicts)` → `{ files, titles }` for partial re-ingest

---

## Step 3 — Dialog (`DuplicateIngestConfirmDialog.tsx`)

Reuse `Modal` + `Card` + `Button` (same pattern as `UnsavedChangesDialog`).

| Variant | When | Title | Primary action |
|---------|------|-------|----------------|
| `blocked` | 409 | Similar content already exists | Upload anyway |
| `skipped` | 202 partial | Some files were skipped | Re-ingest skipped |

Props: `open`, `variant`, `conflicts`, `onCancel`, `onConfirm`, `isConfirming`.

Show bullet list of conflicting filenames for multi-file cases. Optionally show `existing_source_documents[0].ingested_at`.

---

## Step 4 — Hook (`useIngestWithDuplicateHandling.ts`)

```typescript
export interface UseIngestWithDuplicateHandlingOptions {
  onAccepted: (
    response: AdminV3IngestAcceptedResponse,
    context: { isReingest: boolean },
  ) => void;
  onError: (message: string) => void;
}

export function useIngestWithDuplicateHandling(options: UseIngestWithDuplicateHandlingOptions) {
  // useIngestDocumentsMutation internally
  // Returns:
  //   submitIngest(payload)
  //   duplicateDialog: { open, variant, conflicts }
  //   confirmDuplicate()
  //   cancelDuplicate()
  //   isUploading
  //   isConfirmingDuplicate
  //   dismissedSkippedNotice: IngestDuplicateConflict[] | null
}
```

### `submitIngest` flow

1. Call `ingestDocuments(payload)` without override.
2. **On 409:** `parseIngestDuplicateError` → open `blocked` dialog → store full pending payload.
3. **On 202 success:**
   - Call `onAccepted(response, { isReingest: false })`.
   - If `response.skipped_duplicates?.length`:
     - Open `skipped` dialog.
     - Store pending payload with only skipped files/titles + `override_duplicates: skippedFiles.map(() => true)`.
   - Else: done.
4. **On other errors:** `onError(formatRtkQueryError(err))`.

### `confirmDuplicate` flow

1. Retry `ingestDocuments(pendingPayload)` (includes `override_duplicates`).
2. On success: `onAccepted(response, { isReingest: true })`, close dialog.
3. On 409 again (edge case): re-open dialog.
4. On other errors: `onError(...)`, close dialog.

### `cancelDuplicate` flow

- `blocked`: close dialog, keep files in form (user can edit and retry).
- `skipped`: close dialog, set `dismissedSkippedNotice` to conflicts for inline banner.

---

## Step 5 — `IngestDocumentPage.tsx` integration

Replace direct `useIngestDocumentsMutation` usage with the hook.

### `onAccepted` handler

```typescript
onAccepted: (res, { isReingest }) => {
  setAccepted((prev) =>
    isReingest && prev
      ? {
          ...res,
          sources: [...prev.sources, ...res.sources],
          skipped_duplicates: res.skipped_duplicates,
        }
      : res,
  );
  const first =
    res.sources?.[0]?.source_document_id ??
    accepted?.sources?.[0]?.source_document_id ??
    '';
  if (first) setActiveSourceDocumentId(first);

  if (res.skipped_duplicates?.length && !isReingest) {
    // Remove only successfully queued files from selection
    const queuedNames = new Set(
      (isReingest ? accepted?.sources : res.sources)?.map(() => '') // use res.sources filenames
    );
    // Better: track by comparing files against skipped_duplicates filenames
    const skippedNames = new Set(res.skipped_duplicates.map((c) => c.filename));
    setFiles((prev) => prev.filter((f) => skippedNames.has(f.name)));
    setTitles((prev) =>
      files
        .map((f, i) => ({ f, t: prev[i] }))
        .filter(({ f }) => skippedNames.has(f.name))
        .map(({ t }) => t),
    );
  } else if (!res.skipped_duplicates?.length) {
    setFiles([]);
    setTitles([]);
  }
},
```

### UI additions

```tsx
<DuplicateIngestConfirmDialog
  open={duplicateDialog.open}
  variant={duplicateDialog.variant}
  conflicts={duplicateDialog.conflicts}
  onCancel={cancelDuplicate}
  onConfirm={() => void confirmDuplicate()}
  isConfirming={isConfirmingDuplicate}
/>

{dismissedSkippedNotice?.length ? (
  <div className="rounded-lg border border-spice-border bg-spice-bg-tint px-3 py-2 text-xs">
    Skipped (duplicate content): {dismissedSkippedNotice.map((c) => c.filename).join(', ')}
  </div>
) : null}
```

### Start ingestion button

```typescript
onClick={async () => {
  if (!files.length) return;
  setActionError('');
  setAccepted(null);
  setRestoredSourceDocumentId('');
  setActiveSourceDocumentId('');
  clearActiveIngestSession();
  await submitIngest({
    files,
    titles: titles.length === files.length ? titles : null,
    content_domain: contentDomain,
    assessment_mode: assessmentMode,
    authority_label: authorityLabel,
    primary_language: primaryLanguage,
  });
}}
```

---

## Step 6 — `CourseCreatePage.tsx` integration

Same hook + dialog. Single-file upload only needs the `blocked` (409) path.

```typescript
onAccepted: (res) => {
  const first = res.sources?.[0]?.source_document_id ?? '';
  if (!first) {
    onError('Ingest accepted but no source ID was returned.');
    return;
  }
  persistIngestSession(first);
  setSelectedFile(null);
},
onError: setUploadError,
```

Replace `err instanceof Error ? err.message` with `formatRtkQueryError` for non-duplicate errors.

---

## Multi-file behavior summary

| Upload | First response | UI | Retry payload |
|--------|----------------|-----|---------------|
| 1 dup file | 409 | blocked dialog | same file + `[true]` |
| N dup files | 409 | blocked dialog, list all | all files + `[true,...,true]` |
| 1 new + 1 dup | 202 | queue new, skipped dialog | dup file only + `[true]` |
| N new + M dup | 202 | queue new, skipped dialog | M dup files + M×`true` |

Conflict matching: `conflict.filename === file.name`.

---

## Tests

### Unit (`parseIngestDuplicateError.test.ts`)

- Parses `{ status: 409, data: { detail: { code: 'duplicate_content', ... } } }`
- Returns `null` for non-409
- `buildOverrideFlags` marks only conflicting indices
- `selectFilesForConflicts` preserves title alignment

### Manual

1. Single duplicate → 409 dialog → Upload anyway → 202 + polling
2. All duplicates (multi) → dialog lists all → all queued on confirm
3. Mixed batch → new queued + skipped dialog → re-ingest skipped
4. Course Create single duplicate → same 409 flow
5. Non-duplicate error (400) → inline banner, no dialog

---

## No backend changes required

The `override_duplicates` form field and `duplicate_content` / `skipped_duplicates` responses are already implemented in `coaching-platform`.
