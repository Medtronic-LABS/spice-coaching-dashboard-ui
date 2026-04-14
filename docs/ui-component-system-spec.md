# 🧱 UI Component System – Supervisor & Program Manager Dashboard

## 🧠 Objective

This document defines the **custom reusable UI components** to be built for the dashboard (Supervisor + Program Manager scope).

The goal is to:

* Build a **clean, scalable component library**
* Ensure **high reusability across screens**
* Maintain **consistent UI/UX using Tailwind**
* Follow **TypeScript + ESLint best practices**
* Keep components **generic (no business/domain coupling)**

---

## ⚙️ Tech Requirements

### ✅ Must Use

* React (Functional Components)
* TypeScript (strict mode)
* Tailwind CSS
* ESLint + Prettier

### ✅ Coding Standards

* Fully typed props (`type` or `interface`)
* No `any`
* Proper default props handling
* Clean class composition (use `clsx` or similar)
* No inline styles (only Tailwind)
* Accessible components (ARIA where needed)

---

## 🧠 Design Principles

### 1. Keep Components Generic

❌ Bad: `CHWCard`, `SkillGapCard`
✅ Good: `InfoCard`, `StatCard`, `ListItem`

---

### 2. No Business Logic

Components should only handle:

* UI
* Styling
* Basic interaction (click, hover)

---

### 3. Composition First

Components should be composable:

```tsx
<Card>
  <SectionHeader />
  <InfoCard />
</Card>
```

---

### 4. Variants Over Duplication

Use props instead of creating new components:

```tsx
<Button variant="primary" />
<Button variant="ghost" />
```

---

## 📘 Documentation Requirements (IMPORTANT)

### 🔹 1. Central README for Components

* Maintain **one `README.md` inside `components/ui/`**
* This should document:

  * All components
  * Props (with types)
  * Usage examples
  * Variants
* Purpose:

  * Any developer importing components should **quickly understand usage**
  * Reduces dependency on tribal knowledge

---

### 🔹 2. Component-Level Comments

Each component file **must include clear comments**:

#### At the top of file:

* What the component does
* Where it should be used
* Example usage

#### For props:

* Explain non-obvious props
* Mention default values

#### Example:

```tsx
/**
 * InfoCard
 * Generic card used to display alerts, insights, or messages.
 *
 * Usage:
 * <InfoCard title="..." description="..." tone="warning" />
 */
```

---

### 🔹 3. Component Test / Preview Page (MANDATORY)

* Create a dedicated page (e.g., `/ui-preview` or `/components-preview`)
* This page should render **all custom components in isolation**
* Each component should have:

  * Example usage
  * Different variants (if applicable)
  * Edge cases (empty state, long text, etc.)

#### Purpose:

* Helps developers quickly understand components visually
* Acts like a lightweight **Storybook alternative**
* Useful for debugging and QA

#### Example Structure:

```tsx
<SectionHeader title="StatCard" />
<StatCard label="Completion Rate" value="68%" change={5} />

<SectionHeader title="InfoCard Variants" />
<InfoCard tone="info" />
<InfoCard tone="warning" />
<InfoCard tone="critical" />
```

---

## 🧱 Component List

---

### 🔹 1. Card

**Purpose:** Base container for all UI blocks

```tsx
<Card variant="default | bordered | elevated">
  {children}
</Card>
```

---

### 🔹 2. SectionHeader

**Purpose:** Title with optional action

```tsx
<SectionHeader
  title="Section Title"
  action={<Button>Action</Button>}
/>
```

---

### 🔹 3. Divider

**Purpose:** Visual separator

---

### 🔹 4. StatCard

**Purpose:** KPI display

```tsx
<StatCard
  label="Completion Rate"
  value="68%"
  change={+5}
/>
```

Props:

* `label: string`
* `value: string | number`
* `change?: number`

---

### 🔹 5. InfoCard

**Purpose:** Generic content (alerts, insights, messages)

```tsx
<InfoCard
  title="Low AI Usage"
  description="Usage dropped by 12%"
  tone="info | success | warning | critical"
/>
```

---

### 🔹 6. Banner

**Purpose:** Full-width highlight message

```tsx
<Banner tone="warning">
  Message content
</Banner>
```

---

### 🔹 7. KeyValue

**Purpose:** Label-value pair

```tsx
<KeyValue label="Region" value="Dhaka" />
```

---

### 🔹 8. ListItem

**Purpose:** Reusable row/card item

```tsx
<ListItem
  title="Name"
  subtitle="Additional info"
  rightContent={<Badge />}
/>
```

---

### 🔹 9. FilterBar

**Purpose:** Container for filters

```tsx
<FilterBar>
  <Select />
  <SearchInput />
  <Button>Reset</Button>
</FilterBar>
```

---

### 🔹 10. Select

**Purpose:** Styled dropdown

Props:

* `options: { label: string; value: string }[]`
* `value: string`
* `onChange: (value: string) => void`

---

### 🔹 11. SearchInput

**Purpose:** Search field

Props:

* `value: string`
* `onChange: (value: string) => void`
* `placeholder?: string`

---

### 🔹 12. Badge

**Purpose:** Small label/status

---

### 🔹 13. StatusBadge

**Purpose:** Badge with status color

```tsx
<StatusBadge status="success" label="Active" />
```

---

### 🔹 14. Button

**Purpose:** Action trigger

Variants:

* `primary`
* `secondary`
* `ghost`

---

### 🔹 15. Tabs

**Purpose:** Switch between views

---

### 🔹 16. EmptyState

**Purpose:** No data state

---

### 🔹 17. LoadingState

**Purpose:** Loading placeholder

---

### 🔹 18. ErrorState

**Purpose:** Error UI

---

## 🎨 Styling Guidelines (Tailwind)

### Colors (example)

* Primary: `blue-600`
* Success: `green-600`
* Warning: `yellow-500`
* Critical: `red-600`
* Neutral: `gray-500`

---

### Spacing

* Use consistent spacing scale: `p-4`, `p-6`, `gap-4`, etc.
* Avoid arbitrary values unless necessary

---

### Typography

* Title: `text-lg font-semibold`
* Subtitle: `text-sm text-gray-500`
* Value: `text-2xl font-bold`

---

## 🛡️ Error Handling

Each component should:

* Handle missing/optional props safely
* Avoid runtime crashes
* Provide fallback UI where needed

Example:

```tsx
{value ?? "-"}
```

---

## 🧪 Accessibility

* Use semantic HTML (`button`, `input`, etc.)
* Add `aria-label` where needed
* Ensure focus states are visible

---

## 📁 Suggested Folder Structure

```
components/ui/

  Card.tsx
  SectionHeader.tsx
  Divider.tsx

  StatCard.tsx
  InfoCard.tsx
  Banner.tsx
  KeyValue.tsx
  ListItem.tsx

  FilterBar.tsx
  Select.tsx
  SearchInput.tsx

  Badge.tsx
  StatusBadge.tsx
  Button.tsx
  Tabs.tsx

  EmptyState.tsx
  LoadingState.tsx
  ErrorState.tsx

  README.md   <-- central documentation for all components
```

---

## 🚀 Final Goal

By building these components:

* You can compose **entire dashboard UI**
* Maintain **consistency**
* Enable **fast development**
* Make onboarding easy for new developers

---

## ✅ Deliverables Expected

Each component should include:

* TypeScript types
* Tailwind styling
* Variant support (if applicable)
* Clean, readable code
* ESLint-compliant formatting
* Proper comments explaining usage
* Coverage in the **UI preview/test page**

---

## 🧠 Final Rule

> If a component cannot be reused in multiple places, don’t create it yet.

---
