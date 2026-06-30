# Phase 2 — Frontend Order Utilities

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** Phase 1 tests pass (or explicitly waived)  
**Blocks:** Phase 3, 4, 5

---

## Goal

Add pure TypeScript utilities and save/load normalization for card and quiz ordering. No UI changes in this phase — only logic and unit tests.

---

## Tasks

### 1. Card reorder utilities

**New file:** `src/features/module-library/utils/adminModuleCardUtils.ts`

Export:

```typescript
export function reorderCards<T>(cards: T[], fromIndex: number, toIndex: number): T[];
export function moveCardUp<T>(cards: T[], index: number): T[];
export function moveCardDown<T>(cards: T[], index: number): T[];
```

Rules:

- Use array splice — **do not** read or write `card_order`.
- `moveCardUp` / `moveCardDown` no-op at bounds (return same array reference or copy unchanged).
- `reorderCards` validates indices; throw or no-op on invalid input (match project conventions).

### 2. Extend quiz reorder utilities

**Modify:** `src/features/module-library/utils/adminModuleQuizUtils.ts`

Add:

```typescript
export function reorderQuizItems(quiz: AdminModuleQuizItem[], fromIndex: number, toIndex: number): AdminModuleQuizItem[];
export function moveQuizUp(quiz: AdminModuleQuizItem[], index: number): AdminModuleQuizItem[];
export function moveQuizDown(quiz: AdminModuleQuizItem[], index: number): AdminModuleQuizItem[];
export function renumberQuestionOrders(quiz: AdminModuleQuizItem[]): AdminModuleQuizItem[];
```

Update `removeQuizItem()` to call `renumberQuestionOrders()` so deleted questions leave no gaps in `question_order`.

All reorder helpers should operate on **sorted** quiz lists (use `sortQuizItems` internally or document caller must sort first).

### 3. Save payload preparation

**New file:** `src/features/module-library/utils/prepareModuleJsonForSave.ts`

```typescript
export function prepareModuleJsonForSave(
  cards: AdminModuleCard[],
  quiz: AdminModuleQuizItem[],
): { cards: AdminModuleCard[]; quiz: AdminModuleQuizItem[] };
```

Behavior:

- **Cards:** return in editor array order unchanged (no `card_order` injection).
- **Quiz:** return `renumberQuestionOrders(sortQuizItems(quiz))`.

### 4. API normalization on load

**Modify:** `src/features/module-library/api/adminModulesApi.ts` — `normalizeModuleDetail()`

- Keep cards in API array order (no sort by `card_order`).
- Sort quiz with `sortQuizItems()` before storing in normalized response.

### 5. Redux slice typing fix

**Modify:** `src/features/module-library/store/adminModuleReviewSlice.ts`

- Change `setCards` payload from `unknown[]` to `AdminModuleCard[]`.

### 6. Unit tests

**New files:**

- `src/features/module-library/utils/adminModuleCardUtils.test.ts`
- `src/features/module-library/utils/prepareModuleJsonForSave.test.ts`

**Extend:**

- `src/features/module-library/utils/adminModuleQuizUtils.test.ts` (create if missing)

Test cases:

| Utility | Cases |
|---------|-------|
| `reorderCards` | move middle item; first→last; invalid indices |
| `moveCardUp/Down` | at bounds; normal move |
| `reorderQuizItems` | renumbers `question_order` to 1..n |
| `removeQuizItem` | remaining orders contiguous |
| `prepareModuleJsonForSave` | cards order preserved; quiz orders 1..n |

---

## Files to modify

| Action | Path |
|--------|------|
| New | `src/features/module-library/utils/adminModuleCardUtils.ts` |
| New | `src/features/module-library/utils/prepareModuleJsonForSave.ts` |
| Extend | `src/features/module-library/utils/adminModuleQuizUtils.ts` |
| Modify | `src/features/module-library/api/adminModulesApi.ts` |
| Modify | `src/features/module-library/store/adminModuleReviewSlice.ts` |
| New/extend tests | `*.test.ts` files above |

**Do not modify** editor step components or `package.json` in this phase.

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/module-library/utils/adminModuleCardUtils.test.ts
npm run test -- src/features/module-library/utils/adminModuleQuizUtils.test.ts
npm run test -- src/features/module-library/utils/prepareModuleJsonForSave.test.ts
npm run typecheck
```

---

## Done checklist

- [ ] Card utils implemented and tested
- [ ] Quiz reorder + renumber on delete implemented and tested
- [ ] `prepareModuleJsonForSave` implemented and tested
- [ ] `normalizeModuleDetail` sorts quiz on load; cards stay in array order
- [ ] `setCards` typed as `AdminModuleCard[]`
- [ ] All new and existing tests pass
- [ ] `npm run typecheck` passes

---

## Next phase

[Phase 3 — Reorderable List Component](./phase-3-reorderable-list-component.md)
