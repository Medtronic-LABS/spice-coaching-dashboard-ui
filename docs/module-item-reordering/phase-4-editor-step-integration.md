# Phase 4 — Editor Step Integration

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phase 2](./phase-2-frontend-order-utilities.md) and [Phase 3](./phase-3-reorderable-list-component.md) complete  
**Blocks:** Phase 5

---

## Goal

Wire `ReorderableList` into the admin module review Lessons and Quiz steps so Program Managers can reorder cards and quiz questions in the editor UI with immediate Redux updates.

---

## Tasks

### 1. Lessons step — card sidebar reorder

**Modify:** `src/features/module-library/pages/admin-module-review/AdminModuleLessonsStep.tsx`

Changes:

1. Import `ReorderableList`, `reorderCards`, `moveCardUp`, `moveCardDown` from Phase 2 utils.
2. Replace the plain `cards.map(...)` sidebar buttons with `ReorderableList`.
3. Keep `selectedIndex` state (cards have no stable backend IDs).
4. On reorder:
   - Compute `newCards = reorderCards(cards, fromIndex, toIndex)`.
   - Dispatch `setCards(newCards)`.
   - Adjust `selectedIndex`:
     - If selected item moved: follow it to new index.
     - If another item moved past selection: increment/decrement index accordingly.
5. Pass `disabled={busy}` where `busy = isFetching || isSaving`.
6. Preserve existing card click-to-select, “Edited” badge, title/subtitle display.
7. Increment `editorRevision` when selected card changes index (so TipTap remounts if needed).

**Selection index adjustment helper** (inline or small util):

```typescript
function adjustSelectedIndexAfterReorder(
  selectedIndex: number,
  fromIndex: number,
  toIndex: number,
): number;
```

### 2. Quiz step — question list reorder

**Modify:** `src/features/module-library/pages/admin-module-review/AdminModuleQuizStep.tsx`

Changes:

1. Import `ReorderableList`, `reorderQuizItems` from Phase 2 utils.
2. Wrap the sorted question list in `ReorderableList` (each question `Card` is one sortable row).
3. On reorder:
   - `applyQuiz(reorderQuizItems(sortedQuiz, fromIndex, toIndex))`.
4. Keep existing Add Question, Remove, edit fields unchanged.
5. Pass `disabled={busy}` during save/fetch.

Display continues to use `sortQuizItems(working.quiz)` for consistent order.

### 3. Step component tests

**New files:**

- `src/features/module-library/pages/admin-module-review/AdminModuleLessonsStep.test.tsx`
- `src/features/module-library/pages/admin-module-review/AdminModuleQuizStep.test.tsx`

Test approach:

- Mock `useAdminModuleReviewEditor` with fixture module data (3 cards / 3 questions).
- Render with Redux provider + MemoryRouter.
- Click “Move down” on first card → assert Redux state or re-render shows new order.
- Click “Move down” on first question → assert `question_order` values updated.

Follow patterns from existing tests e.g. `ModuleLibraryPage.test.tsx`.

---

## UX requirements

| Requirement | Implementation |
|-------------|----------------|
| Immediate UI update | Dispatch `setCards` / `setQuiz` on reorder — no save required |
| Multiple reorders before save | All changes stay in Redux until Save |
| Move Up/Down fallback | Provided by `ReorderableList` controls on each row |
| Drag-and-drop | Drag handle on each sidebar card / question row |
| No content mutation | Reorder utils must not alter card bodies or question text |

---

## Files to modify

| Action | Path |
|--------|------|
| Modify | `src/features/module-library/pages/admin-module-review/AdminModuleLessonsStep.tsx` |
| Modify | `src/features/module-library/pages/admin-module-review/AdminModuleQuizStep.tsx` |
| New | `AdminModuleLessonsStep.test.tsx` |
| New | `AdminModuleQuizStep.test.tsx` |

**Do not modify** `persistAdminModuleDraft.ts` yet — that is Phase 5.

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/module-library/pages/admin-module-review/
npm run dev
```

Manual test:

1. Open `/module-library/review/{moduleId}/lessons`.
2. Drag card 3 to position 1 — sidebar updates immediately.
3. Use Move Up/Down — same behavior.
4. Edit a card body — content unchanged after reorder.
5. Open Quiz step — reorder questions similarly.
6. Navigate away without saving — unsaved dialog still works.

---

## Done checklist

- [ ] Card sidebar uses `ReorderableList` with working DnD and Move Up/Down
- [ ] Selected card index follows item after reorder
- [ ] Quiz question list reorderable
- [ ] Reorder disabled while saving/loading
- [ ] Step component tests pass
- [ ] Manual smoke test on dev server passes
- [ ] No regressions to Save button or Continue navigation (save still uses old persist until Phase 5)

---

## Next phase

[Phase 5 — Review, Persist & Verification](./phase-5-review-persist-and-verification.md)
