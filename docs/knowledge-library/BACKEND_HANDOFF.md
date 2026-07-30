# Backend Handoff: Upload Knowledge

**Audience:** coaching-platform backend owner  
**Frontend repo:** `micro-learning-analytics-dashboard`  
**Status:** Frontend implementation reviewed; this doc reflects the contract the current UI expects  
**Last updated:** 2026-07-30  
**Related:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) §7

---

## Goal

Knowledge PDFs are a separate admin-managed content domain. The Upload Knowledge flow allows an admin to:

1. upload one PDF
2. either keep it as one knowledge asset (`Upload Original`) or define multiple page-range assets (`Split Document`)
3. optionally provide custom thumbnails
4. poll processing state until complete or failed
5. see created assets in the Knowledge Library table

Important product rule: do **not** physically split the uploaded PDF into multiple stored files for v1. Store one uploaded PDF and create one or more asset records that reference page ranges within that parent upload.

---

## Frontend-reviewed backend surface

The current frontend calls these endpoints from `src/features/module-library/api/adminKnowledgeApi.ts`.

| Method | Path | Required by FE |
|--------|------|----------------|
| `POST` | `/admin/knowledge/uploads` | Create a knowledge upload job from one PDF |
| `GET` | `/admin/knowledge/uploads/{uploadId}` | Poll upload / processing status |
| `GET` | `/admin/knowledge/assets` | Render the knowledge library table |
| `GET` | `/admin/knowledge/uploaders` | Populate the searchable `Uploaded by` combobox |
| `PATCH` | `/admin/knowledge/assets/{id}` | Update asset title |
| `PUT` | `/admin/knowledge/assets/{id}/thumbnail` | Replace asset thumbnail |
| `POST` | `/admin/knowledge/assets/{id}/deactivate` | Soft-delete asset and clear assignments |
| `GET` | `/admin/knowledge/assets/{id}/download` | Download original uploaded PDF |
| Assign | Existing assignment flow | Knowledge asset must be assignable via existing assignment system |

Path prefix can still be BE-owned, but if names change the FE API layer must be updated in lockstep.

---

## Upload flow requirements

### 1. Initial upload

The UI only allows a **single PDF file** to be selected.

Accepted frontend upload modes:

- `original`
- `split`

### 2. Upload Original mode

Frontend submits multipart form data:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | file | yes | PDF only |
| `mode` | string | yes | `original` |
| `title` | string | yes | Trimmed before submit |
| `thumbnail` | file | no | Optional custom thumbnail uploaded in the same request |

Behavior expected by FE:

- If `title` is missing, FE blocks submit client-side.
- If request succeeds, FE stores `upload_id` and starts polling status.
- Inputs become disabled while upload / processing is active.

### 3. Split Document mode

Frontend submits multipart form data:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `file` | file | yes | PDF only |
| `mode` | string | yes | `split` |
| `splits` | JSON string | yes | Array of split objects |

Split object shape sent by FE:

```json
{
  "title": "Hypertension Overview",
  "start_page": 1,
  "end_page": 3
}
```

Notes:

- FE sends one or more split rows.
- FE does **not** send split thumbnails in the initial upload request.
- Each split may have an optional local thumbnail selected in the UI, but those are uploaded **after** the backend marks the processing job as `completed`.

### 4. Split thumbnail sequencing

This is the most important backend implication from the current UI.

For split mode, the FE does the following:

1. submit `POST /admin/knowledge/uploads`
2. receive `upload_id` and `asset_ids`
3. poll `GET /admin/knowledge/uploads/{uploadId}` until status becomes `completed`
4. for each split that had a custom thumbnail selected, call `PUT /admin/knowledge/assets/{id}/thumbnail`

Backend requirements implied by this:

- `asset_ids` must be returned in the **same order** as the submitted `splits` array
- those asset ids must be valid by the time the upload status becomes `completed`
- thumbnail replacement endpoints must work immediately after completion
- if no custom split thumbnails were selected, FE makes no follow-up thumbnail calls

---

## Required upload response

The current FE expects this response shape from `POST /admin/knowledge/uploads`:

```json
{
  "upload_id": "upload_123",
  "status": "queued",
  "poll_url": "/admin/knowledge/uploads/upload_123",
  "asset_ids": ["asset_1", "asset_2"]
}
```

### Response field expectations

| Field | Required | Notes |
|-------|----------|-------|
| `upload_id` | yes | FE stores this and uses it for polling |
| `status` | yes | FE currently supports `queued`, `processing`, `completed`, `failed` |
| `poll_url` | expected | FE does not currently consume it directly, but the contract already includes it |
| `asset_ids` | yes | Required especially for split mode thumbnail follow-up |

Recommendation:

- In `original` mode, return a single asset id in `asset_ids`
- In `split` mode, return one asset id per split, in submitted order

---

## Validation rules backend must enforce

The FE performs only partial validation. Backend must remain source of truth.

### File validation

- uploaded file must be a PDF
- reject unsupported content type / extension combinations
- reject empty or unreadable files

### Original mode validation

- `title` is required
- trimmed title must not be empty

### Split mode validation

Frontend already checks these, but backend must enforce them too:

- at least one split is required
- each split title is required
- `start_page` must be an integer >= 1
- `end_page` must be an integer >= 1
- `start_page <= end_page`
- split page ranges must be within the actual PDF page count

### Recommended additional backend validation

These are not enforced by FE today, but backend should define behavior explicitly:

- whether overlapping split ranges are allowed
- whether duplicate titles are allowed within the same upload
- max split count per upload
- max PDF file size
- max title length

If BE adds stricter rules here, FE should surface them with explicit error messaging.

---

## Processing status contract

The page polls `GET /admin/knowledge/uploads/{uploadId}` every **2 seconds** until the status is terminal.

Terminal states recognized by FE:

- `completed`
- `failed`

Non-terminal states recognized by FE:

- `queued`
- `processing`

Expected response shape:

```json
{
  "upload_id": "upload_123",
  "status": "processing",
  "progress_percent": 45,
  "assets": [],
  "error": null
}
```

### Status response requirements

| Field | Required | Notes |
|-------|----------|-------|
| `upload_id` | yes | Echo of the polled upload |
| `status` | yes | One of the four values above |
| `progress_percent` | yes | FE clamps to 0-100 and renders a progress bar |
| `assets` | yes | Array of created / known assets for this upload |
| `error` | optional | Shown to the user when status is `failed` |

### Behavior requirements

- backend should move status from `queued` -> `processing` -> `completed` or `failed`
- `progress_percent` should be a real number the FE can display
- when status is `failed`, return a user-safe `error` message
- when status is `completed`, all asset ids returned from the initial upload must be fully usable

### Partial failure note

The original provisional design mentioned partial split failure. The current FE does **not** have explicit per-split failure rendering. If BE wants partial-success behavior, we should align on status / asset payload semantics first. For now, the FE contract is simplest if the upload job resolves as either:

- fully `completed`, or
- fully `failed`

If partial success is important, add a dedicated backend/FE alignment task.

---

## Thumbnail requirements

### Auto-generated thumbnails

For assets created from PDF content, the UI assumes the backend can generate a default thumbnail from the document itself.

For split mode specifically, the helper text and current product expectation are:

- generate thumbnail from the split's `start_page`

### Custom thumbnail replacement

The FE calls:

`PUT /admin/knowledge/assets/{id}/thumbnail`

with multipart form data:

| Field | Type | Required |
|-------|------|----------|
| `thumbnail` | file | yes |

Required backend behavior:

- accept common image uploads
- replace the stored thumbnail for that asset
- return the updated knowledge asset in the standard asset wire shape

---

## Knowledge asset wire shape

This is the normalized wire contract consumed by FE today.

```json
{
  "id": "asset_123",
  "title": "HTN Referral Guidelines",
  "file_type": "pdf",
  "start_page": 1,
  "end_page": 8,
  "page_count": 24,
  "thumbnail_url": "https://...",
  "uploaded_at": "2026-07-30T08:00:00Z",
  "uploaded_by": "Program Manager",
  "updated_at": "2026-07-30T08:05:00Z",
  "assigned": false,
  "ingested": false,
  "status": "ready",
  "parent_upload_id": "upload_123"
}
```

### Field requirements

| Field | Required | Notes |
|-------|----------|-------|
| `id` | yes | Asset identifier |
| `title` | yes | Display name |
| `file_type` | yes | FE currently expects `pdf` |
| `start_page` | yes | Used in table display |
| `end_page` | yes | Used in table display |
| `page_count` | recommended | Optional in FE, but useful for debugging and future UX |
| `thumbnail_url` | nullable | Null allowed |
| `uploaded_at` | yes | ISO-8601 string |
| `uploaded_by` | yes | Human-readable display value today |
| `updated_at` | yes | ISO-8601 string |
| `assigned` | yes | Used in filters and assignment state |
| `ingested` | yes | Used in filters |
| `status` | yes | FE recognizes `processing`, `ready`, `failed`, `deactivated` |
| `parent_upload_id` | yes | Groups assets back to the upload |

---

## Library list requirements

The Knowledge Library table on the same page consumes:

`GET /admin/knowledge/assets`

### Query params expected by FE

| Param | Notes |
|------|-------|
| `q` | Free-text search |
| `uploaded_by` | Single exact-match value chosen from the searchable uploaders combobox |
| `assigned` | `yes` / `no` / omitted when `all` |
| `ingested` | `yes` / `no` / omitted when `all` |
| `status` | `active` or `deactivated` |
| `uploaded_at_from` | Date filter |
| `uploaded_at_to` | Date filter |
| `updated_at_from` | Date filter |
| `updated_at_to` | Date filter |
| `sort_by` | `uploaded_at`, `updated_at`, `title`, `uploaded_by` |
| `sort_order` | `asc` / `desc` |
| `page` | 1-based |
| `page_size` | Current FE defaults to 20 |

### Response shape expected by FE

```json
{
  "assets": [],
  "total": 0,
  "page": 1,
  "page_size": 20
}
```

### List behavior required by FE

- default `status` is `active`
- deactivated assets should only show when `status=deactivated`
- `title`, page range, thumbnail, uploaded by, uploaded at, updated at, assigned state, and ingested state must all be queryable enough to support current filters

---

## Uploaders filter endpoint

The table filter drawer requires:

`GET /admin/knowledge/uploaders`

The FE renders **Uploaded by** as a searchable combobox (same shared `Combobox` pattern as Module Library source-document filter). Typing in the combobox triggers a **backend search** via `q`; the FE does not filter the full uploader list locally.

### Query params

| Param | Required | Notes |
|------|----------|-------|
| `q` | no | When provided (non-empty), return uploaders whose display name/label matches the search term. When omitted or empty, return the default distinct uploader options for the combobox. |

### Expected response

```json
{
  "uploaders": [
    { "value": "Program Manager", "label": "Program Manager" }
  ]
}
```

### Requirements

- search must be performed server-side using `q`
- return distinct options suitable for a searchable dropdown
- FE currently treats `value` as the exact `uploaded_by` filter input on the assets list
- stable human-readable `label` values are required for search display
- prefer case-insensitive substring match on the uploader display name
- prefer sorted options
- include uploaders from deactivated assets if useful for history filtering
- empty `q` / missing `q` should still return a usable initial option set for the combobox

---

## Edit / deactivate / download requirements

### Update title

`PATCH /admin/knowledge/assets/{id}`

Body:

```json
{
  "title": "Updated title"
}
```

Expected response:

- updated asset in the standard knowledge asset wire shape

### Deactivate

`POST /admin/knowledge/assets/{id}/deactivate`

Expected backend behavior:

- soft-delete / deactivate the asset
- clear existing assignments
- keep original uploaded PDF intact

### Download

`GET /admin/knowledge/assets/{id}/download`

Expected response:

```json
{
  "download_url": "https://...",
  "filename": "knowledge.pdf"
}
```

The FE creates an anchor tag from this response and downloads the original uploaded PDF.

---

## Error handling expectations

The FE surfaces backend errors inline using `formatRtkQueryError(...)`.

Backend should therefore provide:

- meaningful HTTP status codes
- concise, user-safe error messages for validation failures
- concise, user-safe error messages for processing failures

Important cases to cover:

1. invalid PDF upload
2. missing original title
3. invalid split range
4. page range outside document bounds
5. upload job lookup not found
6. thumbnail replacement failure
7. deactivation failure
8. download link generation failure

---

## Key implementation notes for BE

1. The upload page is already built around an **async job model** with polling.
2. Split thumbnail replacement currently depends on `asset_ids` being returned in split order.
3. The FE expects knowledge assets to have an `ingested` flag even though this page is not the ingest flow itself.
4. The FE already renders the knowledge library table on the same page, so list endpoints are part of the same feature handoff.
5. The FE currently assumes one upload job resolves to one or more asset rows under a shared `parent_upload_id`.

---

## Non-goals

- Do not require FE to use ingest endpoints for knowledge upload.
- Do not physically split PDFs into multiple stored PDF files for v1.
- Do not block FE on a page-count preflight endpoint; current flow does not use one.

---

## FE mock / integration note

Dashboard mocks currently implement the endpoints above. When BE lands, align any renamed paths or field names in:

- `src/features/module-library/api/adminKnowledgeApi.ts`
- `src/features/module-library/types/knowledgeLibrary.types.ts`
- this document
