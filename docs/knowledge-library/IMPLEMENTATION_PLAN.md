# Implementation Plan: Dedicated Knowledge Library

**Author:** Frontend (dashboard) + Backend handoff  
**Date:** 2026-07-29  
**Status:** Approved — Phase 0–1 in progress  
**Repos:**  
- Implement: `micro-learning-analytics-dashboard`  
- Document only: `coaching-platform` (backend owner)

---

## 1. Summary

Add a Program Manager–only **Upload Knowledge** experience under Learning: upload a single PDF, choose either full-document (“Upload Original”) or page-range splits, show progress using existing ingest progress patterns, then manage assets in an on-page library table (search/filters, assign, edit title/thumbnail, download, soft-delete). Remove the **Enable for knowledge section** checkbox from Ingest Document. Frontend ships in **one PR** against **mocks** until coaching-platform APIs exist; backend work is listed explicitly for handoff.

---

## 2. Problem Statement

**Today:** “Knowledge” is only a `sync_published_visible` flag on ingest source documents. There is no dedicated upload/manage/assign UI, no page-range splits, and knowledge is coupled to the ingest → module pipeline.

**Desired:** Content admins (Program Managers) manage knowledge PDFs separately from ingest, with optional section splits, library management, and the same PO/SK/geography assignment UX as modules.

**Gap:** New dashboard feature surface + new backend domain/APIs (mocked on FE until ready) + cleanup of ingest Knowledge checkbox.

---

## 3. Out of Scope

- Android SDK / device Knowledge consumption changes  
- Physical PDF extraction per split  
- Ingested / File Type filters  
- New “Content Admin” role (use Program Manager)  
- i18n expansion beyond existing PM patterns  
- Feature flag (PM route gate only)  
- Implementing coaching-platform changes in this FE ticket  

---

## 4. Risks & Open Questions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mock contract drifts from real BE APIs | Medium | Medium | Keep mock shapes in one types module; BE handoff lists canonical contract; swap base URLs when BE lands |
| `ModuleAssignmentDialog` hard-codes `moduleId` | Medium | Medium | Thin adapter props (`resourceId` / knowledge mode) or small wrapper — minimal change, reuse UI |
| Removing `sync_published_visible` breaks Android Knowledge until new sync exists | Medium | High | BE + Android coordinate; FE only removes ingest checkbox; document sync cutover in BE handoff |
| Large PDF page-count validation needs BE | Low | Medium | FE validates start≤end and optimistic bounds if page count known; BE is source of truth |
| One large FE PR | Medium | Low | Internal phases/commits in one PR; clear checklist in DoD |

### Open Questions

- [x] Routes Option A vs B → **A**  
- [ ] Final REST path prefix (`/admin/knowledge-assets` vs other) — **BE owner decides**; FE mocks use provisional paths documented below  

---

## 5. Design

### Current State

- Learning nav: Module Library, Ingest Document, Upload Video, Ingestion History (`Sidebar.tsx`, PM-gated).  
- Ingest Document: per-file “Enable for knowledge section” → multipart `sync_published_visible` (`IngestDocumentPage.tsx`).  
- Assignment: `ModuleAssignmentDialog` + `adminAssignmentApi` (PO/SK/geography).  
- Progress: `IngestUploadProgress` (+ ingest status panels).  
- Soft delete UX pattern: Module Library deactivated tab.  
- Mocks: `src/store/apis/mockBaseQuery.ts` when `VITE_USE_MOCK_API`.  
- Thumbnails (BE today): `render_pdf_page_to_png` / `source_thumbnail_service`.

### Proposed Design (FE)

```text
Learning → Upload Knowledge  (PM only)
  ┌─────────────────────────────────────────────┐
  │ Mode: ( ) Upload Original  ( ) Split Document│
  │ File picker: PDF only (single file)          │
  │                                              │
  │ Original → Title (+ optional custom thumb)   │
  │ Split    → N × KnowledgeSplitEditor rows     │
  │            Thumbnail | Title | Start | End   │
  │            [+ Add Split]                     │
  │ [Upload] → IngestUploadProgress-style UI     │
  │                                              │
  │ ── Knowledge Library table (same page) ──    │
  │ Filters | sort | pagination                  │
  │ Assign | Edit | Download | Delete            │
  └─────────────────────────────────────────────┘
```

Ingest Document: remove knowledge checkbox + stop sending `sync_published_visible` (send default false or omit per BE mock contract).

### Key Design Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Storage | Page ranges on one PDF | Physical extracts | Simpler, matches Android page viewer later, clear Download |
| IA | One menu + one page | Two menus | Ticket wording; less nav clutter |
| Data while BE pending | mockBaseQuery | Wait for BE | Unblocks FE |
| Assignment | Reuse dialog | New dialog | Ticket + less UI drift |
| Soft delete | Deactivated lifecycle | Hard delete | Ticket AC |
| Components | Reuse + small extracts | Big new framework | User quality bar |

### Data Model (FE types — provisional)

```ts
type KnowledgeUploadMode = 'original' | 'split';

type KnowledgeAssetStatus = 'processing' | 'ready' | 'failed' | 'deactivated';

interface KnowledgeAsset {
  id: string;
  title: string;
  fileType: 'pdf';
  startPage: number;
  endPage: number;
  pageCount?: number; // of parent PDF
  thumbnailUrl: string | null;
  uploadedAt: string;
  uploadedBy: string;
  updatedAt: string;
  assigned: boolean;
  status: KnowledgeAssetStatus;
  parentUploadId: string;
  // download uses parent original storage
}
```

### API / Interface Changes (provisional contract for mocks + BE)

| Method | Path (provisional) | Purpose |
|--------|--------------------|---------|
| `POST` | `/admin/knowledge/uploads` | Multipart PDF + mode + splits JSON / original metadata |
| `GET` | `/admin/knowledge/uploads/{uploadId}` | Progress / processing status |
| `GET` | `/admin/knowledge/assets` | List + search/filters/sort/page |
| `GET` | `/admin/knowledge/uploaders` | Distinct uploaders for Uploaded By single-select filter |
| `PATCH` | `/admin/knowledge/assets/{id}` | Title (+ metadata) |
| `PUT` | `/admin/knowledge/assets/{id}/thumbnail` | Custom thumbnail |
| `POST` | `/admin/knowledge/assets/{id}/deactivate` | Soft delete + clear assignments |
| `GET` | `/admin/knowledge/assets/{id}/download` | Original PDF download URL or stream |
| Assign | Extend existing `/admin/assignments` | Accept knowledge asset id (or `resource_type`) |

Exact paths/names are **BE-owned**; FE centralizes them in `adminKnowledgeApi.ts`.

---

## 6. Implementation Tasks (Frontend)

### Phase 0 — Contract & scaffolding

- [x] **Types + constants** — `features/module-library/types/knowledgeLibrary.types.ts`, `constants/knowledgeAcceptedFileTypes.ts` (PDF only), filter defaults.  
- [x] **Routes** — add `paths.uploadKnowledge` in `src/constants/routes.ts`; register PM-gated route in `AppRoutes.tsx`.  
- [x] **Nav** — Learning item “Upload Knowledge” in `Sidebar.tsx` (PM only), placed near Ingest Document.  
- [x] **RTK API slice** — `api/adminKnowledgeApi.ts` wired through existing base query.  
- [x] **Mocks** — handlers in `mockBaseQuery.ts` for upload, progress poll, list/filter, patch, thumbnail, deactivate, download; seed data covering assigned/unassigned and one deactivated.  
- [x] **BE handoff note** — keep `docs/knowledge-library/BACKEND_HANDOFF.md` in sync with mock paths (or §7 below as the single source).

### Phase 1 — Remove ingest Knowledge checkbox

- [x] **IngestDocumentPage** — remove UI + `syncPublishedVisibleByFile` state; stop sending meaningful visibility flags (always `false` or omit — match mock/BE).  
- [x] **Defaults / tests** — clean `ingestFormDefaults` and any tests asserting the checkbox.  
- [x] **Video upload** — confirm no user-facing Knowledge checkbox; leave code alone unless it still posts true by default (keep false).

### Phase 2 — Upload + splits UI

- [ ] **Page shell** — `pages/KnowledgeLibraryPage.tsx` (or `UploadKnowledgePage.tsx`): mode toggle, single PDF picker, validation.  
- [ ] **`KnowledgeSplitEditor`** (new small component) — one row: thumb preview/upload, title, start/end page, remove; used in a list with **+ Add Split**.  
- [ ] **Original mode form** — title + optional custom thumbnail.  
- [ ] **Client validation** — start ≤ end; positive ints; if page count known from mock/BE response after select, clamp ranges; require ≥1 split in split mode; require title.  
- [ ] **Upload action** — call mock upload API; show **`IngestUploadProgress`** (reuse) for bytes progress.  
- [ ] **Processing status** — reuse ingest status panel patterns where they fit without forcing ingest batch semantics; if reuse is awkward, thin `KnowledgeProcessingStatus` that visually matches (same Loader/status primitives), not a second design system.

### Phase 3 — Library table + filters

- [ ] **`KnowledgeLibraryTable`** — columns: Thumbnail, File Title, File Type, Uploaded Date, Uploaded By, Last Updated, Assign, Download, Delete; row layout avoids truncating thumb + actions (ticket UI AC).  
- [ ] **Filters** — Module Library–style drawer (`SettingsFilterDrawer` + `SettingsFilterRenderer`): Uploaded by (single-select from `GET /admin/knowledge/uploaders`), Assigned Y/N, Uploaded / Last updated date ranges; draft + Apply. Keep Search title + Sort outside (search queries on change). Clear All resets drawer fields only. Active filter indicator when non-default drawer filters applied. Pagination stays on the table. URL sync nice-to-have if cheap.  
- [ ] **Dates** — `formatDisplayDateTime` everywhere.  
- [ ] **Active vs deactivated** — default active; simple tab or status control mirroring Module Library deactivated pattern (lightweight).

### Phase 4 — Assign / edit / download / delete

- [ ] **Assign** — open `ModuleAssignmentDialog` via minimal adapter (pass knowledge asset id as `moduleId` only if BE mock treats it the same **or** extend dialog props to `resourceId` + optional label — prefer small prop extension over copy-paste dialog).  
- [ ] **Edit** — modal/drawer: title + thumbnail replace; PATCH + PUT mock.  
- [ ] **Download** — trigger mock download URL.  
- [ ] **Delete** — confirm → deactivate mock; refresh list; assignments cleared in mock state.

### Phase 5 — Tests & polish

- [ ] Unit tests: split validation utils; filter query builders; mode exclusivity.  
- [ ] Component tests: page smoke (PDF accept, add split, upload → table); checkbox removed from Ingest.  
- [ ] Manual pass against mocks (checklist §7).  
- [ ] Ruff N/A; run dashboard lint/tests for touched files.

**Code quality guardrails**

- Reuse `IngestUploadProgress`, assignment dialog, UI kit (`Button`, `Modal`, `Table` patterns), date helper.  
- Extract only: split row editor, library table, knowledge API/types, maybe filter bar if the page gets long.  
- No generic “Knowledge framework” or premature shared package.

---

## 7. Backend Handoff (coaching-platform) — for backend owner

> Frontend will mock these. Please implement and confirm final paths/schemas.

### Must have

1. **Knowledge domain** distinct from ingest→module pipeline (new tables or clearly typed resources).  
2. **`POST` upload** — single PDF; body/mode: `original` | `split`; splits: `{ title, start_page, end_page }[]`; validate page ranges against PDF page count; store **one** object-storage file.  
3. **Processing** — create assets; generate thumbnail per asset from **start_page** (`render_pdf_page_to_png`); progress endpoint; **partial failure**: failed splits don’t wipe successful ones.  
4. **List API** — search, uploaded_at range, uploaded_by (exact match from uploaders dropdown), updated_at, assigned yes/no, status (active/deactivated), sort, pagination.  
4a. **Uploaders API** — `GET /admin/knowledge/uploaders` for the filter drawer single-select (not free-text / not multi).  
5. **PATCH title**; **PUT thumbnail** (optional replace).  
6. **Deactivate** — clear assignments; mark deactivated; **do not** delete underlying PDF.  
7. **Download** — original uploaded PDF.  
8. **Assignments** — reuse existing assignment workflow for knowledge asset IDs (PO / SK / PO&SK / geographical).  
9. **Audit** — upload, update, assign, deactivate via existing attribution/audit patterns.  
10. **Ingest cleanup (same delivery)** — remove Knowledge-via-ingest: stop relying on `sync_published_visible` for Knowledge; clear or ignore historical flags; coordinate Android published-sync cutover (separate Android ticket for new knowledge sync).

### Nice / later

- Sync API for Android Knowledge section: asset id, title, thumbnail, file URL, start_page, end_page.  
- Page-count probe endpoint for FE pre-validation before upload completes.

### Explicit non-goals for BE in this product direction

- Do **not** physically slice PDFs into N files for v1.  
- Do **not** require FE to call ingest `/admin/ingest` for knowledge.

---

## 8. Testing Plan

### Automated Tests

| Test Type | What It Covers | New or Updated? |
|-----------|----------------|-----------------|
| Unit | Page-range validation; filter params | New |
| Component | Upload Knowledge page flows (mock API); Ingest checkbox removed | New / Updated |
| API slice | Query/mutation URL shapes | New |

### Manual / Acceptance (against mocks)

1. PM sees **Upload Knowledge** under Learning; supervisor does not.  
2. Ingest Document has **no** Enable for knowledge section.  
3. Upload Original → progress → row in table with full-page range.  
4. Split mode: add 2+ splits, invalid range blocked, upload succeeds; one mocked failure still shows successful assets.  
5. Filters/search/sort/pagination behave.  
6. Assign opens existing dialog; edit title/thumbnail; download; delete → deactivated / cleared assign.  
7. Dates use standard display format; row shows thumb + actions without ugly truncation.

### Edge Cases

- [ ] Empty split list blocked  
- [ ] Start > End blocked  
- [ ] Switching mode clears the other mode’s draft fields  
- [ ] Deactivated assets not in default list  
- [ ] Single file only (no multi-select)

---

## 9. Migration Plan

- **FE:** none (UI + mocks).  
- **BE (owner):** schema for knowledge assets + assignment target; data migration/clear of `sync_published_visible` as agreed with Android.  
- **Rollback of BE migration:** soft-delete/flags preferred over destructive drops.

---

## 10. Rollout Plan

### Deployment Strategy

PM-gated route, no feature flag. FE can ship with mocks behind `VITE_USE_MOCK_API` for local/demo; production uses real API once BE is deployed.

### Deployment Order

1. Backend Knowledge APIs + ingest checkbox semantics cleanup (BE).  
2. Frontend PR pointing at real endpoints (replace mocks).  
3. Android sync follow-up (separate).

### Cutover

Until BE ships, FE Knowledge features work only with mock API flag. Ingest checkbox removal can ship earlier if BE accepts missing/`false` `sync_published_visible` (already default false).

### Monitoring

BE-owned: upload/processing error rates, assignment failures. FE: standard dashboard error toasts.

---

## 11. Rollback Plan

### Trigger

Broken Learning nav, ingest regressions, or Knowledge page errors in PM flows.

### Steps

1. Revert FE PR / disable route.  
2. BE: feature-disable knowledge routes if needed; ingest remains usable.  

### Irreversible

BE clearing `sync_published_visible` may remove docs from current Android Knowledge until new sync — coordinate before prod clear.

---

## 12. Security Considerations

- PM / admin-plane auth only (same as other `/admin/*`).  
- PDF upload size/type validation on BE.  
- Assignment remains authorization-sensitive (existing controls).  
- Downloads via auth’d URLs / presign.

---

## 13. Performance Considerations

- Single PDF upload; avoid loading full PDF into memory in browser beyond picker.  
- Table pagination required.  
- Thumbnail URLs presigned/cached like source docs.

---

## 14. Documentation Updates

- [x] `docs/knowledge-library/DISCUSSION.md`  
- [x] `docs/knowledge-library/IMPLEMENTATION_PLAN.md` (this file)  
- [x] `docs/knowledge-library/BACKEND_HANDOFF.md` (BE owners — provisional contract)  

---

## 15. Communication Plan

| Audience | Message | Channel | Timing |
|----------|---------|---------|--------|
| You (FE owner) | Approve plan → implement | This chat | Before coding |
| Backend owner | §7 handoff contract | Ticket / Slack / PR link | Before/parallel to FE |
| Android | Sync cutover when BE clears published flag | Separate ticket | Before prod cleanup |

---

## 16. Timeline & Milestones

| Milestone | Target | Owner |
|-----------|--------|-------|
| Plan approval | TBD | You |
| FE Phase 0–1 scaffolding + ingest cleanup | TBD | FE |
| FE Phase 2–4 UI + mocks | TBD | FE |
| FE Phase 5 tests + one PR | TBD | FE |
| BE APIs per §7 | TBD | Backend |
| Wire FE to real APIs | TBD | FE |
| Android knowledge sync | Later | Android |

---

## 17. Definition of Done

- [ ] All FE phases complete in **one PR**  
- [ ] Upload Knowledge PM-gated; Option A single page  
- [ ] PDF-only; Original **xor** Splits; progress via existing patterns  
- [ ] Library table + agreed filters; assign/edit/download/deactivate  
- [ ] Ingest Knowledge checkbox removed  
- [ ] Mocks cover required flows; BE §7 documented for backend  
- [ ] Automated tests for validation + key UI; CI green for dashboard  
- [ ] Your review approved  
- [ ] No Android changes in this PR  

---

## Approval

Approved 2026-07-29 — Phase 0–1 implementation started.
