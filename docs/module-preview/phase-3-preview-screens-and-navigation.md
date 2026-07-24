# Phase 3 — Preview Screens and Navigation

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phase 1](./phase-1-snapshot-utilities-and-types.md) and [Phase 2](./phase-2-learner-rendering-components.md) complete  
**Blocks:** Phases 4, 5, 6

---

## Goal

Compose Phase 1–2 building blocks into full mobile preview screens (lesson card, quiz question) inside a phone frame, with Previous/Next navigation across the entire module flow. Still no editor/Redux wiring — pass snapshot and position as props.

---

## Tasks

### 1. Mobile preview frame

**New file:** `src/features/modules/components/module-preview/MobilePreviewFrame.tsx`

```typescript
export interface MobilePreviewFrameProps {
  headerTitle: string;
  headerSubtitle?: string;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

Layout:

- Outer bezel: rounded rectangle, subtle shadow, max width ~390px, min height ~700px
- Header: blue bar (`bg-[var(--color-blue-app)]` or `bg-spice-*` if token exists), white text
- Body: `flex-1 overflow-y-auto` white content area
- Footer slot: fixed bottom bar for nav buttons

Accessible: `role="region"` + `aria-label="Module preview"`.

### 2. Lesson card preview screen

**New file:** `src/features/modules/components/module-preview/LessonCardPreviewScreen.tsx`

```typescript
export interface LessonCardPreviewScreenProps {
  card: PreviewCard;
  cardIndex: number;
  totalCards: number;
}
```

Layout (mirror `LessonPlayerScreen.kt`):

- Header subtitle: `Learning {cardIndex + 1} of {totalCards}` (passed to frame or rendered internally)
- Bold card title
- `<LearnerRichCardBody blocks={card.body} />`
- No TTS, no telemetry, no edit controls

### 3. Preview answer card

**New file:** `src/features/modules/components/module-preview/PreviewAnswerCard.tsx`

```typescript
export interface PreviewAnswerCardProps {
  text: string;
  state: PreviewAnswerCardState;
  index: number; // 0-based → A/B/C/D badge
  onSelect: () => void;
  disabled?: boolean;
}
```

Visual states (match Android `AnswerCard.kt`):

| State | Background | Border |
|-------|------------|--------|
| `unselected` | white | gray |
| `selected` | light blue | primary blue |
| `correct_revealed` | green tint | green |
| `wrong_revealed` | red tint | red |

Circular badge with letter A/B/C/D from index.

### 4. Quiz question preview screen

**New file:** `src/features/modules/components/module-preview/QuizQuestionPreviewScreen.tsx`

```typescript
export interface QuizQuestionPreviewScreenProps {
  item: PreviewQuizItem;
  questionIndex: number;
  totalQuestions: number;
}
```

Local state only (preview-scoped, not Redux):

```typescript
const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
const [isRevealed, setIsRevealed] = useState(false);
```

Behavior:

1. Show `caseSetup` in blue info box when non-empty
2. Question text bold
3. Map `item.options` to `PreviewAnswerCard` list
4. On tap (before reveal): set `selectedIndex`, then `isRevealed = true`
5. After reveal: show explanation block + "Next question" hint (actual next handled by navigator)
6. Lock answers after reveal (no re-answer)
7. Reset local state when `item.id` changes (`useEffect` on question id)

### 5. Module preview navigator

**New file:** `src/features/modules/components/module-preview/ModulePreviewNavigator.tsx`

```typescript
export interface ModulePreviewNavigatorProps {
  snapshot: ModulePreviewSnapshot;
  position: ModulePreviewPosition;
  onPositionChange: (next: ModulePreviewPosition) => void;
}
```

Renders:

- Previous button (`<`) — disabled when `!canGoPrevious(position)`
- Center label from `getStepLabel(position, snapshot)`
- Next button (`>`) — disabled when `!canGoNext(position, snapshot)`
- On last card with quiz: Next label may read "Start Quiz" (optional Android parity)

Renders **one** of:

- `<LessonCardPreviewScreen />` when `position.phase === 'card'`
- `<QuizQuestionPreviewScreen />` when `position.phase === 'quiz'`

Wrap in `<MobilePreviewFrame footer={...navigator buttons...}>`.

### 6. Storybook-style dev shell (optional)

**New file:** `src/features/modules/components/module-preview/ModulePreviewDevShell.tsx`

A standalone component that accepts a fixture `ModulePreviewSnapshot` + initial position for manual QA during Phase 3. Used in tests; can be removed before Phase 6 or kept for dev.

### 7. Tests

**New files:**

- `src/features/modules/components/module-preview/ModulePreviewNavigator.test.tsx`
- `src/features/modules/components/module-preview/QuizQuestionPreviewScreen.test.tsx`

#### Navigator tests

| Case | Assert |
|------|--------|
| Starts on card 0 | Lesson screen visible |
| Next through all cards | Reaches quiz phase |
| Previous from quiz 0 | Returns to last card |
| Empty quiz module | Stays in card phase at last card |

#### Quiz screen tests

| Case | Assert |
|------|--------|
| Tap option | Explanation appears |
| After reveal | Options disabled |
| `case_setup` present | Info box rendered |

---

## Files to create

| Action | Path |
|--------|------|
| New | `MobilePreviewFrame.tsx` |
| New | `LessonCardPreviewScreen.tsx` |
| New | `PreviewAnswerCard.tsx` |
| New | `QuizQuestionPreviewScreen.tsx` |
| New | `ModulePreviewNavigator.tsx` |
| New (optional) | `ModulePreviewDevShell.tsx` |
| New | `*.test.tsx` above |

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/modules/components/module-preview/ModulePreviewNavigator.test.tsx
npm run test -- src/features/modules/components/module-preview/QuizQuestionPreviewScreen.test.tsx
npm run typecheck
```

Manual: Render `ModulePreviewDevShell` with a 5-card / 3-quiz fixture; walk full flow with prev/next.

---

## Done checklist

- [ ] Mobile frame renders header, scroll body, footer nav
- [ ] Lesson screen shows title + rich body
- [ ] Quiz screen supports answer tap → reveal → explanation
- [ ] Navigator walks cards then quiz in order
- [ ] Only one screen mounted at a time
- [ ] Quiz local state resets on question change
- [ ] Tests pass
- [ ] `npm run typecheck` passes

---

## Next phase

[Phase 4 — Preview Context and State](./phase-4-preview-context-and-state.md)
