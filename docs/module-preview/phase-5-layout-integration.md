# Phase 5 — Layout Integration

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phase 4](./phase-4-preview-context-and-state.md) complete  
**Blocks:** Phase 6

---

## Goal

Mount `ModulePreviewProvider` and preview UI in the Module Editor layout so Program Managers can open/close preview from any wizard step, sync preview on demand, and see the mobile frame without leaving the editor.

---

## Tasks

### 1. Wrap layout with provider

**Modify:** `src/features/modules/layout/AdminModuleReviewLayout.tsx`

1. Import `ModulePreviewProvider` from context.
2. Wrap `<Outlet />` and preview chrome:

```tsx
<ModulePreviewProvider moduleId={moduleId}>
  {/* existing step nav + outlet */}
  <ModulePreviewChrome />
</ModulePreviewProvider>
```

3. Keep existing `clearAdminModuleReview` on unmount — provider should reset its own state when `moduleId` changes.

### 2. Preview chrome component

**New file:** `src/features/modules/components/module-preview/ModulePreviewChrome.tsx`

Responsibilities:

- **Preview toggle button** in layout toolbar (visible on all 4 steps)
- **Side panel** on `xl` breakpoint (≥1280px): fixed right column, ~400px wide, collapsible
- **Modal fallback** below `xl`: full-screen `Modal` with `ModulePreviewPanel`

```typescript
export const ModulePreviewChrome = () => {
  const { isOpen, openPreview, closePreview } = useModulePreview();
  // useMediaQuery or Tailwind `hidden xl:block` patterns
};
```

#### Side panel layout (xl+)

```
┌─────────────────────────────────────┬──────────────┐
│  Step nav + Editor (Outlet)         │ Mobile       │
│                                     │ Preview      │
│                                     │ [Sync]       │
│                                     │ ┌──────────┐ │
│                                     │ │ phone    │ │
│                                     │ └──────────┘ │
└─────────────────────────────────────┴──────────────┘
```

- Panel sticky: `sticky top-4`
- Toggle: "Preview" / "Hide Preview" button in layout header row
- When closed: editor uses full width

#### Modal layout (<xl)

- "Preview" button opens `Modal` with `ModulePreviewPanel onClose={closePreview}`
- Close via X button, Escape, backdrop click

### 3. Layout header buttons

Add to `AdminModuleReviewLayout` header area (near step indicators or top-right):

| Button | Action |
|--------|--------|
| **Preview** | `openPreview()` — uses registered editor context (Phase 6) or defaults to card 0 |
| **Hide Preview** | `closePreview()` — when panel open |

Optional: show stale dot on Preview button when `isStale`.

### 4. Sync Preview button placement

Inside `ModulePreviewPanel` header (already from Phase 4):

```
[ Module Preview ]  [ Edits not synced ]  [ Sync Preview ]
```

Sync button:

- `disabled={isSyncing || !working}`
- Shows loading spinner when `isSyncing`
- `onClick={() => syncPreview()}`

### 5. Performance: unmount when closed

When preview panel/modal is **closed**:

- Do not render `ModulePreviewNavigator` (unmount preview subtree)
- Keep `snapshot` in context (cheap memory) for fast re-open
- Presign requests stop because image components unmount

When open: only active screen's media hooks are active.

### 6. Read-only for supervisors

**Modify:** `AdminModuleReviewLayout.tsx` or `ModulePreviewChrome.tsx`

- Supervisors (`useAdminModuleReviewReadonly() === true`) can still **open preview** and navigate
- **Sync Preview** disabled or hidden (they cannot edit — snapshot always matches baseline)
- Preview button remains available for review validation

### 7. Layout integration test

**New file:** `src/features/modules/layout/AdminModuleReviewLayout.preview.test.tsx`

Mock `useAdminModuleReviewEditor` + render layout with `MemoryRouter`.

| Case | Assert |
|------|--------|
| Click Preview | Panel/modal opens |
| Click Hide Preview | Panel closes |
| Click Sync Preview | Snapshot updates (mock context) |
| Supervisor role | Sync button hidden/disabled |

---

## Files to create / modify

| Action | Path |
|--------|------|
| New | `src/features/modules/components/module-preview/ModulePreviewChrome.tsx` |
| Modify | `src/features/modules/layout/AdminModuleReviewLayout.tsx` |
| New | `AdminModuleReviewLayout.preview.test.tsx` |

---

## UX copy

| Element | Label |
|---------|-------|
| Toggle (closed) | `Preview` |
| Toggle (open) | `Hide preview` |
| Sync button | `Sync preview` |
| Stale badge | `Edits not synced` |
| Sync in progress | `Syncing…` |
| Sync error | `Preview sync failed. Your edits are safe — try again.` |
| Empty module | `No cards or quiz questions to preview. Add content, then sync preview.` |

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/modules/layout/AdminModuleReviewLayout.preview.test.tsx
npm run typecheck
npm run dev
```

Manual QA:

1. Open module editor on a module with cards + quiz
2. Click Preview — mobile frame appears
3. Navigate prev/next through full module
4. Edit a card title — preview unchanged
5. Click Sync preview — title updates
6. Resize window below/above `xl` — modal vs side panel

---

## Done checklist

- [ ] `ModulePreviewProvider` wraps module review layout
- [ ] Preview toggle visible on all wizard steps
- [ ] Side panel on xl+, modal below xl
- [ ] Sync Preview works from panel header
- [ ] Preview subtree unmounts when closed
- [ ] Supervisor can preview but not sync
- [ ] Layout integration test passes
- [ ] Manual smoke test on dev server

---

## Next phase

[Phase 6 — Context-Aware Entry and Verification](./phase-6-context-aware-entry-and-verification.md)
