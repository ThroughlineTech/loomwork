# Loomwork Features — Implementation Proposal

**Date:** March 3, 2026
**Status:** Draft — Awaiting Review

---

## Overview

This proposal covers the implementation plan for the three features described in [FEATURES.md](FEATURES.md). Each feature is broken into phases with specific file changes, estimated complexity, and dependencies called out.

---

## Feature 1: TOC Three-State Display

**Current state:** The TOC has two modes — visible (default) and hidden (`data-toc="hidden"` on `<html>`). The ReaderControls panel has a simple on/off toggle for it.

### What changes

| File | Change |
|------|--------|
| [src/components/TableOfContents.astro](src/components/TableOfContents.astro) | Add a third rendering mode: "numbered" — a compact strip of clickable section numbers (1, 2, 3…) derived from the existing `toc` array. All three states render in the markup; CSS controls which is visible. |
| [src/styles/themes.css](src/styles/themes.css) | Add `[data-toc="numbered"]` rules alongside the existing `[data-toc="hidden"]` rules. The numbered state hides the full TOC and shows the compact number strip. Also handle the guide grid column collapse for the numbered state. |
| [src/components/ReaderControls.astro](src/components/ReaderControls.astro) | Replace the on/off pill toggle (`data-rc-toc`) with a three-way chip selector: **On** / **Numbered** / **Off**, matching the existing width chip pattern (`rc__chips`). Update the JS to cycle through `"visible"` → `"numbered"` → `"hidden"` and persist to `localStorage`. |
| [src/layouts/Base.astro](src/layouts/Base.astro) | Update the FOUC-prevention inline script to handle `data-toc="numbered"` in addition to `"hidden"`. |

### Approach

- Use a `data-toc` attribute with three values: (empty/unset = expanded), `"numbered"`, `"hidden"`.
- The numbered strip is a simple `<ol>` of anchor links rendered inside the existing TOC component, always present in the DOM but shown/hidden via CSS.
- Desktop sidebar: numbered mode collapses the sidebar to a narrow numbered column. Mobile: numbered mode shows a slim horizontal number bar instead of the dropdown.

### Complexity: Low-Medium

Mostly CSS + a small JS change in the reader controls script. No new components needed.

---

## Feature 2a: Separate Reader Controls from the D-Pad

**Current state:** The ReaderControls component is a single floating button (bottom-right) that opens a settings panel. There is no separate "D-pad" navigation bar — the ReaderControls toggle *is* the floating element. The ReadingEnhancements component (progress bar + back-to-top) is separate.

### What changes

This feature is about **establishing the separation** so that when a D-pad navigation bar is introduced, reader controls don't live inside it.

| File | Change |
|------|--------|
| [src/components/ReaderControls.astro](src/components/ReaderControls.astro) | No structural change needed yet — it's already a standalone floating element. When the D-pad (Feature 2b) is built, ensure controls remain their own component and are not merged into the nav bar. |
| [src/layouts/Base.astro](src/layouts/Base.astro) | Ensure ReaderControls and the future nav bar are sibling elements, not nested. |

### Complexity: Low

This is primarily an architectural constraint to enforce during Feature 2b, not standalone work. Document it as a design rule.

---

## Feature 2b: Draggable D-Pad Navigation Bar

**Current state:** No dedicated navigation bar exists at the bottom of the screen. The floating ReaderControls button is the only fixed element (besides progress bar and back-to-top).

### What changes

| File | Change |
|------|--------|
| **New:** `src/components/NavBar.astro` | A new floating navigation bar component. Contains prev/next page navigation, possibly a TOC trigger, and any other navigation affordances. Initially positioned at bottom-center. |
| `src/components/NavBar.astro` (script) | Client-side drag logic: `pointerdown` → `pointermove` → `pointerup` with `position: fixed` and `translate()`. Persist last position to `localStorage` so it survives page reloads. Clamp to viewport bounds. |
| [src/layouts/Base.astro](src/layouts/Base.astro) | Conditionally render `<NavBar />` (likely gated by a new `site.config.ts` option or tied to `reader_controls`). |
| [src/styles/themes.css](src/styles/themes.css) | z-index coordination: NavBar at `z-index: 190`, ReaderControls stays at `200`, progress bar at `999`. |
| [src/site.config.ts](src/site.config.ts) | Optional: add a `nav_bar: true` config flag. |

### Approach

- Use the Pointer Events API for drag (works on touch + mouse).
- Small drag threshold (5px) to distinguish taps from drags.
- Snap-to-edge option: after drag ends, animate to nearest screen edge (optional, could be a v2 nicety).
- The bar should be compact — a pill-shaped element with 2–4 icon buttons.
- On mobile, default position is bottom-center. On desktop, bottom-center or bottom-right.

### Complexity: Medium

New component with non-trivial interaction (drag + persist + clamp). The drag logic itself is ~40 lines of JS but needs careful touch handling and edge-case testing (e.g., rotate device, resize window).

### Open Questions

1. What navigation actions go in the D-pad? Prev/next page? TOC trigger? Home?
2. Should the bar auto-hide after inactivity (like video player controls)?
3. Should it snap to edges or stay wherever you drop it?

---

## Feature 3: Long-Form / Blog Page Type

**Current state:** Loomwork has two content collections — `pages` and `posts`. Pages support templates: `default`, `landing`, `guide`, `tool`. Posts exist in the schema but no listing page or dedicated layout is built yet.

### What changes

This is the largest feature. It introduces a new visual paradigm — a split-panel single-page view for long-form content.

### Phase 3A: Content & Schema

| File | Change |
|------|--------|
| [src/content.config.ts](src/content.config.ts) | Add `"longform"` to the page template enum: `z.enum(["default", "landing", "guide", "tool", "longform"])` — OR — create a new dedicated collection `longform` if these articles should be separate from pages. **Recommendation:** Start with a new template value on the existing `pages` collection to avoid routing changes. |
| **New content files** | e.g., `src/content/pages/blog/campfire-2-retrospective.mdx` with `template: "longform"` |

### Phase 3B: Layout

| File | Change |
|------|--------|
| **New:** `src/layouts/Longform.astro` | The split-panel layout. Wraps `Base.astro`. Renders a left sidebar with article titles and a right content panel. |
| [src/layouts/Content.astro](src/layouts/Content.astro) | Add a branch: `if template === "longform"` → delegate to `Longform.astro` or render the longform variant inline. |
| [src/pages/[...slug].astro](src/pages/%5B...slug%5D.astro) | May need to pass additional props (sibling articles in the same section) so the sidebar can list them. |

### Phase 3C: Longform Layout Detail

```
┌─────────────────────────────────────────────────────┐
│  Header (site header, compact)                       │
├──────────────┬──────────────────────────────────────┤
│              │                                      │
│  Article     │   Selected Article Content            │
│  Index       │                                      │
│              │   - Title                             │
│  ● Title 1   │   - Body (MDX rendered)              │
│    Title 2   │   - Scrollable if overflows           │
│    Title 3   │                                      │
│    Title 4   │                                      │
│              │                                      │
│  (scrollable)│                  (wide, viewport-fit) │
├──────────────┴──────────────────────────────────────┤
│  Footer (minimal or hidden)                          │
└─────────────────────────────────────────────────────┘
```

**Desktop:**
- Left panel: ~20-25% width. Fixed/sticky. Lists all longform articles in the section. Active article highlighted. Scrollable if many entries.
- Right panel: ~75-80% width. Fills viewport height (`height: calc(100vh - header)`). `overflow-y: auto` for content that exceeds the viewport.

**Mobile:**
- Title index becomes a collapsible drawer or horizontal scrollable tab bar at the top.
- Content fills the rest of the screen.

### Phase 3D: Styles

| File | Change |
|------|--------|
| [src/styles/global.css](src/styles/global.css) | Add longform layout variables: `--longform-sidebar-width`, `--longform-content-max-width`. |
| **New:** `src/styles/longform.css` (or inline in layout) | Grid/flex layout for the split panel. Viewport-height constraints. Scroll containers. Responsive breakpoint at 960px (matching existing TOC breakpoint). |

### Phase 3E: Navigation / Article Switching

- On desktop, clicking a title in the left panel loads that article's content in the right panel.
- **Option A (simpler, recommended for v1):** Each article is its own route (`/blog/article-slug`). The sidebar is a nav with links. Standard Astro page transitions. Server-rendered, zero client JS.
- **Option B (SPA-like):** All articles are embedded on one page and switching is client-side (show/hide or scroll-to). Requires loading all article HTML upfront — heavier but matches the "single page" spec.
- **Recommendation:** Start with **Option A** for simplicity. The sidebar persists across pages via the shared layout, giving the feel of a single-page app without the complexity. Revisit Option B if the experience doesn't feel right.

### Complexity: Medium-High

New layout, new CSS, content querying logic, responsive considerations. The core is straightforward Astro (it's a layout + query), but the viewport-fitting and scroll containment need careful CSS work.

### Open Questions

1. **Option A vs B:** Real single page (all content loaded) or linked pages with a persistent sidebar?
2. **Article ordering:** By date? Manual `nav_order`? Frontmatter field?
3. **Section grouping:** Should longform articles be grouped by topic/section, or one flat list?
4. **Mobile article switching:** Drawer, tabs, or dropdown?

---

## Recommended Build Order

```
1.  Feature 1   — TOC three-state          (small, self-contained)
2.  Feature 2a  — Controls separation       (architectural, minimal code)
3.  Feature 2b  — Draggable nav bar         (medium, new component)
4.  Feature 3A  — Longform schema           (small, schema-only)
5.  Feature 3B  — Longform layout skeleton  (medium, layout + CSS)
6.  Feature 3C  — Longform responsive       (medium, CSS + testing)
7.  Feature 3D  — Longform article nav      (depends on Option A/B decision)
```

Features 1 and 2 are independent and can be done in parallel. Feature 3 has an internal dependency chain (schema → layout → styles → nav).

---

## Files Touched (Summary)

| File | Features |
|------|----------|
| `src/components/TableOfContents.astro` | 1 |
| `src/components/ReaderControls.astro` | 1, 2a |
| `src/layouts/Base.astro` | 1, 2a, 2b |
| `src/styles/themes.css` | 1, 2b |
| `src/site.config.ts` | 2b |
| **New:** `src/components/NavBar.astro` | 2b |
| `src/content.config.ts` | 3 |
| **New:** `src/layouts/Longform.astro` | 3 |
| `src/layouts/Content.astro` | 3 |
| `src/pages/[...slug].astro` | 3 |
| `src/styles/global.css` | 3 |
| **New:** `src/styles/longform.css` | 3 |
