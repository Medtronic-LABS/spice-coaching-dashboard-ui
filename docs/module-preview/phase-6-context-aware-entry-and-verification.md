# Phase 6 — Context-Aware Entry and Verification

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phase 5](./phase-5-layout-integration.md) complete  
**Blocks:** None (final phase)

---

## Goal

Wire editor steps so opening preview jumps to the card or quiz question currently being edited. Complete integration tests and run full acceptance verification against all criteria.

---

## Tasks

### 1. Lessons step — register card context

**Modify:** `src/features/module-library/pages/admin-module-review/AdminModuleLessonsStep.tsx`

1. Import `useModulePreview`.
2. Register context when selection changes:

```typescript
const { registerEditorContext } = useModulePreview();

useEffect(() => {
  registerEditorContext({ phase: 'card', index: selectedIndex });
}, [selectedIndex, registerEditorContext]);
```

3. Optional per-card shortcut: small "Preview" link on each card row that calls `openPreview({ phase: 'card', index })`.

Ensure effect does not cause editor performance issues — `registerEditorContext` must be stable (`useCallback` in provider).

### 2. Quiz step — focused question index

**Modify:** `src/features/module-library/pages/admin-module-review/AdminModuleQuizStep.tsx`

The quiz step currently shows all questions at once with no selection state. Add:

```typescript
const [focusedQuizIndex, setFocusedQuizIndex] = useState(0);
const { registerEditorContext } = useModulePreview();

useEffect(() => {
  registerEditorContext({ phase: 'quiz', index: focusedQuizIndex });
}, [focusedQuizIndex, registerEditorContext]);
```

Set `focusedQuizIndex` when:

- User focuses question input: `onFocus={() => setFocusedQuizIndex(index)}`
- User focuses option input: same
- Reorder changes list: clamp index to `sortedQuiz.length - 1`

### 3. Details and publish steps

**Modify:** `AdminModuleDetailsStep.tsx` and `AdminModulePublishStep.tsx` (minimal)

Register default context on mount:

```typescript
useEffect(() => {
  registerEditorContext({ phase: 'card', index: 0 });
}, [registerEditorContext]);
```

Or rely on provider default — verify `openPreview()` from these steps lands on Card 1.

### 4. Integration tests — lessons step

**Extend or new:** `src/features/module-library/pages/admin-module-review/AdminModuleLessonsStep.preview.test.tsx`

| Case | Assert |
|------|--------|
| Select card 3, open preview | Navigator shows card 3 content |
| Edit card title, preview without sync | Shows old title |
| Sync preview | Shows new title |

Follow mock patterns from `AdminModuleLessonsStep.test.tsx`.

### 5. Integration tests — quiz step

**New:** `src/features/module-library/pages/admin-module-review/AdminModuleQuizStep.preview.test.tsx`

| Case | Assert |
|------|--------|
| Focus question 2, open preview | Quiz question 2 displayed |
| Reorder questions, sync | Preview order updates |

### 6. Large module performance smoke test

**New file (optional):** `src/features/module-library/utils/generateModulePreviewSnapshot.perf.test.ts`

Generate fixture with 200 cards + 100 quiz items:

| Assert | Threshold |
|--------|-----------|
| `generateModulePreviewSnapshot` duration | < 500ms in CI (generous) |
| Snapshot memory | No duplicate DOM — preview not mounted in this test |

Manual: Open module with many cards; type rapidly in editor — no perceptible lag.

### 7. Android contract fixtures

**New file:** `src/features/module-library/utils/fixtures/androidModuleFixtures.ts`

Port minimal JSON from:

- `LessonCardsJsonParserTest.kt`
- `QuizJsonParserTest.kt`

Use in snapshot tests to document cross-platform contract.

---

## Full acceptance verification

Run through each criterion from [README.md](./README.md#acceptance-criteria-full-verification-in-phase-6):

| # | Criterion | How to verify |
|---|-----------|---------------|
| 1 | Mobile phone frame | Visual — `MobilePreviewFrame` in panel/modal |
| 2 | Same ordering | Reorder cards in editor, sync, walk preview |
| 3 | Card rendering | Compare with Android screenshot / device |
| 4 | Quiz rendering | Tap answer, see reveal + explanation |
| 5 | Media | Image loads; video shows placeholder; no playback |
| 6 | Navigation flow | Prev/next through cards → quiz |
| 7 | Read-only | No edit controls in preview |
| 8 | Stale while editing | Edit without sync — preview unchanged |
| 9 | Sync Preview | Click sync — content updates |
| 10 | Position preserved | On card 3, sync — still card 3 |
| 11 | Context card | Select card N, open preview — card N |
| 12 | Context quiz | Focus question N, open preview — question N |
| 13 | Full module nav | Walk entire module without publish |
| 14 | Reorder | Old order before sync, new after |
| 15 | Sync failure | Force error (mock throw) — error shown, retry works |
| 16 | Performance | Rapid typing in editor — no lag |

### Reorder scenario (criterion 14)

1. Open module: Card1 → Card2 → Quiz1
2. Sync preview — confirm order
3. Reorder to Card2 → Card1 → Quiz1 (do not sync)
4. Preview still Card1 → Card2 → Quiz1
5. Sync preview — now Card2 → Card1 → Quiz1

### Sync failure scenario (criterion 15)

In dev, temporarily throw in `generateModulePreviewSnapshot`:

- Error banner appears
- Editor edits preserved
- Previous preview content still visible
- Retry after fix succeeds

---

## Files to create / modify

| Action | Path |
|--------|------|
| Modify | `AdminModuleLessonsStep.tsx` |
| Modify | `AdminModuleQuizStep.tsx` |
| Modify | `AdminModuleDetailsStep.tsx` (optional default context) |
| Modify | `AdminModulePublishStep.tsx` (optional default context) |
| New | `AdminModuleLessonsStep.preview.test.tsx` |
| New | `AdminModuleQuizStep.preview.test.tsx` |
| New (optional) | `androidModuleFixtures.ts` |
| New (optional) | `generateModulePreviewSnapshot.perf.test.ts` |

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/module-library
npm run typecheck
npm run lint
```

Full regression:

```bash
npm run test
```

Manual cross-check with Android (recommended):

1. Save + publish a test module (or use draft on device if available)
2. Compare card title, body formatting, quiz options on device vs preview

---

## Done checklist

- [ ] Lessons step registers `selectedIndex` as preview context
- [ ] Quiz step tracks `focusedQuizIndex`
- [ ] Open preview from lessons lands on selected card
- [ ] Open preview from quiz lands on focused question
- [ ] Details/publish open preview at module start
- [ ] All integration tests pass
- [ ] All 16 acceptance criteria verified
- [ ] No backend changes required
- [ ] Feature ready for PR

---

## Post-implementation

Suggested PR description sections:

1. **Summary** — snapshot-based mobile preview, client-only
2. **Test plan** — link to verification table above
3. **Known limitations** — legacy markdown bodies (see [architecture-reference.md](./architecture-reference.md))
4. **Screenshots** — preview panel + quiz reveal state

---

## Related docs

- [README.md](./README.md) — overview and phase index
- [architecture-reference.md](./architecture-reference.md) — cross-repo investigation
