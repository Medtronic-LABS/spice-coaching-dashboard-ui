# Phase 4 — Preview Context and State

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phases 1–3](./phase-1-snapshot-utilities-and-types.md) complete  
**Blocks:** Phases 5, 6

---

## Goal

Introduce `ModulePreviewContext` to own `previewSnapshot`, navigation position, sync error state, and Sync Preview action. Connect read-only to Redux `baseline` / `working` without coupling editor components to preview re-renders.

---

## Tasks

### 1. Preview context

**New file:** `src/features/module-library/context/ModulePreviewContext.tsx`

```typescript
export interface ModulePreviewContextValue {
  isOpen: boolean;
  snapshot: ModulePreviewSnapshot | null;
  position: ModulePreviewPosition;
  syncError: string | null;
  isSyncing: boolean;
  isStale: boolean; // true when working differs from last synced snapshot
  openPreview: (context?: Partial<ModulePreviewPosition>) => void;
  closePreview: () => void;
  syncPreview: () => void;
  setPosition: (position: ModulePreviewPosition) => void;
  registerEditorContext: (context: Partial<ModulePreviewPosition>) => void;
}
```

State held in provider (React `useState` + `useCallback`):

| State | Initial |
|-------|---------|
| `snapshot` | `null` until seeded |
| `position` | `{ phase: 'card', index: 0 }` |
| `isOpen` | `false` |
| `syncError` | `null` |
| `isSyncing` | `false` |
| `editorContext` | `{ phase: 'card', index: 0 }` (updated by steps) |

### 2. Provider wiring

**Export:** `ModulePreviewProvider` + `useModulePreview` hook

**New file:** `src/features/module-library/hooks/useModulePreview.ts`

Thin re-export of context hook with runtime guard:

```typescript
export function useModulePreview(): ModulePreviewContextValue {
  const ctx = useContext(ModulePreviewContext);
  if (!ctx) throw new Error('useModulePreview must be used within ModulePreviewProvider');
  return ctx;
}
```

Provider reads Redux via selectors (read-only):

```typescript
const working = useAppSelector(selectAdminModuleWorking);
const baseline = useAppSelector(selectAdminModuleBaseline);
const isDirty = useAppSelector(selectAdminModuleReviewIsDirty);
```

**Do not dispatch** from preview context except none — zero Redux writes.

### 3. Seed snapshot on module hydrate

When `baseline` becomes available for the current `moduleId`:

1. Run `generateModulePreviewSnapshot(baseline)` once
2. Store in `snapshot`
3. Do **not** re-seed on every `working` change

Use a ref to track `seededModuleId` to avoid re-seeding on dirty refetches:

```typescript
const seededRef = useRef<string | null>(null);
useEffect(() => {
  if (!baseline || !moduleId) return;
  if (seededRef.current === moduleId) return;
  seededRef.current = moduleId;
  setSnapshot(generateModulePreviewSnapshot(baseline));
}, [baseline, moduleId]);
```

On `moduleId` change: reset `seededRef`, snapshot, position, errors.

### 4. Sync Preview implementation

```typescript
const syncPreview = useCallback(() => {
  if (!working) {
    setSyncError('Module not loaded.');
    return;
  }
  setIsSyncing(true);
  setSyncError(null);
  try {
    const next = generateModulePreviewSnapshot(working);
    setSnapshot(next);
    setPosition((prev) => clampPosition(prev, next));
    setSyncError(null);
  } catch (err) {
    setSyncError(formatSyncError(err)); // human-readable, no snapshot mutation
  } finally {
    setIsSyncing(false);
  }
}, [working]);
```

Rules:

- On failure: **previous snapshot unchanged**
- On success: update snapshot + clamp position
- Never touches Redux `working`

### 5. Open / close preview

```typescript
const openPreview = useCallback((context?: Partial<ModulePreviewPosition>) => {
  if (!snapshot) {
    // If baseline not yet seeded, try sync from working or baseline
    const source = working ?? baseline;
    if (source) setSnapshot(generateModulePreviewSnapshot(source));
  }
  const start = getInitialPosition(snapshot ?? emptySnapshot, context ?? editorContext);
  setPosition(start);
  setIsOpen(true);
}, [snapshot, working, baseline, editorContext]);

const closePreview = useCallback(() => {
  setIsOpen(false);
  // Clear sync error; keep snapshot for next open
}, []);
```

### 6. Stale indicator

`isStale = isDirty` (or compare `editableSnapshot(working)` vs snapshot fingerprint).

Used in Phase 5 UI: show subtle "Edits not synced" badge when `isStale && isOpen`.

### 7. Editor context registration

Steps call `registerEditorContext({ phase: 'card', index: selectedIndex })` so `openPreview()` without args jumps to the item being edited (wired fully in Phase 6).

```typescript
const registerEditorContext = useCallback((context: Partial<ModulePreviewPosition>) => {
  setEditorContext((prev) => ({ ...prev, ...context }));
}, []);
```

### 8. Module preview panel shell

**New file:** `src/features/module-library/components/module-preview/ModulePreviewPanel.tsx`

Consumes `useModulePreview()`:

- Header: "Module Preview" + **Sync Preview** button + stale badge
- Body: `ModulePreviewNavigator` when `snapshot` exists
- Error banner when `syncError`
- Empty state when no cards and no quiz
- Loading overlay when `isSyncing`

Props: `onClose` for modal mode (Phase 5).

### 9. Tests

**New file:** `src/features/module-library/context/ModulePreviewContext.test.tsx`

Setup: `ModulePreviewProvider` + mock Redux store with `working` / `baseline`.

| Case | Assert |
|------|--------|
| Baseline loads | Snapshot seeded automatically |
| Edit working (dirty) | Snapshot unchanged |
| `syncPreview()` | Snapshot matches working |
| Sync throws | Error shown; old snapshot retained |
| `openPreview({ phase: 'quiz', index: 2 })` | Position set correctly |
| Re-sync after card delete | Position clamped |

**New file:** `src/features/module-library/components/module-preview/ModulePreviewPanel.test.tsx`

| Case | Assert |
|------|--------|
| Sync button calls sync | Snapshot updates |
| `syncError` | Error banner visible |
| `isStale` | Badge visible |

---

## Files to create / modify

| Action | Path |
|--------|------|
| New | `src/features/module-library/context/ModulePreviewContext.tsx` |
| New | `src/features/module-library/hooks/useModulePreview.ts` |
| New | `src/features/module-library/components/module-preview/ModulePreviewPanel.tsx` |
| New | `ModulePreviewContext.test.tsx` |
| New | `ModulePreviewPanel.test.tsx` |

**Do not modify** `AdminModuleReviewLayout` yet (Phase 5).

For tests, wrap provider around panel:

```tsx
<Provider store={store}>
  <ModulePreviewProvider moduleId="mod-1">
    <ModulePreviewPanel />
  </ModulePreviewProvider>
</Provider>
```

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/module-library/context/ModulePreviewContext.test.tsx
npm run test -- src/features/module-library/components/module-preview/ModulePreviewPanel.test.tsx
npm run typecheck
```

---

## Done checklist

- [ ] `ModulePreviewProvider` seeds snapshot from `baseline` once per module
- [ ] Editing `working` does not update snapshot
- [ ] `syncPreview` reads `working`, updates snapshot, clamps position
- [ ] Sync failure preserves previous snapshot and shows error
- [ ] `openPreview` / `closePreview` work correctly
- [ ] `registerEditorContext` stores step context
- [ ] `isStale` reflects dirty editor state
- [ ] `ModulePreviewPanel` renders navigator + sync UI
- [ ] Tests pass
- [ ] `npm run typecheck` passes

---

## Next phase

[Phase 5 — Layout Integration](./phase-5-layout-integration.md)
