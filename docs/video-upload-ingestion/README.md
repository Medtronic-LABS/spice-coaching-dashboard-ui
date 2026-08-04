# Video Upload & Ingestion

**Status:** Implemented (frontend); a few product gaps remain — see [Open items](#open-items)  
**Dates:** Plan 2026-07-15 · Requirements audit 2026-07-20  
**Scope:** Frontend only (`micro-learning-analytics-dashboard`). **No backend changes.** Videos reuse the existing ingestion stack: `POST /admin/ingest`, duplicate detection / `override_duplicates`, status polling via `GET /admin/ingest/by-document/:id`, and `GET /admin/source-documents`.

---

## Summary

Program managers get a dedicated **Video Upload** page (sidebar: **Ingest video**) that mirrors document ingestion but accepts only video files:

1. Choose video file(s) → **Upload** stages them into the table (no API yet).
2. Table lists server history (`source_type=video`) plus session-staged rows, with pagination and checkboxes.
3. Select rows → configure ingest fields → **Ingest Selected Videos** calls the normal ingest API.
4. Already-ingested selections open `ReingestConfirmDialog` (progress/quiz reset warning); confirm sends `override_duplicates`.
5. Per-source progress via shared `IngestRunStatusPanel`; success redirects to Modules (and **Go to Drafts** / **View modules** can pre-filter by source).
6. Document Ingestion rejects video files and points users to this page.

---

## Agreed decisions

| # | Decision |
| --- | --- |
| 1 | **Upload** only stages files into the table. **Ingest Selected Videos** calls `POST /admin/ingest`. Staged-but-not-ingested rows do not survive refresh; ingested history comes from the server. |
| 2 | Table source = `GET /admin/source-documents` with `source_type=video` + session-staged rows. |
| 3 | Ingestion config matches the document page (domain, assessment mode, quizzes/cards per module, instructions). |
| 4 | Re-ingest uses `ReingestConfirmDialog` (video-specific copy). Backend 409 / skipped-duplicate path also routes through the same dialog. |
| 5 | **View modules** / success CTAs navigate to Modules with `sourceDocumentId` (and title) in location state — same mechanism as “Go to Drafts”. |
| 6 | Visibility matches Ingest document: program-manager sidebar + route guard; supervisors cannot reach the page. |

---

## Page flow

```
Choose File (accept: .mp4 .mov .mkv .webm) → [Upload]
   → row staged (Upload status: Uploaded, Ingestion: Not ingested)
Table: checkbox | name | date | upload status | ingestion status | actions
   → select → config → [Ingest Selected Videos]
       ├─ already-ingested in selection → ReingestConfirmDialog → override_duplicates
       └─ all new → POST /admin/ingest (backend duplicate hook as safety net)
   → IngestRunStatusPanel per accepted source (sessionStorage restore on refresh)
   → success → Modules (optional Go to Drafts / View modules filter)
```

---

## Key files

| Path | Role |
|------|------|
| `src/features/module-library/pages/VideoUploadPage.tsx` | Video upload & ingest UI |
| `src/features/module-library/pages/IngestDocumentPage.tsx` | Document-only ingest (video excluded; uses shared status panel) |
| `src/features/module-library/constants/videoAcceptedFileTypes.ts` | Video accept/reject rules |
| `src/features/module-library/constants/ingestAcceptedFileTypes.ts` | Document types (no video) |
| `src/features/module-library/components/ReingestConfirmDialog.tsx` | Re-ingest confirmation + `REINGEST_VIDEO_WARNING` |
| `src/features/module-library/components/IngestRunStatusPanel.tsx` | Shared ingest progress / polling UI |
| `src/features/module-library/utils/videoIngestSessionStorage.ts` | Multi-session restore across refresh |
| `src/features/module-library/pages/ModuleLibraryPage.tsx` | Modules list + source-document filter |
| `src/constants/routes.ts` / `src/routes/AppRoutes.tsx` | `paths.videoUpload` |
| `src/components/layout/Sidebar.tsx` | **Ingest video** nav (PM only) |

Reused as-is: `adminIngestApi`, `useIngestWithDuplicateHandling`, `useFetchSourceDocumentsQuery`, `utils/ingestStatus.ts`, shared `Table` / UI primitives.

---

## Requirements status (code review)

**Method:** Frontend code review only (no runtime / backend verification). Audit date: 2026-07-20.

| Area | Status |
|------|--------|
| Dedicated Video Upload workflow | **Mostly implemented** |
| Document Ingestion isolation from video | **Implemented** |
| Modules page video-based filtering | **Partially implemented** |

### Story 1 — Video Upload & Ingestion

| # | Acceptance criterion | Status |
|---|---------------------|--------|
| 1 | Video files cannot be uploaded through document ingestion | ✅ |
| 2 | Dedicated video upload page available | ✅ |
| 3 | Upload progress visible; duplicate uploads prevented | ⚠️ Prevention yes; no dedicated progress bar (button shows **Uploading…**) |
| 4 | Uploaded videos in a paginated table | ✅ |
| 5 | Multi-select ingest | ✅ |
| 6 | Helper text that ingest creates modules | ✅ |
| 7–8 | Re-ingest warning lists selected already-ingested videos | ✅ |
| 9 | Re-ingest resets progress/quiz only for affected modules | ⚠️ Backend — UI sends `override_duplicates` only |
| 10 | Already-ingested videos visually distinct | ⚠️ Badge only; no row background |
| 11 | Track progress with existing status UI | ✅ (+ session restore) |
| 12 | Redirect to Modules after success | ✅ |

### Story 2 — Filter Modules by ingested video

| # | Acceptance criterion | Status |
|---|---------------------|--------|
| 1 | Filter named **Ingested Video** | ❌ Labeled **Source document** |
| 2 | Shows all ingested video names | ⚠️ All ingested source documents (all types), not video-only |
| 3–6 | Search, clear, combine with other filters, pagination/totals | ✅ |

**Workaround:** Select the video’s source document in the Modules combobox, or use **View modules** from the Video Upload page.

---

## Open items

1. **Upload progress UI** — Add a `Loader` / progress indicator during real server upload (`isUploading`), not only staging.
2. **Deepak message** — Confirm final `REINGEST_VIDEO_WARNING` copy (bullets if required).
3. **Already-ingested row styling** — Optional row background when status is Already Ingested.
4. **Ingested Video filter** — Rename and/or scope Modules filter to `source_type: video`, or add a dedicated video filter.
5. **Backend verification** — Confirm `override_duplicates` resets learner progress/quiz only for affected modules.

---

## Manual acceptance checklist

1. Document Ingestion rejects `.mp4`; hint points to Video Upload.
2. PM sees **Ingest video** in sidebar; supervisor does not; direct URL redirects home.
3. Choose → Upload stages row; duplicate filename attaches to existing row / no duplicate staging.
4. Pagination works for large video lists.
5. Select new videos → Ingest → panels update; helper text visible.
6. Already-ingested selection → dialog → cancel aborts; confirm re-ingests with override.
7. After re-ingest, backend confirms progress/quiz reset scope.
8. Success redirects to Modules; **View modules** pre-filters by source; clearing filter restores full list.

---

## Test coverage

| Area | Tests |
|------|--------|
| Session storage merge/prune/clear | `videoIngestSessionStorage.test.ts` |
| Video accept types | `videoAcceptedFileTypes.test.ts` |
| Re-ingest dialog | `ReingestConfirmDialog.test.tsx` |
| Status panel (incl. poll delay) | `IngestRunStatusPanel.test.tsx` |
| Video upload page (stage, ingest, re-ingest, cancel, backend dup, filter, nav, restore, prune) | `VideoUploadPage.test.tsx` |
| Modules source-document filter | `ModuleLibraryPage.test.tsx` |
| Sidebar PM / supervisor ingest links | `Sidebar.test.tsx` |
| Source documents API (pagination, `q`, `source_type`) | `adminSourceDocumentsApi.test.ts` |
