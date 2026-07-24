# Phase 3 — Reorderable List Component

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phase 2](./phase-2-frontend-order-utilities.md) complete  
**Blocks:** Phase 4

---

## Goal

Add a shared, accessible reorder UI component with drag-and-drop and Move Up / Move Down fallback. This phase delivers the component in isolation — not yet wired into editor steps.

---

## Tasks

### 1. Add dependencies

**Modify:** `package.json`

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Packages:

- `@dnd-kit/core` — drag context, sensors, collision detection
- `@dnd-kit/sortable` — sortable list primitives
- `@dnd-kit/utilities` — CSS transform helpers

### 2. Create ReorderableList component

**New file:** `src/features/modules/components/ReorderableList.tsx`

Suggested API:

```typescript
export interface ReorderableListProps<T> {
  items: T[];
  getItemId: (item: T, index: number) => string;
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (item: T, index: number, controls: ReorderableItemControls) => React.ReactNode;
  disabled?: boolean;
}

export interface ReorderableItemControls {
  dragHandleProps: React.HTMLAttributes<HTMLElement>;
  moveUp: () => void;
  moveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}
```

Requirements:

- **Drag handle** on each row (`cursor-grab`, `aria-label="Drag to reorder"`).
- **Move Up / Move Down** icon buttons as fallback (disabled at first/last).
- **Keyboard:** `@dnd-kit` keyboard sensor for accessibility.
- **Styling:** match existing spice tokens (`ring-spice-border`, `bg-spice-bg-tint`, etc.).
- **Disabled state:** when `disabled={true}` (e.g. while saving), disable drag and buttons.

Implementation notes:

- Use `SortableContext` + `useSortable` per row.
- On drag end, call `onReorder(activeIndex, overIndex)` only when indices differ.
- Export as named export only (project convention).

### 3. Component tests (optional in this phase, required by Phase 5)

**New file:** `src/features/modules/components/ReorderableList.test.tsx`

Minimal tests:

- Renders items in order
- Move Down button calls `onReorder(0, 1)`
- Move Up disabled on first item; Move Down disabled on last item
- Drag end triggers `onReorder` (can mock `@dnd-kit` sensors or test buttons only)

---

## Files to modify

| Action | Path |
|--------|------|
| Modify | `package.json` |
| New | `src/features/modules/components/ReorderableList.tsx` |
| Optional | `src/features/modules/components/ReorderableList.test.tsx` |

**Do not modify** `AdminModuleLessonsStep.tsx` or `AdminModuleQuizStep.tsx` in this phase.

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm install
npm run typecheck
npm run test -- src/features/modules/components/ReorderableList.test.tsx
```

Manual smoke (temporary dev page or Storybook if available): render a list of 3 strings, confirm drag and buttons reorder locally.

---

## Done checklist

- [ ] `@dnd-kit/*` dependencies installed and lockfile updated
- [ ] `ReorderableList` component implemented with drag handle + Move Up/Down
- [ ] Keyboard accessibility via dnd-kit keyboard sensor
- [ ] Disabled state respected
- [ ] Component tests pass (or deferred to Phase 5 with note)
- [ ] `npm run typecheck` passes

---

## Next phase

[Phase 4 — Editor Step Integration](./phase-4-editor-step-integration.md)
