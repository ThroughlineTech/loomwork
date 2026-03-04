# CSS Architecture

How Loomwork's stylesheets cascade, what each file does, and how to write
site-specific CSS that works with themes and dark mode.

---

## Cascade Order

Stylesheets load in this order. Later files override earlier ones.

| # | File | Specificity of `:root` block | Purpose |
|---|------|------------------------------|---------|
| 1 | `global.css` | **0,0,0** (`:where(:root)`) | Framework defaults — colors, fonts, spacing, reset |
| 2 | `themes.css` | n/a (attribute selectors) | Reader preference rules (`[data-dark]`, `[data-font-size]`, etc.) |
| 3 | `[theme].css` | **0,1,0** (`:root`) | Theme palette — loaded at runtime via `document.write()` |
| 4 | `site.css` | **0,1,0** (`:root`) | Your site-specific overrides and component styles |

### Why this matters

- `global.css` uses `:where(:root)` which has **zero** specificity. Any theme
  or site override wins automatically.
- Theme CSS and `site.css` both use plain `:root`, giving them **equal**
  specificity (0,1,0). Since `site.css` loads last, it wins by source order.
- This means: if you define `--color-bg` in your `site.css :root` block, it
  will **override the theme** — and theme switching will appear broken for that
  variable. Only put variables in `site.css :root` if you intentionally want to
  pin them across all themes.

---

## What Goes Where

### `global.css` (framework — do not edit)

- CSS reset, box model, base typography
- Default variable values at `:where(:root)` specificity
- Body layout (flex column, min-height)
- Longform body lock (`.body--longform`)
- Prose styles, utility classes
- Framework component base styles

### `themes.css` (framework — do not edit)

- Reader preference CSS rules driven by `data-*` attributes on `<html>`
- Dark mode: `[data-dark="true"]`, `[data-dark="false"]`
- Font size: `[data-font-size="xs"]` through `[data-font-size="xl"]`
- Content width: `[data-width="wide"]`, `[data-width="full"]`
- Zen mode: `[data-zen="true"]`

### `[theme].css` (e.g. `manuscript.css`, `campfire.css`)

Each theme file defines:
- Full color palette (`:root` block)
- Dark mode colors (`@media (prefers-color-scheme: dark)` + `[data-dark="true"]`)
- Font families, type scale adjustments
- Google Fonts URL (loaded by the FOUC-prevention script)

### `site.css` (yours — edit freely)

This is where all your site-specific styles live:
- **Optional `:root` overrides** — accent color tweaks, header height, signal colors
- **Component styles** — homepage hero, cards, case studies, custom sections
- **Layout overrides** — header, footer, page-specific rules
- **Animations and transitions**

---

## Writing `site.css` Correctly

### The `:root` block — keep it small

The theme provides a complete design system. Your `:root` block should only
contain:

```css
:root {
  /* Brand accent override (optional — theme has a default) */
  --color-accent:       #2d6a4f;
  --color-accent-hover: #1b4332;

  /* Header height override (if your header is taller than 4rem) */
  --header-height: 5rem;

  /* Site-specific signal or utility colors */
  --signal-green: #34d399;
  --signal-amber: #fbbf24;
}
```

**Do NOT** put these in your `:root` block (the theme provides them):
- `--color-bg`, `--color-bg-alt`, `--color-surface`
- `--color-text`, `--color-text-muted`
- `--color-border`, `--color-code-bg`
- `--font-body`, `--font-heading`, `--font-mono`
- `--text-base`, `--text-sm`, `--text-lg`, etc.
- `--space-*`, `--content-width`, `--wide-width`

If you define these, they will override the theme and break theme switching.

### Use CSS variables, not hardcoded colors

```css
/* ✅ Good — respects themes and dark mode */
.hero { background: var(--color-bg-alt); color: var(--color-text); }
.card { border: 1px solid var(--color-border); }
.cta  { background: var(--color-accent); color: white; }

/* ❌ Bad — breaks in dark mode and ignores theme */
.hero { background: #f5f5f0; color: #1a1a1a; }
.card { border: 1px solid #e0e0e0; }
.cta  { background: #2d6a4f; }
```

### Shadows

Use `var(--shadow-sm)` and `var(--shadow-md)` from the theme. If you need
custom shadows, use `color-mix()` or transparent black that works in both
light and dark modes:

```css
/* ✅ Works in light and dark mode */
.card { box-shadow: var(--shadow-md); }
.elevated { box-shadow: 0 4px 20px color-mix(in srgb, var(--color-text) 10%, transparent); }

/* ❌ Visible halo in dark mode */
.card { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
```

### Frosted glass / translucent backgrounds

Use `color-mix()` instead of hardcoded `rgba()`:

```css
/* ✅ Adapts to theme and dark mode */
.nav { background: color-mix(in srgb, var(--color-bg) 92%, transparent); }

/* ❌ Wrong color in dark mode */
.nav { background: rgba(253, 252, 250, 0.92); }
```

---

## Dark Mode

Themes handle dark mode via two mechanisms:

1. **`@media (prefers-color-scheme: dark)`** — OS-level preference
2. **`[data-dark="true"]`** — explicit user toggle via reader controls

Both set the same CSS variables to dark values. Your site CSS doesn't need
dark-mode media queries **if you use CSS variables everywhere**. The theme
swaps the variable values and all your styles update automatically.

**When you DO need dark mode rules:** Only if you have hardcoded colors that
can't be replaced with variables (e.g., SVG fills, gradient stops). In that
case, duplicate the selectors:

```css
.brand-gradient {
  background: linear-gradient(135deg, #2d6a4f, #1b4332);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-dark="false"]) .brand-gradient {
    background: linear-gradient(135deg, #34d399, #059669);
  }
}
[data-dark="true"] .brand-gradient {
  background: linear-gradient(135deg, #34d399, #059669);
}
```

---

## Header Height

The framework defines `--header-height: 4rem` in `global.css`. The Longform
layout uses this variable for `height: calc(100vh - var(--header-height))`.

If your site has a custom Header with a different height:

```css
:root {
  --header-height: 5rem; /* or whatever your header measures */
}
```

If your header uses `position: fixed` (instead of the framework default
`position: sticky`), you may also need:

```css
main {
  padding-top: var(--header-height);
}
```

The framework's default Header uses `position: sticky`, which doesn't need
padding-top because it participates in normal document flow.

---

## `fonts_url` in `site.config.ts`

The `fonts_url` field controls which Google Fonts stylesheet is loaded.
The precedence is:

1. If `fonts_url` is set to a URL → that URL is used (theme fonts ignored)
2. If `fonts_url` is `""` (empty string) → theme's built-in fonts load
3. If `fonts_url` is not set at all → theme's built-in fonts load

**Important:** If your pre-2.0 config had `fonts_url` pointing to custom
Google Fonts, it will **override the theme's font choices**. Set it to `""`
to let the theme control fonts, or keep it if you intentionally want your
own fonts regardless of theme.

---

## Canonical CSS Variable Reference

Every variable below is defined in `global.css` at `:where(:root)` specificity
and overridden by themes. Use these in `site.css` — they are guaranteed stable.

### Colors

| Variable | Default | Purpose |
|----------|---------|---------|
| `--color-bg` | `#fafaf9` | Page background |
| `--color-bg-alt` | `#f3f2ee` | Alternate background (hero, aside) |
| `--color-surface` | `#ffffff` | Card/panel background |
| `--color-text` | `#1c1917` | Primary text |
| `--color-text-muted` | `#57534e` | Secondary/subtle text |
| `--color-accent` | `#b45309` | Links, buttons, brand color |
| `--color-accent-hover` | `#92400e` | Accent hover state |
| `--color-accent-light` | `#fef3c7` | Light accent (badges, tags) |
| `--color-border` | `#d6d3d1` | Borders, dividers |
| `--color-code-bg` | `#1c1917` | Code block background |

### Typography

| Variable | Default | Purpose |
|----------|---------|---------|
| `--font-body` | system-ui, sans-serif | Body text font |
| `--font-heading` | system-ui, sans-serif | Heading font |
| `--font-mono` | ui-monospace | Code font |
| `--text-base` | `1.1875rem` | Base font size |
| `--text-sm` | `0.9375rem` | Small text |
| `--text-lg` | `1.3125rem` | Large text |
| `--text-xl` | `1.5rem` | Extra large text |
| `--text-2xl` | `1.875rem` | 2x large text |
| `--text-3xl` | `2.5rem` | 3x large text |
| `--leading` | `1.7` | Line height |

### Spacing

| Variable | Default | Purpose |
|----------|---------|---------|
| `--space-xs` | `0.25rem` | Tight spacing |
| `--space-sm` | `0.5rem` | Small spacing |
| `--space-md` | `1rem` | Medium spacing |
| `--space-lg` | `1.5rem` | Large spacing |
| `--space-xl` | `2.5rem` | Section spacing |
| `--space-2xl` | `4rem` | Major section spacing |

### Layout

| Variable | Default | Purpose |
|----------|---------|---------|
| `--content-width` | `52rem` | Standard content max-width |
| `--wide-width` | `72rem` | Wide content max-width |
| `--full-width` | `90rem` | Full-width max-width |
| `--header-height` | `4rem` | Height of the site header |

### Misc

| Variable | Default | Purpose |
|----------|---------|---------|
| `--radius` | `0.375rem` | Border radius |
| `--shadow-sm` | `0 1px 2px …` | Subtle shadow |
| `--shadow-md` | `0 4px 12px …` | Medium shadow |
| `--transition` | `150ms ease` | Default transition timing |

---

## Common Migration Patterns

When migrating from a pre-theme Loomwork site (or any site) to 2.0+, you may
have CSS that uses non-standard variable names. Common mappings:

| Old variable | Loomwork standard |
|-------------|-------------------|
| `--ink` | `--color-text` |
| `--ink-light` | `--color-text` |
| `--ink-muted` | `--color-text-muted` |
| `--warm-cream` | `--color-bg` |
| `--stone-50` | `--color-surface` |
| `--stone-100` | `--color-bg-alt` |
| `--stone-200` | `--color-border` |
| `--stone-300` | `--color-text-muted` |
| `--stone-400` | `--color-text-muted` |
| `--stone-500` | `--color-text-muted` |
| `--accent` | `--color-accent` |
| `--accent-light` | `--color-accent-light` |
| `--font-display` | `--font-heading` |

Use `sed` to do these replacements mechanically:

```bash
sed -i \
  -e 's/var(--ink-light)/var(--color-text)/g' \
  -e 's/var(--ink-muted)/var(--color-text-muted)/g' \
  -e 's/var(--ink)/var(--color-text)/g' \
  -e 's/var(--warm-cream)/var(--color-bg)/g' \
  -e 's/var(--stone-50)/var(--color-surface)/g' \
  -e 's/var(--stone-100)/var(--color-bg-alt)/g' \
  -e 's/var(--stone-200)/var(--color-border)/g' \
  -e 's/var(--stone-300)/var(--color-text-muted)/g' \
  -e 's/var(--stone-400)/var(--color-text-muted)/g' \
  -e 's/var(--stone-500)/var(--color-text-muted)/g' \
  -e 's/var(--accent-light)/var(--color-accent-light)/g' \
  -e 's/var(--accent)/var(--color-accent)/g' \
  -e 's/var(--font-display)/var(--font-heading)/g' \
  src/styles/site.css
```

> **Order matters:** Replace `--ink-light` and `--ink-muted` before `--ink`,
> and `--accent-light` before `--accent`, to avoid partial matches.

After running the replacement, remove any `:root` block in `site.css` that
redefines theme-provided variables. Keep only brand-specific overrides
(`--color-accent`, `--header-height`, custom signal colors).
