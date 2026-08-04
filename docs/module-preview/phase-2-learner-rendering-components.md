# Phase 2 — Learner Rendering Components

**Repo:** `micro-learning-analytics-dashboard`  
**Prerequisite:** [Phase 1](./phase-1-snapshot-utilities-and-types.md) complete  
**Blocks:** Phases 3, 4, 5, 6

---

## Goal

Build read-only React components that render `RichBlock[]` and media the way CHWs see them on Android — without TipTap, without edit affordances. Components accept preview DTO props only (no Redux).

---

## Tasks

### 1. Learner rich card body

**New file:** `src/features/module-library/components/module-preview/LearnerRichCardBody.tsx`

```typescript
export interface LearnerRichCardBodyProps {
  blocks: RichBlock[];
  className?: string;
}
```

Render tree for each `RichBlock` type:

| Block type | Rendering |
|------------|-----------|
| `paragraph` | `<p>` with inline marks (bold, italic, underline, strike, code, link) |
| `heading` | `<h1>`–`<h6>` by level |
| `bullet_list` / `ordered_list` | Nested `<ul>` / `<ol>` |
| `blockquote` | `<blockquote>` with recursive children |
| `code_block` | `<pre><code>` |
| `horizontal_rule` | `<hr />` |
| `image` | `<PreviewImageBlock />` |
| `video` | `<PreviewVideoBlock />` |
| `audio` | `<PreviewAudioBlock />` |

Styling:

- Use existing theme tokens (`text-spice-text-primary`, `prose`-like spacing).
- Links open in new tab (`target="_blank" rel="noopener noreferrer"`).
- Skip empty paragraphs (match Android parser tolerance).

**Do not** use `RichTextEditor`, `blocksToHtml`, or TipTap.

### 2. Preview image block

**New file:** `src/features/module-library/components/module-preview/PreviewImageBlock.tsx`

```typescript
export interface PreviewImageBlockProps {
  attrs: RichImageBlock['attrs'];
}
```

Behavior (mirror `RichImageBlock.kt`):

- 16:9 aspect ratio container, rounded corners
- Resolve URL via `usePresignedFileUrl(attrs.object_name, { legacyUrl: attrs.url })`
- Loading: spinner or skeleton
- Error / no URL: "Image unavailable" placeholder (never collapse silently)
- Optional caption below image

### 3. Preview video block

**New file:** `src/features/module-library/components/module-preview/PreviewVideoBlock.tsx`

Behavior (mirror `RichVideoBlock.kt`):

- Dark background (`#101828`), 16:9, rounded corners
- Centered play icon (static SVG or icon component)
- Show filename from `original_filename` or `object_name`
- **No click handler, no playback, no ExoPlayer**

Optional: resolve thumbnail URL if `attrs.thumbnail` present; still no play.

### 4. Preview audio block

**New file:** `src/features/module-library/components/module-preview/PreviewAudioBlock.tsx`

Simple metadata card:

- Label: `attrs.title` or `attrs.url` or "Audio"
- Styled as muted info row (Android has no inline audio in lesson cards)

### 5. Inline text helper (optional internal)

If `LearnerRichCardBody` grows large, extract:

**New file:** `src/features/module-library/components/module-preview/PreviewRichInline.tsx`

Renders `RichTextLeaf[]` with mark nesting. Keep colocated if small.

### 6. Component tests

**New file:** `src/features/module-library/components/module-preview/LearnerRichCardBody.test.tsx`

| Case | Assert |
|------|--------|
| Paragraph with bold text | `<strong>` rendered |
| Heading level 2 | `<h2>` rendered |
| Bullet list | `<ul><li>` structure |
| Image block | `PreviewImageBlock` mounted (mock presign hook) |
| Video block | Play icon + no `<video>` element |
| Empty blocks array | Renders nothing / empty state |

Mock `usePresignedFileUrl` in tests:

```typescript
vi.mock('@/features/module-library/hooks/usePresignedFileUrl', () => ({
  usePresignedFileUrl: () => ({ url: 'https://example.com/img.png', isLoading: false, isError: false }),
}));
```

---

## Files to create

| Action | Path |
|--------|------|
| New | `src/features/module-library/components/module-preview/LearnerRichCardBody.tsx` |
| New | `src/features/module-library/components/module-preview/PreviewImageBlock.tsx` |
| New | `src/features/module-library/components/module-preview/PreviewVideoBlock.tsx` |
| New | `src/features/module-library/components/module-preview/PreviewAudioBlock.tsx` |
| New (optional) | `src/features/module-library/components/module-preview/PreviewRichInline.tsx` |
| New | `src/features/module-library/components/module-preview/LearnerRichCardBody.test.tsx` |

**Do not wire** into editor layout yet. Test components in isolation with fixture `RichBlock[]` props.

---

## Visual reference

Match Android layout intent (not pixel-perfect):

- Card body: white scrollable area, comfortable padding
- Images: full width, 16:9
- Videos: dark tile with play affordance (non-interactive in preview)
- Typography: readable mobile scale (~14–16px body)

Theme blue for headers comes in Phase 3 (`MobilePreviewFrame`).

---

## How to verify

```bash
cd /home/beehyv/Projects/Medtronics/micro-learning-analytics-dashboard
npm run test -- src/features/module-library/components/module-preview/LearnerRichCardBody.test.tsx
npm run typecheck
```

Manual (optional): Temporarily render `LearnerRichCardBody` in `UiPreviewPage` with fixture blocks during development; remove before merge.

---

## Done checklist

- [ ] All `RichBlock` types render without TipTap
- [ ] Images lazy-load via presigned URL hook
- [ ] Videos show placeholder only — no `<video>` tag
- [ ] Audio shows metadata card
- [ ] Empty/missing media shows fallback UI
- [ ] Component tests pass
- [ ] `npm run typecheck` passes

---

## Next phase

[Phase 3 — Preview Screens and Navigation](./phase-3-preview-screens-and-navigation.md)
