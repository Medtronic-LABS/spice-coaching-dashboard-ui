# UI Polish Checklist

Track and complete these items one by one. Update status and notes as work progresses.

**Legend:** `- [ ]` Todo · `- [x]` Done · Status: `Todo` | `In Progress` | `Done` | `Blocked` | `Deferred`

**Progress:** 31 done · 2 deferred · 1 skipped follow-up · 0 remaining todo

_Last updated: 2026-08-26_

---

## Decisions (locked 2026-08-25; follow-ups locked 2026-08-26)

| Topic | Decision | Outcome |
|-------|----------|---------|
| Assign Modal width | Bump to `max-w-2xl` | Done |
| Reset / Cancel red styling | **Skip** — do not change Cancel/Reset colors | Deferred |
| Modals close UX | Top-right **X**; remove text **Close**; keep **Cancel** on confirms | Done |
| Confirmation dialogs scope | Entity-level only (not inline editor deletes) | Done |
| Document details navigation | Keep overview metrics; open details in a **modal** | Done (+ centering + stale-data loader) |
| Document drill-down table | User col `14rem`; Role abbreviate (SK/PO/AM); Geography flex remaining; Last Viewed label nowrap + multiline date; scroll inside modal | Done |
| Top KPI metrics | Positioning only: label + value on one bottom row (not a full visual redesign) | Done (positioning) |
| PDF/document widget KPI redesign | Same positioning as top KPIs via shared `StatCard` (label + value bottom row) | Done |
| Top viewed documents | Remove entire section | Done |
| Training Modules filter + sort | BE first (`module_id`, `sort_by`/`sort_dir`), then FE | Done |
| Milestone Select All | Select all **currently loaded** | Done |
| Widget header text | `DashboardWidgetShell` title + description only | Done |
| Module Library assignment | View button (Published/All only); chip modal; count badge; skeleton on open | Done |
| Status colors | `ModuleStatusBadge` / `StatusBadge` for module lifecycle | Done |
| SK chatbot “Chatbot Used” verify | Investigate later | Deferred |
| SK Drawer header | Back control inline with avatar + name (no “My SK” title row) | Done |
| Team View sort dropdown | Shared `Select` + `min-w-[16rem]` for option labels | Done |
| Dropdown arrows | All dropdowns including Combobox | Done |
| Delivery / PRs | All changes together; user owns PR split | — |
| Document detail Last Viewed KPI | Date only via `formatDisplayDate`; KPI only (not table column); value uses smaller type (`text-base`) + wrap so year is not clipped | Done |
| Input corner radius | Moderate `rounded-lg` (~8px) for filters, selects, search, date inputs, similar controls app-wide; keep pills for avatars/badges/status | Done |
| Modal centering | Always set `Modal` `contentClassName` (max-width on shell, not only inner Card) | Done |
| Modal close control | Top-right `CloseIcon`; no text “Close”; **except** ingest duplicate/re-ingest (`showCloseButton={false}`) | Done |
| Shared modal actions | Shared `ModalActionBar`; Cancel = Assign style (`variant="secondary"`) | Done |
| Dashboard section labels | Remove “Module search demand” + “Training Insights” headings; keep widgets | Done |
| Knowledge delete copy | Title “Delete knowledge document”; button “Delete”; **body kept original** retire/retain wording (soft rewrite reverted) | Done |
| Assign modal dual scrollbars | Outer body + user-list nested scroll — leave as-is | Skipped |

### Repos

- FE: `micro-learning-analytics-dashboard`
- BE: `coaching-platform` → `GET /dashboard/published-module-completions`

---

## Assign Modal

- [x] **Width** — Increase modal width.  
  - Status: `Done`  
  - Notes: `AssignmentDialog` uses Modal `contentClassName="max-w-2xl"`.

- [x] **Dual scrollbars** — Nested body + user-list scroll.  
  - Status: `Skipped`  
  - Notes: Considered collapsing to one scrollbar; left as-is per product decision.

---

## Dashboard

- [x] **PDF/document views — Details navigation** — Keep metrics visible; open details in a modal.  
  - Status: `Done`  
  - Notes: `DocumentUsageSection` modal with `contentClassName="max-w-4xl"` (centered). Switching rows uses `currentData` + skeleton so previous document does not flash. Body scroll contained via `max-h` + `overflow-y-auto` on modal content.

- [x] **PDF/document views — Drill-down table** — Column widths, role labels, Last Viewed KPI.  
  - Status: `Done`  
  - Notes: User `14rem` (wrap); Role `formatDocumentUsageRoleAbbreviation` (SK/PO/AM); Geography takes remaining space; Opened At unchanged; table `min-w` on table element for horizontal scroll. Last Viewed table column still full datetime.

- [x] **PDF/document views — Last Viewed KPI date-only** — Detail modal KPI shows date only (`Aug 25, 2026`); not the table column.  
  - Status: `Done`  
  - Notes: `DocumentUsageDetailView` uses `formatDisplayDate`. Value sized down (`valueClassName="text-base font-bold leading-snug"` + `allowValueWrap`) so the full date fits without clipping against `StatCard`’s default `text-[30px]` + `overflow-hidden`.

- [x] **KPI top metrics — Positioning** — Numbers inline with KPI label on the bottom row.  
  - Status: `Done`  
  - Notes: Shared `StatCard`: label left, value right (`items-baseline justify-between`). Applies to dashboard KPIs and other `StatCard` usages (e.g. document usage). Full visual redesign not in scope. Optional `allowValueWrap` for multiline values.

- [x] **PDF/document views — Top viewed documents** — Remove section.  
  - Status: `Done`  
  - Notes: Removed from overview. Orphan `DocumentUsageTopAllView` (+ test) and unused `chartLabel` / `topAll*` locale keys deleted.

- [x] **PDF/document views — KPIs** — Align widget KPI card layout with other metrics.  
  - Status: `Done`  
  - Notes: Document usage KPIs use shared `StatCard` (label left, value right on bottom row). Detail modal KPI row uses `items-stretch` so cards align.

- [x] **Refresh Button** — Remove per-widget refresh.  
  - Status: `Done`  
  - Notes: Removed from `DashboardWidgetShell`; `DashboardWidgetRefreshButton` deleted.

- [ ] **SK chatbot usage** — Verify “Chatbot Used” for older vs recent activity.  
  - Status: `Deferred`  
  - Notes: Investigation not started.

- [x] **SK Drawer — My SK** — Remove top “My SK”; tighten header.  
  - Status: `Done`  
  - Notes: Back arrow inline with avatar + name (no separate title row). Unused locale key `adminDashboard.skDrawer.title` removed.

- [x] **SK Drawer — Top queries** — Remove sequence numbers.  
  - Status: `Done`  
  - Notes: Unnumbered `ul`.

- [x] **Team View — Sort dropdown** — Consistent dropdown UI + enough width for options.  
  - Status: `Done`  
  - Notes: Shared `Select` (`rounded-md` + `select-arrow`); `className="w-auto min-w-[16rem]"`.

- [x] **Training Modules — Multi-select filter** — Filter by modules.  
  - Status: `Done`  
  - Notes: BE repeated `module_id`; FE `TrainingModulesModuleFilter`.

- [x] **Training Modules — Launched Date sorting** — Sort by launched date.  
  - Status: `Done`  
  - Notes: BE `sort_by=published_at` + `sort_dir`; FE column toggle.

- [x] **Widget Header Text** — Larger title/description.  
  - Status: `Done`  
  - Notes: `DashboardWidgetShell` title `text-base`, description `text-sm`.

- [x] **Section labels — Remove mid-page headings** — Remove “Module search demand” and “Training Insights”.  
  - Status: `Done`  
  - Notes: Removed the two `<h2>` wrappers on `AdminDashboardPage`; widgets unchanged.

---

## Global UI

- [x] **Confirmation dialogs** — Entity-level Deactivate/Delete.  
  - Status: `Done`  
  - Notes: Shared `ConfirmDialog` — knowledge retire, milestone delete, module deactivate, Discard New.

- [x] **Dropdowns — Arrow** — Down arrow on all dropdowns.  
  - Status: `Done`  
  - Notes: Combobox chevron; Select `select-arrow` + `rounded-md`.

- [x] **Info icon** — Consistent usage.  
  - Status: `Done`  
  - Notes: Shared `Tooltip` / `InfoIcon`.

- [x] **Modals — Close (X)** — Top-right X; no text Close.  
  - Status: `Done`  
  - Notes: `Modal` X when `onClose` set; use `contentClassName` for max-width so shell + X stay centered. Cancel kept on confirms.

- [x] **Modals — Center all** — Fix left-aligned modals (max-width on `contentClassName`).  
  - Status: `Done`  
  - Notes: Audited `Modal` call sites; moved `max-w-*` from Card to `contentClassName`.

- [x] **Modals — Close icon consistency** — Icon X everywhere; no text “Close”; exception: ingest-document flows.  
  - Status: `Done`  
  - Notes: Replaced text Close in `MobilePreviewFrame` / `ModuleSourceDocumentPanel`; removed redundant preview panel Close (Modal X). `showCloseButton={false}` for duplicate/re-ingest dialogs.

- [x] **Modals — Shared action bar** — One footer for Cancel + primary; Cancel matches Assign (`secondary`).  
  - Status: `Done`  
  - Notes: `ModalActionBar` wired into `ConfirmDialog`, Assign, Knowledge edit, Badge form, Video metadata edit, version conflict; Reingest uses `ConfirmDialog`.

- [x] **Inputs — Corner radius** — Less rounded; match Filters sample (`rounded-lg`).  
  - Status: `Done`  
  - Notes: Dashboard filter bar, Team hierarchy sort, Assign geo select, Combobox, Tabs pill variant, Badge multi-select lists, date inputs. Avatars/badges/status pills unchanged.

- [x] **Redirection buttons** — Arrow on top nav/redirect buttons.  
  - Status: `Done`  
  - Notes: Ingest History/Document, Video Upload, Knowledge Library → Module Library.

- [ ] **Reset / Cancel buttons** — Uniform red for Reset/Cancel.  
  - Status: `Deferred`  
  - Notes: Explicitly skipped. (Cancel border consistency handled via shared `ModalActionBar` / `secondary`.)

- [x] **Status colors** — Consistent module status colors.  
  - Status: `Done`  
  - Notes: `ModuleStatusBadge` / `StatusBadge` (incl. published success surfaces).

- [x] **Confirm copy — Delete wording** — Prefer “Delete …” + button “Delete” (not “Remove” / “Confirm Remove”).  
  - Status: `Done`  
  - Notes: Knowledge title/button = “Delete knowledge document” / “Delete”; **body restored** to original retire/retain copy. Milestone “Delete milestone” + “Deleting…”; deactivate/discard titles sentence-cased. No remaining “Confirm Remove”.

---

## Ingestion History

- [x] **Ingested document button** — Remove top-right button.  
  - Status: `Done`  
  - Notes: “Ingest Document” removed; Module Library kept with arrow.

---

## Milestone Management

- [x] **Select All** — Select all published modules (loaded).  
  - Status: `Done`  
  - Notes: `BadgeModuleMultiSelect` — Select all loaded / Deselect all.

---

## Module Library

- [x] **Assignment visibility** — Show who a module is assigned to.  
  - Status: `Done`  
  - Notes: Assigned column on Published/All only (hidden on Drafts/Deactivated). View button → `ModuleAssignedUsersCell` modal (`max-w-md`) with name + nested role chips (SK/PO); centered dash when empty/non-assignable. Count badge beside “Assigned users” header after load. Lazy fetch on View; skeleton chips until API returns.

---

## Tables

- [x] **Pagination buttons** — Left/right arrows.  
  - Status: `Done`  
  - Notes: `TablePagination` ChevronIcon + aria-labels.

---

## Follow-ups done after initial pass

- [x] Document details modal centered (`contentClassName="max-w-4xl"`).
- [x] Document details: no flicker of previous row — loader via `currentData` / selection match.
- [x] `StatCard` label/value bottom-row positioning for KPI metric cards.
- [x] Dashboard widgets: arg-driven refreshes show skeleton via `currentData` in `resolveDashboardQueryUiState` (load-more still inline).
- [x] Document drill-down: User `14rem`, Role abbrev (SK/PO/AM), Geography flex, modal-contained vertical scroll, table `min-w` for horizontal scroll.
- [x] Document drill-down Last Viewed KPI: date-only via `formatDisplayDate`; smaller value type so year is not clipped.
- [x] Knowledge retire body: soft rewrite reverted; keep original retire/retain wording.
- [x] Module Assigned modal: count badge beside header; skeleton on View click (lazy fetch).
- [x] SK Drawer header: back control inline with avatar + name.
- [x] Team View sort Select: `min-w-[16rem]`.
- [x] Shared `ModalActionBar` + Cancel `secondary` consistency.
- [x] Modal `contentClassName` audit (left-align fix).
- [x] Input radius → `rounded-lg` for filter/select/search-like controls.
- [x] Dashboard mid-page section headings removed.
- [~] Assign modal dual scrollbars: reviewed; left nested scroll as-is.

---

## Still deferred

1. Reset / Cancel red button styling  
2. SK “Chatbot Used” metric verification  

---

## Optional cleanup

- [x] Delete orphaned `DocumentUsageTopAllView` (+ test)
- [x] Remove unused locale keys: `chartLabel`, `topAll*`, `adminDashboard.skDrawer.title`
- User owns PR splitting across FE / coaching-platform BE
