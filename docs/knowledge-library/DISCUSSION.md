# Knowledge Library — Ticket Discussion

**Status:** Approved — Phase 0–1 implemented; Phases 2–5 next  
**Last updated:** 2026-07-30

---

## Locked decisions (summary)

| Topic | Decision |
|-------|----------|
| Scope | Full ticket in one FE PR; PDF only; no Android |
| Modes | Upload Original **or** Splits (mutually exclusive) |
| Storage | One PDF + page-range metadata per asset |
| Thumbnails | Backend auto from start page; admin can replace |
| IA | **Option A** — one Learning item **Upload Knowledge** (upload + library on same surface) |
| Progress | Reuse existing ingest progress UI patterns |
| Soft delete | Module Library–style deactivate |
| Assignment | Reuse `ModuleAssignmentDialog` |
| Filters | Search + Sort outside drawer; drawer: Uploaded By (single-select from uploaders API), Assigned Y/N, Uploaded / Last Updated date ranges; Apply to query |
| Auth | PM-gated route (like Ingest) |
| FE data | `mockBaseQuery` mocks for required flows until BE ready |
| i18n | Not a priority (follow existing PM English hard-code style) |
| Review | Your review is enough |
| Code quality | Reuse first; extract small components when justified; no overkill |

Full implementation plan: **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)**  
Backend handoff: **[BACKEND_HANDOFF.md](./BACKEND_HANDOFF.md)** (also §7 of the plan).

### Interview batches
- Batch 1–4: answered and logged in plan “Key Design Decisions”.
