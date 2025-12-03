# UI Component Conventions

> **This document establishes architectural patterns and conventions for building UI components in TahOak.**
>
> **Focus:** Component structure, API design, and composition patterns. Styling details will be handled in a separate design system.

For project context and setup, see [AGENT_CONTEXT.md](./AGENT_CONTEXT.md).

---

## Core Principles

### 1. Component Hierarchy

**Use → Extend → Create**

Before writing any UI code:
1. **Use**: Check `src/components/ui/` for existing primitives
2. **Extend**: Add variants/props to existing components when possible
3. **Create**: Only create new components when truly necessary

### 2. Composition Over Configuration

Prefer composing smaller components over large, configurable monoliths. Components should do one thing well.

### 3. Flexible, Not Fragile

Components should be robust enough to handle edge cases, but flexible enough to be styled differently without breaking.

---

## Component Architecture

### Component Categories

| Category | Location | Purpose | Examples |
|----------|----------|---------|----------|
| **Primitives** | `src/components/ui/` | Reusable building blocks | Button, Badge, Input, Card, Select, Textarea, Modal, Alert |
| **Domain** | `src/components/{domain}/` | Feature-specific components | EntityCard, TagBadge |
| **Admin** | `src/components/admin/` | Admin-only components | EntityTable, UserTable, PageHeader, FilterBar |

**Rule:** If a component is used in 3+ places across different features, it belongs in `ui/`.

### Component API Design

All UI components should follow these patterns:

#### 1. Variant System

Use a variant prop for semantic variations (not styling variations):

```typescript
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "outline";
  // ✅ Semantic meaning
}

// ❌ Don't do this - too specific
variant?: "blue" | "red" | "green";
```

**Variant naming should describe purpose, not appearance.**

#### 2. Size System

Use a size prop for scale variations:

```typescript
interface ButtonProps {
  size?: "sm" | "md" | "lg";
  // Consistent across all components
}
```

**All components with size should use the same scale values.**

#### 3. Polymorphic Props

Extend native HTML element props when appropriate:

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  // ... custom props
}
```

This allows passing `onClick`, `disabled`, `aria-*` attributes naturally.

#### 4. className Merging

Always use `cn()` utility for className composition:

```typescript
import { cn } from "@/lib/utils";

const classes = cn(
  baseClasses,
  variantClasses[variant],
  sizeClasses[size],
  className  // Allow override
);
```

**Always accept `className` prop and merge it last** to allow style overrides.

#### 5. Forward Refs

Use `forwardRef` for components that wrap native elements:

```typescript
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return <input ref={ref} className={cn(...)} {...props} />;
  }
);
```

---

## Component Patterns

### Button Pattern

**Purpose:** All clickable actions (not just `<button>` elements).

**Requirements:**
- Must support `href` prop for navigation (renders as Link when provided)
- Must support all native button attributes
- Must have variant system (semantic: primary, secondary, danger, outline)
- Must have size system (sm, md, lg)
- Must handle disabled state
- Must have focus states (via utility class)

**Never create inline `<button>` elements with custom styling.** Always use Button component.

### IconButton Pattern

**Purpose:** Icon-only buttons for actions that don't need text labels (e.g., kebab menus, close buttons).

**Requirements:**
- Must accept `icon` prop (ReactNode)
- Must have size system (sm, md, lg)
- Must have variant system (ghost, outline)
- Must require `aria-label` prop for accessibility
- Must forward refs
- Must have focus states
- Must handle disabled state

**Use IconButton for icon-only actions, Button for text or text+icon actions.**

### Badge Pattern

**Purpose:** Status indicators, tags, labels.

**Requirements:**
- Must have variant system (semantic: success, warning, error, neutral, plus domain-specific)
- Must have size system (sm, md)
- Must support icon prop
- Must support border prop (boolean)
- Must have rounded prop (sm, md, full)

**All status indicators should use Badge component, not inline spans.**

### Card Pattern

**Purpose:** Content containers with consistent structure.

**Requirements:**
- Must have padding prop (sm, md, lg, none)
- Must accept className for styling overrides
- Should be composable (children can be anything)

**All content containers in admin/portal should use Card.**

### Input Pattern

**Purpose:** Form text inputs with labels and error states.

**Requirements:**
- Must have label prop (optional)
- Must have error prop (optional, displays error message)
- Must forward ref
- Must support all native input attributes
- Must handle password show/hide (if type="password")
- Must have focus states

**All form inputs should use Input component or similar (Select, Textarea).**

### Select Pattern

**Purpose:** Form select dropdowns with labels and error states.

**Requirements:**
- Must have label prop (optional)
- Must have error prop (optional, displays error message)
- Must have size system (sm, md, lg)
- Must forward ref
- Must support all native select attributes
- Must have focus states

**All select dropdowns should use Select component.**

### Textarea Pattern

**Purpose:** Multiline text inputs with labels and error states.

**Requirements:**
- Must have label prop (optional)
- Must have error prop (optional, displays error message)
- Must have rows prop (optional, default 4)
- Must forward ref
- Must support all native textarea attributes
- Must have focus states

**All multiline text inputs should use Textarea component.**

### Modal Pattern

**Purpose:** Dialog overlays for focused interactions.

**Requirements:**
- Must have open prop (boolean)
- Must have onClose callback
- Must have title prop
- Must have children for content
- Must have optional actions prop (ReactNode for action buttons)
- Must handle Escape key to close
- Must handle click outside to close
- Must have maxWidth prop (sm, md, lg, xl, 2xl)

**All modal dialogs should use Modal component.**

### Alert Pattern

**Purpose:** Status messages and notifications.

**Requirements:**
- Must have variant system (error, warning, success, info)
- Must have optional dismissible prop
- Must have optional onDismiss callback
- Must accept className for styling

**All status messages should use Alert component.**

### Dropdown Pattern

**Purpose:** Action menus, select dropdowns.

**Requirements:**
- Must have trigger prop (ReactNode)
- Must have align prop (left, right)
- Must handle click outside to close
- Must handle Escape key to close
- Must support onOpenChange callback

---

## Page Structure Patterns

### Admin Page Structure

Every admin page should follow this logical structure:

```typescript
export default function AdminPageName() {
  return (
    <div>
      {/* 1. Page Header */}
      <PageHeader 
        title={t("title")}
        description={t("description")}  // Optional
        action={<Button href="/admin/new">Add New</Button>}  // Optional
      />

      {/* 2. Filters (if needed) */}
      <FilterBar>
        {/* Filter inputs */}
      </FilterBar>

      {/* 3. Error State (conditional) */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* 4. Loading State (conditional) */}
      {loading ? (
        <LoadingState />
      ) : (
        /* 5. Content */
        <Card padding="none">
          <ContentTable />
        </Card>
      )}
    </div>
  );
}
```

**Key points:**
- Header always first
- Filters grouped together
- Error states always visible when present
- Loading state replaces content (not overlay)
- Content in Card container

### Table Pattern

All data tables should follow this structure:

```typescript
<table>
  <thead>
    <tr>
      <th>{/* Column header */}</th>
    </tr>
  </thead>
  <tbody>
    {items.map((item) => (
      <tr key={item.id}>
        <td>{/* Cell content */}</td>
      </tr>
    ))}
  </tbody>
</table>
```

**Requirements:**
- Must have consistent cell padding (configurable via CSS, not hardcoded)
- Must have hover state on rows
- Must handle empty state (no data)
- Must handle loading state
- Action column always right-aligned

**Cell padding should be consistent across all tables** (use CSS variables or Tailwind config).

### Empty State Pattern

All empty states should use the EmptyState component:

```typescript
<EmptyState
  icon="✅"
  title={t("emptyTitle")}
  description={t("emptyDescription")}
/>
```

**Requirements:**
- Must have icon prop (ReactNode - emoji or icon component)
- Must have title prop
- Must have description prop
- Centered layout with consistent spacing
- Use translations for text

### Loading State Pattern

All loading states should use the LoadingState component:

```typescript
<LoadingState message={t("loading")} />
// Or for full-page loading
<LoadingState message={t("loading")} fullPage />
```

**Requirements:**
- Must have optional message prop (default "Loading...")
- Must have optional fullPage prop (boolean)
- Centered layout with spinner
- Use translations for message

### Page Header Pattern

All admin pages should use the PageHeader component:

```typescript
<PageHeader
  title={t("title")}
  description={t("description")}  // Optional
  action={<Button href="/admin/new">Add New</Button>}  // Optional
/>
```

**Requirements:**
- Must have title prop
- Must have optional description prop
- Must have optional action prop (ReactNode)
- Consistent spacing (mb-6)

### Filter Bar Pattern

Pages with filters should use the FilterBar component:

```typescript
<FilterBar
  onClear={() => handleClear()}  // Optional
  onApply={() => handleApply()}  // Optional
>
  <Select label="Status" />
  <Input label="Search" />
  {/* Additional filter inputs */}
</FilterBar>
```

**Requirements:**
- Must accept children (filter inputs)
- Must have optional onClear callback
- Must have optional onApply callback
- Card wrapper with responsive grid
- Clear and Apply buttons when callbacks provided

### Action Patterns

**Single Action:**
```typescript
<Button onClick={handleAction}>Action</Button>
```

**Multiple Actions (Row):**
```typescript
<Dropdown
  trigger={<Button size="sm" variant="outline">Actions</Button>}
>
  <DropdownItem onClick={handleEdit}>Edit</DropdownItem>
  <DropdownDivider />
  <DropdownItem onClick={handleDelete} variant="danger">Delete</DropdownItem>
</Dropdown>
```

**Multiple Actions (Inline):**
```typescript
<div className="action-group">
  <Button size="sm" onClick={handlePrimary}>Primary</Button>
  <Button size="sm" variant="outline" onClick={handleSecondary}>Secondary</Button>
</div>
```

---

## Anti-Patterns (DO NOT)

### ❌ Inline Styling of Primitives

```typescript
// ❌ NEVER do this
<button className="px-4 py-2 bg-blue-600 text-white rounded">
  Save
</button>

// ✅ Always use component
<Button variant="primary">Save</Button>
```

### ❌ Duplicate Components

```typescript
// ❌ NEVER create parallel components
// src/components/admin/ActionButton.tsx  <- DON'T

// ✅ Extend existing component
// src/components/ui/Button.tsx  <- Add variant here
```

### ❌ Hardcoded Styles in Components

```typescript
// ❌ Don't hardcode specific colors
className="bg-indigo-600 text-white"

// ✅ Use variant system or CSS variables
variant="primary"  // Styling handled by variant
```

### ❌ Inconsistent APIs

```typescript
// ❌ Don't mix prop naming conventions
<Button primary={true} small={true} />

// ✅ Use consistent naming
<Button variant="primary" size="sm" />
```

### ❌ Missing Accessibility

```typescript
// ❌ Don't skip focus states
<button>Click</button>

// ✅ Always include focus handling
<button className="focus-ring">Click</button>
```

### ❌ Tightly Coupled Components

```typescript
// ❌ Don't create components that depend on specific parent
<EntityTableButton />  // Only works in EntityTable

// ✅ Create flexible components
<Button />  // Works anywhere
```

---

## Extending Components

### When to Extend vs Create

**Extend when:**
- You need a new variant (color, style)
- You need a new size
- You need optional behavior (loading state, icon)
- The change is additive (doesn't break existing usage)

**Create when:**
- The component serves a fundamentally different purpose
- The API would be confusing if added to existing component
- The component is domain-specific and won't be reused

### Extension Patterns

#### 1. Add Variant

```typescript
// In Button.tsx
const variantClasses = {
  primary: "...",
  secondary: "...",
  ghost: "...",  // New variant
};
```

#### 2. Add Prop

```typescript
interface ButtonProps {
  // ... existing props
  loading?: boolean;  // New optional prop
  icon?: ReactNode;  // New optional prop
}
```

#### 3. Add Size

```typescript
// Only if truly needed and consistent with other components
const sizeClasses = {
  xs: "...",  // New size
  sm: "...",
  md: "...",
  lg: "...",
};
```

---

## Component Creation Checklist

Before creating a new UI component:

- [ ] Searched `src/components/ui/` for existing component
- [ ] Searched codebase with `grep` for similar patterns
- [ ] Confirmed it will be used in 3+ places (or is domain-specific)
- [ ] Designed API with variant/size system (if applicable)
- [ ] Uses `cn()` utility for className merging
- [ ] Accepts `className` prop for overrides
- [ ] Forwards refs (if wrapping native element)
- [ ] Extends native HTML props (if applicable)
- [ ] Includes focus states (if interactive)
- [ ] Supports disabled state (if interactive)
- [ ] Uses semantic variant names (not color names)
- [ ] Follows TypeScript interface patterns from existing components
- [ ] Added to this documentation

---

## Available Components

All components listed below are available for use. Follow the patterns documented above.

### UI Primitives (`src/components/ui/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `Button` | Clickable actions | variant, size, href |
| `IconButton` | Icon-only buttons | icon, size, variant, aria-label |
| `Badge` | Status indicators | variant, size, rounded, border, icon |
| `Card` | Content containers | padding, className |
| `Input` | Text inputs | label, error, type |
| `Select` | Select dropdowns | label, error, size |
| `Textarea` | Multiline text | label, error, rows |
| `Modal` | Dialog overlays | open, onClose, title, actions, maxWidth |
| `Alert` | Status messages | variant, dismissible, onDismiss |
| `Dropdown` | Action menus | trigger, align, onOpenChange |
| `LoadingState` | Loading indicators | message, fullPage |
| `EmptyState` | Empty data states | icon, title, description |
| `FormSection` | Form grouping | children |
| `Container` | Page width constraint | children |
| `KebabIcon` | Three-dot menu icon | className |
| `SortIcon` | Sort direction indicator | direction, className |

### Admin Components (`src/components/admin/`)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| `PageHeader` | Page titles | title, description, action |
| `FilterBar` | Filter containers | children, onClear, onApply |
| `EntityTable` | Entity lists | entities, onStatusChange, onDelete, sortBy, sortOrder, onSort |
| `UserTable` | User management | users, onRoleChange |
| `StatusBadge` | Entity status | status |
| `TagManager` | Tag CRUD | - |
| `SpotCheckList` | Entity verification | entities, onMarkChecked |
| `SortableTableHeader` | Sortable table headers | label, sortKey, currentSortBy, currentSortOrder, onSort, className |

---

## Styling Philosophy

### Design Tokens

All styling should use design tokens (CSS variables or Tailwind config), not hardcoded values:

- Colors: Use semantic tokens (`--color-primary`, `--color-error`)
- Spacing: Use scale tokens (`--spacing-sm`, `--spacing-md`)
- Typography: Use type scale tokens
- Borders: Use radius tokens

### Utility Classes

Create reusable utility classes for common patterns:

- `focus-ring`: Focus state (defined in globals.css)
- `empty-state`: Empty state container
- `action-group`: Group of action buttons

**Components should not hardcode specific colors, fonts, or spacing values.**

---

## Reference Files

### UI Components

| Component | File |
|-----------|------|
| Button | `src/components/ui/Button.tsx` |
| IconButton | `src/components/ui/IconButton.tsx` |
| Badge | `src/components/ui/Badge.tsx` |
| Card | `src/components/ui/Card.tsx` |
| Input | `src/components/ui/Input.tsx` |
| Select | `src/components/ui/Select.tsx` |
| Textarea | `src/components/ui/Textarea.tsx` |
| Modal | `src/components/ui/Modal.tsx` |
| Alert | `src/components/ui/Alert.tsx` |
| Dropdown | `src/components/ui/Dropdown.tsx` |
| LoadingState | `src/components/ui/LoadingState.tsx` |
| EmptyState | `src/components/ui/EmptyState.tsx` |
| FormSection | `src/components/ui/FormSection.tsx` |
| Container | `src/components/ui/Container.tsx` |
| KebabIcon | `src/components/ui/KebabIcon.tsx` |
| SortIcon | `src/components/ui/SortIcon.tsx` |

### Admin Components

| Component | File |
|-----------|------|
| PageHeader | `src/components/admin/PageHeader.tsx` |
| FilterBar | `src/components/admin/FilterBar.tsx` |
| EntityTable | `src/components/admin/EntityTable.tsx` |
| UserTable | `src/components/admin/UserTable.tsx` |
| StatusBadge | `src/components/admin/StatusBadge.tsx` |
| TagManager | `src/components/admin/TagManager.tsx` |
| SpotCheckList | `src/components/admin/SpotCheckList.tsx` |
| SortableTableHeader | `src/components/admin/SortableTableHeader.tsx` |

### Utilities

| Purpose | File |
|---------|------|
| Class merge utility | `src/lib/utils.ts` (cn function) |
| Global styles | `src/app/globals.css` |

---

## Related Documentation

- **[AGENT_CONTEXT.md](./AGENT_CONTEXT.md)** - Project context and setup
- **[TRANSLATION_GUIDE.md](./TRANSLATION_GUIDE.md)** - i18n requirements (all UI text must be translated)
