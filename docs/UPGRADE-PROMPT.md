# Loomwork Upgrade Prompt

Use this prompt to instruct an agent to upgrade a loomwork-based site to the
latest framework version. This is the prompt consumed by the "Upgrade Demo Site"
GitHub Action, and can be given to any coding agent working in a site repo.

---

## Prompt

Your task is to upgrade this site to the latest version of the loomwork
framework. Follow these steps exactly — do not skip steps or improvise.

### Phase 1: Merge Framework Code

#### 1. Add the loomwork remote if missing

```bash
git remote get-url loomwork 2>/dev/null || git remote add loomwork https://github.com/danrichardson/loomwork.git
git fetch loomwork
```

#### 2. Merge loomwork/main

```bash
git merge loomwork/main --no-edit || true
```

If there are no conflicts, skip to step 4.

#### 3. Resolve conflicts

Check for conflicts:

```bash
git diff --name-only --diff-filter=U
```

Resolve each conflicted file using these rules (run the commands directly —
do not read or manually edit conflicted files):

**Site files — keep ours:**
```bash
for f in README.md src/site.config.ts src/styles/site.css src/pages/index.astro src/components/Header.astro src/components/Footer.astro astro.config.mjs wrangler.toml; do
  git checkout --ours "$f" 2>/dev/null && git add "$f" 2>/dev/null
done
```

**Framework files — take theirs:**
```bash
for f in src/layouts/Base.astro src/layouts/Content.astro src/layouts/Longform.astro src/components/Callout.astro src/components/TableOfContents.astro src/components/YouTube.astro src/components/DemoControl.astro src/components/ThemePicker.astro src/components/ReaderControls.astro src/components/ReadingEnhancements.astro src/content.config.ts src/styles/global.css src/styles/themes.css src/themes/_index.ts "src/pages/[...slug].astro" src/pages/404.astro src/pages/mobile/index.astro; do
  git checkout --theirs "$f" 2>/dev/null && git add "$f" 2>/dev/null
done
```

**Dependencies — take theirs, fix name:**
```bash
git checkout --theirs package.json 2>/dev/null && git add package.json
git checkout --theirs package-lock.json 2>/dev/null && git add package-lock.json
```

**Docs — take theirs:**
```bash
git checkout --theirs docs/ 2>/dev/null && git add docs/ 2>/dev/null
```

After resolving all conflicts, check none remain:
```bash
git diff --name-only --diff-filter=U
```

If any remain, resolve them by accepting theirs:
```bash
git diff --name-only --diff-filter=U | xargs -I{} sh -c 'git checkout --theirs "{}" && git add "{}"'
```

Complete the merge:
```bash
git commit --no-edit || true
```

#### 4. Install dependencies

```bash
rm -f package-lock.json
npm install
```

#### 5. Build to verify the merge

```bash
npm run build
```

The build must succeed. Warnings about sharp, KV bindings, or empty post
directories are expected — ignore them. If the build fails, read the error
and fix it before continuing.

### Phase 2: Adopt 2.0 Features

#### 6. Enable theme and reader controls in site.config.ts

Read `src/site.config.ts`. Add or update these fields inside the SITE
object (keep all existing fields — only add/change these):

```typescript
theme: "campfire",
reader_controls: true,
```

**Critical: clear `fonts_url` so the theme controls fonts.** If `fonts_url`
exists in the file and has a URL value, change it to an empty string:

```typescript
fonts_url: "",
```

If `fonts_url` is not present, do nothing — the theme will use its own
fonts by default. But if it has a Google Fonts URL, that URL will **override
the theme's font choices** and make theme switching look broken.

#### 7. Migrate site.css to theme-compatible tokens

This step rewires site.css to use Loomwork's standard CSS variables so
themes, dark mode, and reader controls all work correctly.

**Step 7a: Remove `:root` variable blocks that fight the theme.**

Read `src/styles/site.css`. If it has a `:root` block that defines
`--color-bg`, `--color-text`, `--color-surface`, `--font-body`,
`--font-heading`, or other theme-provided variables, **delete that entire
`:root` block**. These variables are now provided by the theme.

Keep a small `:root` block only if it defines:
- Brand accent overrides (`--color-accent`, `--color-accent-hover`)
- `--header-height` (if the site header is taller than 4rem)
- Site-specific signal/utility colors (e.g. `--signal-green`)

The `:root` block should be under ~10 lines. If there is no `:root` block,
that's fine — move to step 7b.

**Step 7b: Replace non-standard variable names.**

If site.css uses old/custom variable names, replace them with Loomwork
standard names. Run this sed command (order matters — longer names first
to avoid partial matches):

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

If site.css does not contain any of these old variable names, the sed
command is a harmless no-op.

**Step 7c: Replace hardcoded colors with CSS variables.**

Search site.css and `src/pages/index.astro` for hardcoded hex colors
(e.g. `#2d6a4f`, `#f5f5f0`, `#1a1a1a`). Replace them with the nearest
CSS variable:
- Light backgrounds (`#f5f5f0`, `#fff`, `#fafafa`) → `var(--color-bg)` or `var(--color-bg-alt)`
- Dark text (`#111`, `#333`, `#1a1a1a`) → `var(--color-text)`
- Muted text (`#666`, `#888`, `#999`) → `var(--color-text-muted)`
- Brand/accent colors → `var(--color-accent)`
- Borders (`#ddd`, `#e0e0e0`) → `var(--color-border)`
- Hardcoded rgba() backgrounds → `color-mix(in srgb, var(--color-bg) 92%, transparent)`

This ensures the site respects themes and dark mode.

See `docs/CSS-ARCHITECTURE.md` for the complete variable reference table
and detailed guidance on shadows, frosted glass, and dark mode patterns.

#### 8. Delete loomwork placeholder content

```bash
rm -f src/content/pages/about_Loomwork.mdx
rm -f src/content/pages/guide.mdx
rm -f src/content/pages/mobile-app.mdx
rm -f src/content/pages/building.mdx
rm -f src/content/pages/theming.mdx
rm -f src/content/pages/page-types.mdx
rm -f src/content/pages/reader-controls.mdx
rm -f src/content/pages/progress.mdx
rm -f src/content/pages/deep-dives/campfire-2-retro.mdx
rm -f src/content/pages/deep-dives/designing-for-focus.mdx
rm -f src/content/pages/deep-dives/what-is-longform.mdx
rm -f public/images/1771364152056-image.jpg
rm -rf public/icons
rm -f public/favicon.svg
```

#### 9. Add a longform demo page

Create `src/content/pages/deep-dives/about-this-site.mdx` with this exact content:

```mdx
---
title: "About This Site"
description: "How this site is built with Astro, Loomwork, and Cloudflare Pages."
section: "deep-dives"
nav_order: 50
template: "longform"
date_created: 2026-03-03
---

import Callout from "../../../components/Callout.astro";

## The Stack

This site runs on **Astro** with the **Loomwork** framework — a content-first
starter built for longform writing, case studies, and portfolio sites. It
deploys to **Cloudflare Pages** with zero server management.

The design philosophy: write in Markdown, push to GitHub, and let the build
pipeline handle the rest. No CMS, no database, no runtime dependencies.

<Callout type="info">
Loomwork is open source. You can fork it and build your own site in about
ten minutes.
</Callout>

## Content Architecture

Every page is an `.mdx` file in the `src/content/pages/` directory. Astro's
Content Collections validate frontmatter at build time — if a title is missing
or a date is malformed, the build fails immediately instead of shipping broken
pages to production.

The framework supports four page templates:

- **Default** — standard article layout with prose styling
- **Guide** — adds a sticky sidebar table of contents
- **Landing** — wider container for marketing-style pages
- **Longform** — split-panel layout with a fixed navigation sidebar (this page)

## Theme System

Loomwork ships 10 built-in themes that control colors, typography, spacing, and
dark mode. Themes are pure CSS files loaded at runtime — switching themes
requires zero JavaScript framework overhead.

The reader controls panel (the gear icon in the bottom-right corner) lets
visitors choose their preferred theme, toggle dark mode, adjust font size,
change content width, and enter focus mode. Preferences persist in
localStorage across visits.

<Callout type="tip">
Site owners pick a default theme in `site.config.ts`. Visitors can override
it using the reader controls, and their choice is remembered.
</Callout>

## Deployment

The site builds to static HTML and deploys to Cloudflare Pages via GitHub
Actions. Build times are typically under 5 seconds for sites with fewer
than 100 pages.

The mobile editor — accessible at `/mobile` — lets you draft and edit
content from a phone using GitHub's API. It renders live MDX previews
and commits directly to your repository.

## Why Longform?

This page uses the `longform` template to demonstrate the split-panel layout.
The sidebar stays fixed while content scrolls, making it easy to navigate long
articles. On mobile, the sidebar collapses into a compact header.

The longform template is designed for deep-dive content: technical write-ups,
design explorations, project retrospectives, and essays that benefit from
structured navigation.
```

Add a nav item for this page in `src/site.config.ts` by adding to the nav array:
```typescript
{ label: "Deep Dive", href: "/deep-dives/about-this-site" },
```

### Phase 3: Final Verification

#### 10. Build and verify

```bash
npm run build
```

Then confirm:

```bash
test -f dist/index.html && echo "✓ homepage" || echo "✗ homepage missing"
test -f dist/mobile/index.html && echo "✓ mobile" || echo "✗ mobile missing"
test -f dist/deep-dives/about-this-site/index.html && echo "✓ longform" || echo "✗ longform missing"
ls dist/themes/*.css 2>/dev/null | wc -l | xargs -I{} echo "✓ {} theme files"
test ! -f dist/about_Loomwork/index.html && echo "✓ no placeholder content" || echo "✗ placeholder content still present"
```

All checks must pass before proceeding.

#### 11. Commit and push

```bash
git add -A
git commit -m "Upgrade to loomwork 2.0: themes, reader controls, longform template"
git push origin main
```

If this is a DRY_RUN, skip `git push` and report what would be pushed:
```bash
git log --oneline -1
git diff --stat HEAD~1
```

---

## Notes for the agent

- Do not manually edit conflicted files during merge — use `git checkout
  --ours` or `--theirs` followed by `git add`.
- If `git merge` fails with "unrelated histories", add
  `--allow-unrelated-histories`.
- Do not push until the build is clean.
- Total steps: 11. This should complete in under 25 turns.
- If the build fails after Phase 2 changes, read the error carefully.
  Common fixes: missing import in a page, renamed CSS variable, or a
  deleted content file that is still referenced in a nav item.
