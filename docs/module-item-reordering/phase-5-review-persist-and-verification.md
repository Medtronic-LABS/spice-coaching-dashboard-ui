# Phase 5 — Review, Persist & Verification

**Repo:** `micro-learning-analytics-dashboard` (+ confirm Phase 1 backend tests)  
**Prerequisite:** [Phase 4](./phase-4-editor-step-integration.md) complete  
**Blocks:** None — feature complete after this phase

---

## Goal

Ensure reordered content is persisted correctly on Save/Publish, displayed correctly on the Review step, and satisfies all acceptance criteria. Wire `prepareModuleJsonForSave` into the persist path and run full verification.

---

## Tasks

### 1. Persist layer — normalize order before PUT

**Modify:** `src/features/modules/utils/persistAdminModuleDraft.ts`

Before building the request body:

```typescript
import { prepareModuleJsonForSave } from './prepareModuleJsonForSave';

const { cards, quiz } = prepareModuleJsonForSave(working.cards, working.quiz);

body: {
  ...
  module_json: { cards, quiz },
},
```

This guarantees every save sends cards in editor order and quiz with contiguous `question_order` even if UI missed a renumber step.

### 2. Review / publish display

**Modify:** `src/features/modules/utils/moduleReviewPublishMappers.ts`

- Import `sortQuizItems`.
- In `mapAdminQuizToRows`, sort quiz before mapping.
- Cards: already in array order from editor — no sort needed.

**Verify:** `AdminModulePublishStep.tsx` uses mappers (or passes sorted data) so Review step numbered list matches editor order.

### 3. Error handling verification

Confirm existing pattern still works after reorder + save:

- Save failure shows red `actionError` banner (Lessons, Quiz, Publish steps).
- Uses `formatRtkQueryError` — no silent revert of local reorder state on failure.
- User can retry save after error.

No new toast system required (match existing patterns).

### 4. Run all tests

**Frontend:**

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test
npm run typecheck
npm run lint
```

**Backend:**

```bash
cd "/home/beehyv/Projects/Medtronics/android work/coaching-platform"
pytest tests/api/test_admin_modules.py -v
```

### 5. Manual end-to-end verification

Requires running dashboard against real admin API (`VITE_API_BASE_URL` pointing at coaching-platform).

| Step | Action | Expected |
|------|--------|----------|
| 1 | Load module with 3+ cards | Cards appear in API order |
| 2 | Reorder cards via DnD | Sidebar updates immediately |
| 3 | Save on Lessons step | Success; no error banner |
| 4 | Reload module | Card order matches saved order |
| 5 | Reorder quiz questions | Questions renumber in UI |
| 6 | Save on Quiz step | Success |
| 7 | Reload module | Quiz order matches |
| 8 | Review & Publish step | Numbered lists match editor order |
| 9 | Publish module | Success modal |
| 10 | (Optional) Hit sync API | Cards/quiz order matches in sync payload |

### 6. Simulate save failure (optional)

- Temporarily point API at invalid URL or use network offline.
- Reorder items, click Save.
- Confirm error banner appears; local reorder state preserved for retry.

---

## Acceptance criteria checklist

| # | Criterion | Verified by |
|---|-----------|-------------|
| 1 | Reorder cards and quizzes within module | Phase 4 UI + manual test |
| 2 | DnD + Move Up/Down fallback | `ReorderableList` + manual test |
| 3 | Immediate UI update | Redux dispatch without save |
| 4 | Multiple reorders before save | Manual test |
| 5 | Save as Draft | PUT with ordered payload; reload confirms |
| 6 | Publish | Clinically-reviewed flow; sync order (Phase 1 test) |
| 7 | CHW sees configured order | Phase 1 sync test + SDK uses array order (no SDK change) |
| 8 | Content/progress unchanged | Reorder only changes position; IDs/bodies unchanged |
| 9 | Order persists across sessions | Reload after save |
| 10 | Error on failed persist | Error banner on failed save |

---

## Files to modify

| Action | Path |
|--------|------|
| Modify | `src/features/modules/utils/persistAdminModuleDraft.ts` |
| Modify | `src/features/modules/utils/moduleReviewPublishMappers.ts` |
| Verify | `src/features/modules/pages/admin-module-review/AdminModulePublishStep.tsx` |

---

## Done checklist

- [ ] `prepareModuleJsonForSave` wired into `persistAdminModuleDraft`
- [ ] Review/publish mappers show quiz in sorted order
- [ ] All frontend tests pass (`npm run test`)
- [ ] All backend Phase 1 tests pass
- [ ] Manual E2E verification table completed
- [ ] Acceptance criteria 1–10 signed off
- [ ] PR ready with phase commits or single squash (team preference)

---

## Feature complete

After this phase, the user story is delivered. No Android SDK or backend production code changes are required beyond Phase 1 tests.

For future work (out of scope):

- Legacy `/courses/new/*` wizard parity
- Unified interleaved card+quiz ordering
- Dedicated `PATCH /admin/modules/{id}/reorder` endpoint
