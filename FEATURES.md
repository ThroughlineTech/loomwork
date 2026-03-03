# Loomwork Framework — Planned Features

## 1. Table of Contents: Three Display Modes

The Table of Contents (TOC) component should support **three states** that the user can cycle through:

| Mode | Behavior |
|------|----------|
| **Expanded** | Full TOC is visible with heading text and links |
| **Collapsed (numbered)** | Minimal indicator — just section numbers are shown, so the reader knows TOC entries exist and can jump to them |
| **Hidden** | TOC is completely collapsed / not visible |

> **Open question:** Should the TOC live inside the navigation bar (see below), or remain a separate element? Consider supporting both placements.

---

## 2. Navigation Bar (D-Pad) Improvements

The floating bottom navigation bar ("D-pad") needs two changes:

### 2a. Reader Controls should NOT live in the D-pad

Reader Controls (theme, font size, mode, etc.) should be separated from the bottom navigation bar. The D-pad is for navigation only.

### 2b. Draggable positioning

The D-pad bar should be **draggable** — the user can reposition it anywhere on screen rather than being locked to the bottom. This applies to both mobile and desktop.

---

## 3. New Page Type: Long-Form / Blog View

A new page type for **long-form content** — deep dives, retrospectives, essays, etc.

### Layout

- **Desktop:** Split-panel layout
  - **Left panel:** Scrollable list of article titles (like a TOC / sidebar index)
  - **Right panel:** The selected article's content, displayed in a wide, presentation-style format (think PowerPoint slide meets blog post)
- **Mobile:** Same concept adapted to a single column — title list collapses or stacks above the content area

### Behavior

| Rule | Detail |
|------|--------|
| **Single page** | All content lives on one page (no separate routes per article) |
| **Fits the viewport** | Content fills the visible view panel by default |
| **Scrollable overflow** | If an article exceeds the viewport height, it scrolls within its own container |
| **Wide content area** | Takes up most of the page width, especially on desktop — optimized for long reads |

### Content Examples

- Deep dives and retrospectives (e.g., "Why Campfire 2 failed and what we learned from the time invested")
- Essays and opinion pieces
- Project post-mortems and lessons learned

### Relationship to Existing Content

This page type is **additive** — it exists alongside the current page types and the repo-managed content (pages/posts with public/private workflows). It does not replace anything.

---

## Summary

| # | Feature | Status |
|---|---------|--------|
| 1 | TOC: three display modes (expanded → numbered → hidden) | Planned |
| 2a | Remove Reader Controls from the D-pad bar | Planned |
| 2b | Make the D-pad bar draggable | Planned |
| 3 | New long-form / blog page type with split-panel layout | Planned |
