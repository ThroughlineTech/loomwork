# Loomwork 2.1 — Project Description

## Overview

**Loomwork** is an open-source, content-first web publishing framework built on [Astro](https://astro.build). It turns MDX files into fast, beautiful websites — deployed automatically to Cloudflare Pages on every `git push`.

Loomwork is designed for **authors and small teams** who want full control over their publishing stack without wrestling with complex CMS platforms. You write Markdown, pick a theme, push to GitHub, and your site is live in 30 seconds.

### What Makes Loomwork Different

- **10 built-in themes** with dark mode, custom fonts, and one-line switching
- **Reader Controls** — visitors choose dark/light mode, font size, content width, focus mode, and TOC display
- **Multiple page templates** — default, landing, guide, tool, and longform (split-panel deep dives)
- **Zero-flash theme loading** — `document.write()` based FOUC prevention ensures the correct theme CSS loads before the browser ever paints
- **Mobile editor (PWA)** — create and publish content from your phone, no app store required
- **Fork-and-go** — fork the repo, edit `site.config.ts`, push. You have a site.

## Architecture

```
┌─ Loomwork Repo ───────────────────────────────────────────┐
│                                                           │
│  src/site.config.ts          Site identity & nav (yours)  │
│  src/content.config.ts       Content schemas (framework)  │
│                                                           │
│  src/content/pages/*.mdx     Your content                 │
│  src/content/posts/*.mdx     Blog posts (optional)        │
│                                                           │
│  src/layouts/                                             │
│  ├── Base.astro              Root HTML shell               │
│  ├── Content.astro           Standard page layout          │
│  └── Longform.astro          Split-panel deep dives        │
│                                                           │
│  src/components/             Astro + React components      │
│  src/styles/                 global.css, themes.css, site  │
│  src/themes/_index.ts        Theme registry                │
│  public/themes/*.css         10 theme stylesheets          │
│                                                           │
│  src/pages/mobile/           Mobile editor (PWA)           │
│  src/components/mobile/      Mobile editor components      │
│                                                           │
└───────────────────────────────────────────────────────────┘
        │ git push
        ▼
  Cloudflare Pages → yoursite.com (auto-deploy in ~30s)
```

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | **Astro 5** (SSG + Cloudflare adapter) |
| Content | **MDX** via Astro Content Collections + **Zod** schemas |
| Styling | **CSS custom properties** — themes override variables, no build step |
| Hosting | **Cloudflare Pages** — auto-deploy on push, edge delivery |
| Mobile editor | **React PWA** (served at `/mobile`) |
| Reader prefs | **localStorage** → data attributes on `<html>` → CSS responds |

## Theme System

Loomwork ships 10 themes, each a standalone CSS file in `public/themes/`:

| Theme | Tagline |
|-------|---------|
| **Manuscript** | The best article you've ever read |
| **Brutalist** | No decoration. No apology |
| **Atelier** | Space to breathe |
| **Terminal** | ssh into my website |
| **Gazette** | Above the fold |
| **Alpine** | Ship it |
| **Campfire** | Pull up a chair |
| **Moonrise** | After dark |
| **Field Notes** | Properly cited |
| **Neon** | Turn it up |

Each theme defines:
- Color palette (light + dark mode via `@media (prefers-color-scheme)` and `[data-dark="true"]`)
- Typography (font families, leading, scale)
- Layout variables (content width, border radius)
- Google Fonts URL

Themes are selected in `site.config.ts` and can be overridden by readers via the theme picker in Reader Controls.

### FOUC Prevention

Theme loading uses a `document.write()` approach to eliminate flash of unstyled/wrong-themed content:

1. A `<meta id="lw-defaults">` tag carries the site's default theme name and fonts URL (build-time values)
2. A `<script id="lw-theme-map">` JSON block contains the full theme registry
3. An inline `<script>` in `<head>` reads localStorage for the user's preference, resolves the correct theme, and uses `document.write()` to emit the `<link>` tags
4. The browser treats `document.write` output as render-blocking — it won't paint until the correct theme CSS loads
5. A `<noscript>` fallback provides the default theme for JS-disabled users

This means the wrong stylesheet is **never fetched** — not even briefly.

## Page Templates

Templates are declared in frontmatter (`template: "longform"`) and routed in `[...slug].astro`:

| Template | Layout | Description |
|----------|--------|-------------|
| **default** | Content.astro | Standard article with optional TOC |
| **landing** | Content.astro | Full-width hero section, no sidebar |
| **guide** | Content.astro | Two-column with persistent TOC sidebar |
| **tool** | Content.astro | Utility page (calculators, references) |
| **longform** | Longform.astro | Split-panel: fixed sidebar index + scrollable content |

### Longform Template

The longform template is designed for deep dives, essays, and multi-part series:

- **Desktop**: 260px fixed sidebar listing sibling articles in the same section + wide scrollable content area
- **Mobile**: Collapsible article index above the content
- **Scroll containment**: Body has `overflow: hidden`; only the content panel scrolls
- **No footer**: Maximizes reading space
- Pages are grouped by `section` in frontmatter; sidebar is auto-generated from siblings

## Reader Controls

A floating panel (toggled via gear button) that lets readers customize their experience:

| Control | Values | Storage |
|---------|--------|---------|
| **Dark/Light mode** | Auto (OS) / Dark / Light | `data-dark` attribute |
| **Font size** | xs / sm / md / lg / xl | `data-font-size` attribute |
| **TOC display** | Full / Numbered / Hidden | `data-toc` attribute |
| **Content width** | Default / Wide / Full | `data-width` attribute |
| **Zen mode** | On / Off | `data-zen` attribute |
| **Theme** | Any of the 10 built-in themes | Theme CSS + fonts swap |

All preferences persist in localStorage under the key `lw-reader` and are applied synchronously in `<head>` before any paint via an inline script.

The dark mode toggle correctly detects the **current visual state** (explicit preference or OS-level `prefers-color-scheme`) so the first click always does the right thing.

## Table of Contents — Three-State Display

The TOC component renders four DOM variants (desktop full, desktop numbered, mobile full, mobile numbered) and CSS shows/hides based on the `data-toc` attribute:

- **Full**: Standard heading list with anchor links
- **Numbered**: Compact clickable number pills (1, 2, 3…) — minimal footprint
- **Hidden**: TOC is removed entirely

## Content Schema

### Pages (`src/content/pages/`)

```typescript
{
  title: string;                                            // required
  description: string;                    // max 160 chars  // required
  section: string;                                          // optional
  nav_title: string;                                        // optional
  nav_order: number;                      // default: 100
  parent: string;                                           // optional
  hero_image: string;                                       // optional
  hero_alt: string;                                         // optional
  template: "default"|"landing"|"guide"|"tool"|"longform";  // default: "default"
  draft: boolean;                         // default: false
  date_created: Date;                                       // optional
  date_updated: Date;                                       // optional
  tags: string[];                         // default: []
  og_image: string;                                         // optional
  canonical: string;                      // URL            // optional
  noindex: boolean;                       // default: false
}
```

### Posts (`src/content/posts/`)

```typescript
{
  title: string;                                            // required
  description: string;                    // max 160 chars  // required
  date: Date;                             // required, coerced
  author: string;                         // default: "Dan"
  tags: string[];                         // default: []
  hero_image: string;                                       // optional
  hero_alt: string;                                         // optional
  draft: boolean;                         // default: false
  og_image: string;                                         // optional
}
```

## File Structure

```
loomwork/
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── wrangler.toml                        # Cloudflare config
│
├── docs/                                # Project documentation
│   ├── PROJECT.md                       # ← you are here
│   ├── CHANGELOG-PROMPT.md              # Agent prompt for updating progress pages
│   ├── CSS-ARCHITECTURE.md              # Cascade order, specificity, variable reference
│   ├── MIGRATION.md                     # Adopting Loomwork from scratch
│   ├── MOBILE_PROJECT.md
│   ├── MOBILE_README.md
│   ├── UPGRADE.md
│   ├── UPGRADE-PROMPT.md
│   └── VERIFICATION_AGENT_PROMPT.md
│
├── public/
│   ├── _redirects
│   ├── favicon.svg                     # Site favicon (loom mark)
│   ├── icons/                           # Homepage feature icons (site file)
│   │   ├── controls.svg
│   │   ├── fork.svg
│   │   ├── loom.svg
│   │   ├── mobile.svg
│   │   ├── templates.svg
│   │   ├── themes.svg
│   │   └── zeroflash.svg
│   ├── images/
│   ├── mobile/                          # PWA assets
│   │   ├── manifest.json
│   │   └── sw.js
│   └── themes/                          # 10 theme CSS files
│       ├── manuscript.css
│       ├── brutalist.css
│       ├── atelier.css
│       ├── terminal.css
│       ├── gazette.css
│       ├── alpine.css
│       ├── campfire.css
│       ├── moonrise.css
│       ├── fieldnotes.css
│       └── neon.css
│
└── src/
    ├── site.config.ts                   # YOUR config (name, nav, theme)
    ├── content.config.ts                # Content schemas (framework file)
    │
    ├── content/
    │   ├── pages/                       # Site content (file path = URL)
    │   │   ├── about_Loomwork.mdx
    │   │   ├── building.mdx
    │   │   ├── guide.mdx
    │   │   ├── mobile-app.mdx
    │   │   ├── page-types.mdx
    │   │   ├── progress.mdx             # Running changelog
    │   │   ├── reader-controls.mdx
    │   │   ├── theming.mdx
    │   │   └── deep-dives/              # Longform section
    │   │       ├── what-is-longform.mdx
    │   │       ├── designing-for-focus.mdx
    │   │       └── campfire-2-retro.mdx
    │   └── posts/                       # Blog (optional, currently empty)
    │
    ├── layouts/
    │   ├── Base.astro                   # Root HTML shell + FOUC prevention
    │   ├── Content.astro                # Standard page layout
    │   └── Longform.astro               # Split-panel deep dive layout
    │
    ├── components/
    │   ├── Header.astro                 # Site file — customize freely
    │   ├── Footer.astro                 # Site file — customize freely
    │   ├── Callout.astro                # Admonitions (info/warning/tip/danger)
    │   ├── DemoControl.astro
    │   ├── ReaderControls.astro         # Floating preferences panel + all JS
    │   ├── ReadingEnhancements.astro
    │   ├── TableOfContents.astro        # Three-state TOC (full/numbered/hidden)
    │   ├── ThemePicker.astro
    │   ├── YouTube.astro
    │   └── mobile/                      # Mobile editor (React PWA)
    │       ├── MobileApp.tsx
    │       ├── github.ts
    │       ├── mdx.ts
    │       ├── storage.ts
    │       └── mobile.css
    │
    ├── pages/
    │   ├── index.astro                  # Home page
    │   ├── 404.astro
    │   ├── [...slug].astro              # Dynamic route (template → layout)
    │   └── mobile/
    │       └── index.astro              # Mobile editor entry point
    │
    ├── styles/
    │   ├── global.css                   # Framework base styles
    │   ├── themes.css                   # Reader preference CSS rules
    │   └── site.css                     # Site-specific overrides (yours)
    │
    └── themes/
        └── _index.ts                    # Theme registry (name → metadata)
```

## Key Design Decisions

### Framework-file vs. site-file separation
Files are clearly marked. `site.config.ts`, `site.css`, `Header.astro`, `Footer.astro`, and everything in `content/` are yours. Everything else is a framework file — upstream `git merge loomwork/main` updates them cleanly without conflicts.

For a deep dive on CSS specificity, cascade order, and how to write `site.css`
correctly, see [CSS-ARCHITECTURE.md](CSS-ARCHITECTURE.md).

### CSS custom properties for theming
Themes override CSS variables on `:root`. This means:
- No build step for theme switching
- Runtime theme changes are instant (swap the `<link>` href)
- Dark mode is a second set of variable overrides — same mechanism, no duplication
- Site authors can override any variable in `site.css`
- See [CSS-ARCHITECTURE.md](CSS-ARCHITECTURE.md) for cascade order, specificity details, and the canonical variable reference table

### Data attributes for reader preferences
Using `data-*` attributes on `<html>` (rather than classes or inline styles) because:
- CSS can target them with attribute selectors — no JS needed after the initial set
- They're set synchronously in `<head>` before any paint
- No specificity wars — `[data-dark="true"]` is clean and predictable

### document.write() for FOUC prevention
Controversial but correct. The alternatives (bake default + swap, visibility:hidden, preload all themes) all have edge cases that cause flashes. `document.write()` in an inline `<head>` script is the only approach that guarantees the browser never fetches the wrong stylesheet.

### Longform as a first-class template
Long-form content needs different UX: persistent navigation, scroll containment, no distractions. Rather than bolt this onto the standard layout, it gets its own layout file (`Longform.astro`) with purpose-built CSS.

## Mobile Editor

Loomwork includes a **Progressive Web App** at `/mobile` for on-the-go content editing. See [MOBILE_PROJECT.md](MOBILE_PROJECT.md) for full details.

Key points:
- Talks directly to the GitHub API (no custom backend)
- Authenticates via GitHub Personal Access Token
- Installable to home screen on iOS/Android
- Bundled in the repo — updates with the framework automatically

## Deployment

1. Fork the Loomwork repo
2. Edit `src/site.config.ts` (name, nav, theme)
3. Connect to Cloudflare Pages (or any static host)
4. Push to GitHub → auto-deploy in ~30 seconds

Build command: `astro build`
Output directory: `dist/`

## What's Next

| Priority | Feature | Status |
|----------|---------|--------|
| — | Longform page template | ✅ Shipped |
| — | TOC three-state display | ✅ Shipped |
| — | FOUC-free theme loading | ✅ Shipped |
| — | Dark mode toggle fix | ✅ Shipped |
| — | Callout dark mode support | ✅ Shipped |
| — | `--header-height` CSS variable | ✅ Shipped (2.1) |
| — | Header/Footer as site files | ✅ Shipped (2.1) |
| — | Homepage feature rotator + SVG icons | ✅ Shipped (2.1) |
| — | Progress/changelog page | ✅ Shipped (2.1) |
| — | CSS Architecture documentation | ✅ Shipped (2.1) |
| Next | D-pad navigation bar | Deferred |
| Future | E2E tests (Playwright) | Planned |
| Future | GitHub Actions CI (build + check) | Planned |
| Future | Visual regression testing | Planned |
