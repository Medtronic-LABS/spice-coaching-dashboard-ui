# SPICE Admin Dashboard — Backend Readiness (ingestion-merge)

**Date:** 2026-08-12  
**Backend branch reviewed:** `ingestion-merge` (`coaching-platform`)  
**UI reference:** [SPICE Admin prototype (Netlify)](https://spectacular-pithivier-892ab3.netlify.app/)  
**Frontend repo:** `micro-learning-analytics-dashboard` (admin dashboard UI wired under `src/features/admin-dashboard`)

---

## Executive summary

The **`ingestion-merge` branch already exposes the core dashboard API surface** needed for the Program Head / admin analytics portal in the UI mock. You can proceed with frontend integration for most widgets without waiting on new backend routes.

| Area | Backend on `ingestion-merge` | Frontend today |
|------|------------------------------|----------------|
| Hierarchy table (AM → PO → SK drill-down) | ✅ `GET /dashboard/team-activity` | ✅ Wired (`TeamHierarchySection`) |
| Training modules (launched + SK completions) | ✅ `GET /dashboard/published-module-completions` | ✅ Wired |
| Module demand / performance | ✅ `GET /dashboard/digital-help-modules` | ✅ Wired |
| **Top searched modules** (replaces chatbot queries) | ✅ Same endpoint — sort by `digital_help_count` | ✅ Wired |
| **Top suggested modules** (replaces chatbot queries) | ✅ Same endpoint — sort by `module_requested_count` | ✅ Wired |
| **PDF / knowledge document analytics** | ✅ `GET /dashboard/document-usage` | ✅ Wired; telemetry emitted on knowledge download |
| Content-gap suggestions (optional panel) | ✅ `GET /dashboard/module-creation-suggestions` | ⚠️ API client ready; UI panel not shipped yet |

**Main blockers for a data-rich dashboard are not missing APIs — they are (1) frontend implementation, (2) client telemetry for PDF views, and (3) a few UX filters/sorts that the backend does not expose as query params (derive client-side or add BE follow-ups).**

---

## UI mock → backend mapping

Reference layout from the Netlify prototype:

| UI section | Intended behaviour | Backend endpoint | Readiness |
|------------|-------------------|------------------|-----------|
| **Filters** — duration (all time / week / month / custom) | Date range on all widgets | All dashboard routes accept `from`/`to` (alias `from_date`/`to_date` on some routes — see below) | ✅ Pass dates from filter bar |
| **Filters** — status (On track / At risk) | Filter hierarchy rows | No dedicated `status` or `at_risk` field | ⚠️ **Client-derived** from `team-activity` fields (see § Gaps) |
| **Area Managers** table + “View POs” drill-down | One hierarchy level at a time | `GET /dashboard/team-activity` | ✅ |
| **Sort** — At risk first, lowest completion, etc. | Re-order members | Server returns members **sorted by name only** | ⚠️ **Client-side sort** on response |
| **Training Modules** — Module name, Launched, SKs completed | Published modules in range + completion fraction | `GET /dashboard/published-module-completions` | ✅ Admin / AM only |
| **Module Performance** | Module uptake / engagement chart | No dedicated chart endpoint | ⚠️ Build from `digital-help-modules` and/or roll up `team-activity` `chatbot_modules` |
| **Top Chatbot Queries** (to be removed) | Deduped question text | `GET /dashboard/team-activity/users/{user_id}/questions` or module questions route | ✅ Exists but **product direction changed** |
| **Top searched modules** (new) | Modules most queried via chatbot/RAG | `GET /dashboard/digital-help-modules` → rank by `digital_help_count` | ✅ |
| **Top suggested modules** (new) | Modules most **requested** by field users | Same route → rank by `module_requested_count` | ✅ |
| **PDF view analytics** (new) | Knowledge doc views, frequency, engagement | `GET /dashboard/document-usage` | ✅ API; ⚠️ empty until clients emit telemetry |

---

## Dashboard API catalogue (`ingestion-merge`)

All routes live under the platform **`dashboard` shared auth plane** (`README.md` — Admin principals **or** organizer PO with `client: mob`). Tenant is taken from the authenticated SPICE user (`userDetail.country.tenantId`), not from a query param.

Canonical prefix: `{API_ROOT_PATH}/dashboard/...` (e.g. `/medtronics-api/dashboard/...` in deployed envs).

### 1. Team hierarchy & engagement

**`GET /dashboard/team-activity`**

| Query param | Notes |
|-------------|-------|
| `from_date`, `to_date` | Required, UTC inclusive |
| `user_id` | Optional drill-down focus (must be in caller subtree) |
| `depth` | `0` = direct children (default), `1`/`2` = skip manager layers (Admin only for depth 2) |
| `limit`, `offset` | Page current-level `members` |

**Response highlights for UI:**

- `summary` — `total_users`, `active_users`, `users_completed_module`, `users_chatbot_engaged`, …
- `members[]` — per row: `user_id`, `name`, `role`, `can_drill_down`, `is_active`, `is_chatbot_engaged`, `has_completed_module_in_range`, `assigned_modules[]`, `chatbot_modules[]`, `chatbot_query_count`, `refreshers_generated` / `refreshers_completed`, `last_active_at`, `last_chat_at`
- Default focus: Admin → AMs; AM → POs; PO → SKs

**`GET /dashboard/team-activity/users/{user_id}/questions`**

- Paginated deduped chatbot questions for one visible member (`digital_help_used`).
- Useful for a **detail drawer**, not for the new “top modules” widgets.

### 2. Published module completions (Training Modules table)

**`GET /dashboard/published-module-completions`**

| Query param | Notes |
|-------------|-------|
| `from_date`, `to_date` | Modules with `published_at` in window |
| `limit`, `offset` | Default 20, max 200 |

**Each row:** `module_id`, `module_family_id`, `title`, `published_at`, `completed_sk_count`, `total_descendant_sk_count`.

**Auth:** Platform Admin and Area Manager only — **PO device principals get 403**. Program Head web users (admin plane) are fine.

**UI binding:** Show `completed_sk_count / total_descendant_sk_count` as the “SKs Completed” column.

### 3. Module demand — searched vs suggested (replaces Top Chatbot Queries)

**`GET /dashboard/digital-help-modules`**

| Query param | Notes |
|-------------|-------|
| `from_date`, `to_date` | Required |
| `limit`, `offset` | Default 20, max 100 |

**Each row:**

```json
{
  "module_id": "uuid",
  "module_family_id": "uuid | null",
  "title": { "en": "...", "bn": "..." },
  "digital_help_count": 42,
  "module_requested_count": 7
}
```

**Telemetry mapping:**

| Widget | Event | Field |
|--------|-------|-------|
| **Top searched modules** | `digital_help_used` (chatbot/RAG on a known module) | `digital_help_count` |
| **Top suggested modules** | `module_requested` (CHW requested training access) | `module_requested_count` |

**Implementation note:** The API ranks by **combined** volume server-side. For the two widgets, **fetch once** (shared date range + hierarchy scope) and sort client-side:

- Top searched → `modules.sort((a,b) => b.digital_help_count - a.digital_help_count)`
- Top suggested → `modules.sort((a,b) => b.module_requested_count - a.module_requested_count)`

**Limitation:** Events without a concrete `module_id` (free-text only) are **excluded** from this list. Those drive **`GET /dashboard/module-creation-suggestions`** instead (LLM “create this module next” topics — different UX).

**Detail routes (optional drill-down):**

- `GET /dashboard/digital-help-modules/{module_id}/questions`
- `GET /dashboard/digital-help-modules/{module_id}/requests`

### 4. PDF / knowledge document analytics (new widget)

**`GET /dashboard/document-usage`**

| Query param | Notes |
|-------------|-------|
| `from`, `to` | Required (note: **`from`/`to`**, not `from_date`) |
| `upazila_id`, `district` | Optional geography filters |
| `user_id` | Optional hierarchy focus (same subtree rules as team-activity) |
| `document_id` | Optional single-document filter |
| `top_limit` | Default 10 — **`top_documents`** leaderboard |
| `documents_limit`, `documents_offset` | Per-document table |
| `events_limit`, `events_offset` | Event drill-down |

**Single response includes:**

| Block | Use in UI |
|-------|-----------|
| `total_views`, `unique_documents`, `unique_users` | KPI cards |
| `top_documents[]` — `document_id`, `document_title`, `view_count` | “Top viewed PDFs” chart/list |
| `documents[]` — `total_views`, `unique_users`, `last_viewed_at`, `last_viewed_by_user_name` | Full table |
| `events[]` — per-view audit (`user_id`, `user_name`, `viewed_at`, geography) | Detail / export |

**Telemetry:** `event_type=document_viewed`, `payload_json.source_document_id` (see `docs/TELEMETRY_CONTRACT.md` in `coaching-platform`).

**Critical dependency:** Backend and ClickHouse MV (`document_view_daily`) are ready, but **`document_viewed` is not emitted yet** from:

- `micro-coaching-android-sdk` (no matches in repo)
- `micro-learning-analytics-dashboard` Knowledge Library (no telemetry calls)

Until clients POST views via `POST /telemetry/events`, the PDF widget will show zeros. **Ship telemetry in parallel with the dashboard widget.**

### 5. Module creation suggestions (optional — not the same as “top suggested modules”)

**`GET /dashboard/module-creation-suggestions`** (+ `/{suggestion_id}` detail)

- Daily LLM suggestions for **new** modules inferred from unattributed chatbot demand and free-text requests.
- Populated by Celery beat (`platform.refresh_module_creation_suggestions`).
- Use for a **“Content gaps / recommended new modules”** panel — **not** for ranking existing published modules.

---

## Widget change: Top Chatbot Queries → Top searched + Top suggested

### Product intent

| Old widget | New widgets |
|------------|-------------|
| Top Chatbot Queries (question text, SK/PO toggle) | **Top searched modules** — which modules field staff look up via AI help |
| | **Top suggested modules** — which modules field staff **request** for training |

### Backend verdict: **ready without new endpoints**

One call to `GET /dashboard/digital-help-modules` feeds both widgets. No backend change required unless you want:

- Separate dedicated routes (unnecessary duplication), or
- Server-side `sort_by=digital_help|module_requested` query param (nice-to-have, not blocking).

### Clarification for product / UI

Confirm with design that **“Top suggested”** means **`module_requested`** (existing module access requests), **not** LLM **`module-creation-suggestions`**. If they meant content-gap suggestions, use the module-creation-suggestions API instead (different data shape: `proposed_topic`, `matched_draft`, evidence lists).

There is **no** separate “module search box” telemetry event today — in-app module lookup via chatbot maps to **`digital_help_used`**.

---

## PDF analytics widget — recommended UI shape

Suggested layout aligned with existing API:

1. **KPI row** — `total_views`, `unique_documents`, `unique_users` (respect global date + geography filters).
2. **Top documents chart** — `top_documents` (horizontal bar; `top_limit=10`).
3. **Documents table** — paginate `documents[]`; columns: title, views, unique users, last viewed, last viewer.
4. **Optional drawer** — filter `events` by `document_id`; show recent views from `events[]`.

**Filters to wire:** same date range as rest of dashboard; optional `district` / `upazila_id` if geography chips are added later; pass `user_id` when drilling down from team-activity focus.

**Engagement metrics already available:** `unique_users` per document and per-view event rows — sufficient for “how frequently viewed” and “who is engaging” without new backend work.

---

## Gaps and follow-ups

### Backend gaps (non-blocking for v1)

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No `sort` / `status` query params on `team-activity` | UI sort + “At risk” filter | Derive on client from `is_active`, `has_completed_module_in_range`, `is_chatbot_engaged`, `last_active_at` |
| No explicit `at_risk` boolean | Status filter chips | Define product rule (e.g. inactive + incomplete modules) in frontend |
| `digital-help-modules` combined server rank | Two widgets need different sorts | Client-side re-sort (see above) |
| Inconsistent date param names | `from_date`/`to_date` vs `from`/`to` on document-usage | Normalize in RTK Query layer |
| PO cannot call `published-module-completions` | PO web users won’t see Training Modules table | Expected — hide widget for PO or show team-activity module completion only |
| README “Not Yet Fully Implemented” mentions richer dashboard materialization | Long-term perf | OK for v1 — MVs exist for team activity and document views |

### Client / telemetry gaps (blocking real PDF data)

| Item | Owner | Status |
|------|-------|--------|
| Emit `document_viewed` on Knowledge Library PDF open | `micro-learning-analytics-dashboard` | ❌ Not implemented |
| Emit `document_viewed` on mobile knowledge views | `micro-coaching-android-sdk` | ❌ Not implemented |
| Ensure `digital_help_used` / `module_requested` include `module_id` | SDK | Required for module widgets to populate |

### Frontend repo gaps

| Item | Status |
|------|--------|
| Admin dashboard route / page | ❌ No route in `AppRoutes.tsx` |
| Sidebar nav entry | ❌ Not in `Sidebar.tsx` |
| RTK Query API module for `/dashboard/*` | ❌ Not present |
| `shouldUseRealFetchForRequest` includes `dashboard/` | ❌ Only `admin/` bypasses mock — add `dashboard/` before integration |
| Mock handlers for dashboard | ❌ None in `mockBaseQuery.ts` (add fixtures for local dev) |

---

## Auth and integration notes

- Dashboard routes use the **shared** SPICE plane — callable from admin web (`client: web`) with a valid admin JWT and from organizer PO mobile (`client: mob`).
- Frontend already bootstraps SPICE session cookies (`docs/deployment-and-integration-strategy.md`). Point `VITE_API_BASE_URL` at platform-api and call `/dashboard/*` with credentials.
- Hierarchy scoping is **server-enforced** — AM/PO see descendant SK demand only; Program Head / auth-off sees tenant-wide data.
- Set `VITE_USE_MOCK_API=false` (or extend routing) when connecting to real `ingestion-merge` backend.

---

## Suggested frontend implementation order

### Phase 1 — Shell + filters (no new BE)

1. Add `/admin-dashboard` (or `/analytics`) route and nav item.
2. Shared filter context: date range → `from`/`to` on all queries.
3. RTK Query slice: `dashboardApi` with typed responses mirroring `mc_contracts.dashboard` (copy types manually or generate from OpenAPI if available).

### Phase 2 — Core tables (BE ready)

4. **Team hierarchy** — `team-activity` with `user_id` + `depth` drill-down; client sort/filter.
5. **Training modules** — `published-module-completions` (Admin/AM roles only).
6. **Top searched / Top suggested** — single `digital-help-modules` fetch, two sorted lists.

### Phase 3 — PDF analytics + telemetry

7. **PDF widget** — `document-usage` integration.
8. **Parallel:** POST `document_viewed` from Knowledge Library when a PDF is opened (platform `POST /telemetry/events`).

### Phase 4 — Optional enhancements

9. Module creation suggestions panel for content strategists.
10. Module / member question drill-downs from row clicks.

---

## Quick API cheat sheet

```http
# Hierarchy (AM / PO / SK table)
GET /dashboard/team-activity?from_date=2026-08-01&to_date=2026-08-12&limit=50&offset=0
GET /dashboard/team-activity?from_date=...&to_date=...&user_id={amId}&depth=1

# Training modules launched + completions
GET /dashboard/published-module-completions?from_date=...&to_date=...&limit=20&offset=0

# Top searched + Top suggested (one fetch, two sorts)
GET /dashboard/digital-help-modules?from_date=...&to_date=...&limit=20&offset=0

# PDF / knowledge analytics
GET /dashboard/document-usage?from=2026-08-01&to=2026-08-12&top_limit=10&documents_limit=20&events_limit=50

# Content gap suggestions (optional)
GET /dashboard/module-creation-suggestions?from_date=...&to_date=...&limit=20
```

---

## Related documents

| Document | Location |
|----------|----------|
| Canonical endpoint contract | `coaching-platform/README.md` → Dashboard-facing |
| Telemetry event shapes | `coaching-platform/docs/TELEMETRY_CONTRACT.md` |
| Pydantic response models | `coaching-platform/packages/contracts/src/mc_contracts/dashboard.py` |
| Broader multi-role dashboard plan | `android-sdk-files-under-docs-folder/DASHBOARD_IMPLEMENTATION_PLAN.md` |
| Frontend deploy / SPICE auth | `micro-learning-analytics-dashboard/docs/deployment-and-integration-strategy.md` |

---

## Conclusion

**For the Netlify admin dashboard (with Top searched, Top suggested, and PDF analytics widgets), the `ingestion-merge` backend is sufficient to start frontend work.** Prioritize wiring existing `/dashboard/*` routes, implementing client-side hierarchy sorting/filtering, and shipping `document_viewed` telemetry so PDF analytics reflects real usage.

No mandatory backend feature branch is required before frontend kickoff unless product insists on server-side `sort_by` for module widgets or a formal `at_risk` field on team-activity members.
