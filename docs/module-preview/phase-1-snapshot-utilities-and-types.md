# Phase 1 — Snapshot Utilities and Types

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** None (read [architecture-reference.md](./architecture-reference.md) first)  
**Blocks:** Phases 2, 3, 4, 5, 6

---

## Goal

Define preview types and pure utilities that transform editor module data into an immutable learner-oriented snapshot. No React components or editor wiring in this phase — only logic and unit tests.

---

## Tasks

### 1. Preview types

**New file:** `src/features/module-library/types/modulePreview.types.ts`

Export:

```typescript
export type ModulePreviewPhase = 'card' | 'quiz';

export interface ModulePreviewPosition {
  phase: ModulePreviewPhase;
  index: number;
}

export interface PreviewCard {
  index: number;
  title: string;
  body: RichBlock[];
}

export interface PreviewQuizItem {
  index: number;
  id: string;
  question: string;
  caseSetup: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ModulePreviewSnapshot {
  moduleTitle: string;
  cards: PreviewCard[];
  quiz: PreviewQuizItem[];
  syncedAt: number;
}
```

Import `RichBlock` from `@/features/program-manager/types/programManager.types`.

### 2. Snapshot generator

**New file:** `src/features/module-library/utils/generateModulePreviewSnapshot.ts`

```typescript
export function generateModulePreviewSnapshot(
  module: Pick<AdminModuleDetailResponse, 'title_bn' | 'title_en' | 'cards' | 'quiz'>,
): ModulePreviewSnapshot;
```

Behavior:

1. **Module title:** `title_bn?.trim() || title_en?.trim() || 'Untitled module'`
2. **Cards:** Map `module.cards` in **array order** (do not sort by `card_order`).
   - Normalize each card via `normalizeAdminModuleCard(card, index)`.
   - Title: `title_bn` with `title_en` fallback (match Android `translatedText` BN-primary).
   - Body: `body_bn` as `RichBlock[]` (already normalized).
3. **Quiz:** `prepareModuleJsonForSave(cards, quiz).quiz` then map each item:
   - `question` ← `question_bn` (trim, fallback `''`)
   - `caseSetup` ← `case_setup_bn`
   - `options` ← `options_bn` (filter empty strings)
   - `correctIndex` ← `clampCorrectIndex(options.length, correct_indices)`
   - `explanation` ← `explanation_bn`
4. **Immutability:** Return a new object tree. Use `structuredClone` on mapped arrays or explicit spread — caller must not be able to mutate editor state through the snapshot.
5. **syncedAt:** `Date.now()`
6. **Never throw on empty content** — return empty `cards` / `quiz` arrays.

### 3. Navigation helpers

**New file:** `src/features/module-library/utils/modulePreviewNavigation.ts`

Export:

```typescript
export function getTotalSteps(snapshot: ModulePreviewSnapshot): number;
export function getStepLabel(position: ModulePreviewPosition, snapshot: ModulePreviewSnapshot): string;
export function canGoPrevious(position: ModulePreviewPosition): boolean;
export function canGoNext(position: ModulePreviewPosition, snapshot: ModulePreviewSnapshot): boolean;
export function goPrevious(position: ModulePreviewPosition): ModulePreviewPosition;
export function goNext(position: ModulePreviewPosition, snapshot: ModulePreviewSnapshot): ModulePreviewPosition;
export function clampPosition(
  position: ModulePreviewPosition,
  snapshot: ModulePreviewSnapshot,
): ModulePreviewPosition;
export function getInitialPosition(
  snapshot: ModulePreviewSnapshot,
  context?: Partial<ModulePreviewPosition>,
): ModulePreviewPosition;
```

Rules:

| Rule | Detail |
|------|--------|
| Journey order | Cards `0..cards.length-1`, then quiz `0..quiz.length-1` |
| Last card Next | Transitions to `{ phase: 'quiz', index: 0 }` if quiz exists; else stay on last card |
| Last quiz Next | No-op (`canGoNext` false) |
| First card Previous | No-op |
| First quiz Previous | Goes to last card if cards exist; else no-op |
| `clampPosition` | If card index ≥ `cards.length`, clamp to last card or first quiz; same for quiz |
| `getInitialPosition` | Default `{ phase: 'card', index: 0 }`; honor `context` if valid |

`getStepLabel` examples:

- Card phase: `"Learning 2 of 5"`
- Quiz phase: `"Question 3 of 10"`

### 4. Quiz answer card state

**New file:** `src/features/module-library/utils/previewAnswerCardState.ts`

Port Android `AnswerCardState` logic from `SharedQuizContent.kt`:

```typescript
export type PreviewAnswerCardState =
  | 'unselected'
  | 'selected'
  | 'correct_revealed'
  | 'wrong_revealed';

export function resolvePreviewAnswerCardState(
  optionIndex: number,
  selectedIndex: number | null,
  correctIndex: number,
  isRevealed: boolean,
): PreviewAnswerCardState;
```

Rules (match Android):

- Before reveal: tapped option → `selected`; others → `unselected`
- After reveal: correct option → `correct_revealed`; wrong selected → `wrong_revealed`; others → `unselected`

### 5. Unit tests

**New files:**

- `src/features/module-library/utils/generateModulePreviewSnapshot.test.ts`
- `src/features/module-library/utils/modulePreviewNavigation.test.ts`
- `src/features/module-library/utils/previewAnswerCardState.test.ts`

#### Snapshot test cases

| Case | Assert |
|------|--------|
| 3 cards in editor order | `cards[0..2].index` matches array index |
| Reordered cards input | Snapshot preserves input array order |
| Quiz with gaps in `question_order` | Output quiz sorted 0..n-1 by `sortQuizItems` |
| BN title with EN fallback | Card uses BN when present |
| Empty module | `cards: []`, `quiz: []` |
| Immutability | Mutating returned snapshot does not affect input module |

Use fixtures inspired by `LessonCardsJsonParserTest` / `QuizJsonParserTest` (see [architecture-reference.md](./architecture-reference.md)).

#### Navigation test cases

| Case | Assert |
|------|--------|
| Card 0 previous | `canGoPrevious` false |
| Last card next (with quiz) | `{ phase: 'quiz', index: 0 }` |
| Last card next (no quiz) | stays on last card |
| Quiz 0 previous (with cards) | last card |
| Full forward walk | Visits all cards then all quiz items |
| `clampPosition` after card deleted | Index clamped to valid range |

#### Answer state test cases

| Case | Assert |
|------|--------|
| No selection | all `unselected` |
| Selected, not revealed | one `selected` |
| Revealed correct | correct → `correct_revealed` |
| Revealed wrong | selected wrong → `wrong_revealed`, correct → `correct_revealed` |

---

## Files to create

| Action | Path |
|--------|------|
| New | `src/features/module-library/types/modulePreview.types.ts` |
| New | `src/features/module-library/utils/generateModulePreviewSnapshot.ts` |
| New | `src/features/module-library/utils/modulePreviewNavigation.ts` |
| New | `src/features/module-library/utils/previewAnswerCardState.ts` |
| New | `*.test.ts` for each util above |

**Do not modify** editor components, layout, or Redux in this phase.

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/module-library/utils/generateModulePreviewSnapshot.test.ts
npm run test -- src/features/module-library/utils/modulePreviewNavigation.test.ts
npm run test -- src/features/module-library/utils/previewAnswerCardState.test.ts
npm run typecheck
```

---

## Done checklist

- [ ] `modulePreview.types.ts` exported and imported cleanly
- [ ] `generateModulePreviewSnapshot` maps cards in array order and quiz via `sortQuizItems`
- [ ] Snapshot is immutable relative to editor input
- [ ] Navigation helpers implement cards → quiz journey
- [ ] `clampPosition` handles deleted/reordered items
- [ ] `previewAnswerCardState` matches Android reveal rules
- [ ] All unit tests pass
- [ ] `npm run typecheck` passes

---

## Next phase

[Phase 2 — Learner Rendering Components](./phase-2-learner-rendering-components.md)
