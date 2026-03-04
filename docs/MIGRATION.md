# Migrating an Existing Site to Loomwork

This guide is for migrating an existing website (Astro-based or otherwise) onto
the Loomwork framework. Unlike UPGRADE.md (which covers pulling new framework
versions into an already-forked site), this covers the one-time process of
adopting Loomwork from scratch.

The target use case: you have a live site with content you want to keep, and you
want Loomwork's theme system, reader controls, content collections, and
zero-config Cloudflare deployment.

---

## Overview

The migration has four phases:

1. **Scaffold** — Clone loomwork, set up your repo
2. **Configure** — Set site identity, branding, nav
3. **Migrate content** — Convert existing pages to MDX in content collections
4. **Verify and deploy** — Build, test, push

---

## Phase 1: Scaffold

### 1.1 Clone loomwork into a new directory

```bash
git clone https://github.com/danrichardson/loomwork.git my-site
cd my-site
```

### 1.2 Set up remotes

```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USER/YOUR-SITE.git
git remote add loomwork https://github.com/danrichardson/loomwork.git
```

### 1.3 Clean up loomwork placeholder files

Delete loomwork's demo content and repo-specific docs:

```bash
# Loomwork repo docs (not part of the framework)
rm -f MOBILE_README.md MOBILE_PROJECT.md Notes.md PROJECT.md
rm -f UPGRADE-PROMPT.md VERIFICATION_AGENT_PROMPT.md
rm -rf docs/

# Placeholder content pages
rm -f src/content/pages/about_Loomwork.mdx
rm -f src/content/pages/guide.mdx
rm -f src/content/pages/mobile-app.mdx
rm -f src/content/pages/building.mdx
rm -f src/content/pages/page-types.mdx
rm -f src/content/pages/reader-controls.mdx
rm -f src/content/pages/theming.mdx
rm -rf src/content/pages/deep-dives/

# Placeholder images
rm -f public/images/1771364152056-image.jpg
```

Keep `UPGRADE.md` — you'll need it for future framework updates.

### 1.4 Install dependencies

```bash
npm install
```

---

## Phase 2: Configure

### 2.1 Site identity (`src/site.config.ts`)

This is the most important file. Update every field:

```typescript
export const SITE = {
  name: "Your Site Name",
  tagline: "Your tagline",
  description: "SEO description for the site (max 160 chars).",
  url: "https://www.yoursite.com",
  author: "Your Name",
  email: "you@yoursite.com",

  nav_home: true,
  nav: [
    { label: "About", href: "/about" },
    { label: "Services", href: "/services" },
    // ... your pages
  ],

  fonts_url: "https://fonts.googleapis.com/css2?family=YourFont:wght@400;700&display=swap",

  social: {
    github: "https://github.com/you",
  },

  footer: {
    company: "Your Company, LLC",
    license: "MIT License",  // or remove
  },

  theme: "manuscript",  // or any of the 10 built-in themes
  reader_controls: false,  // true to enable the floating preferences panel
};
```

### 2.2 Site styles (`src/styles/site.css`)

Override CSS custom properties to match your brand:

```css
:root {
  --color-accent:       #2d6a4f;
  --color-accent-hover: #1b4332;
  --color-accent-light: #d1fae5;
  --font-heading: "Your Heading Font", Georgia, serif;
  --font-body: "Your Body Font", system-ui, sans-serif;
}
```

If you need custom styles beyond variable overrides, add them here too.

### 2.3 Astro config (`astro.config.mjs`)

Update the `site` field:

```javascript
site: "https://www.yoursite.com",
```

### 2.4 Cloudflare config (`wrangler.toml`)

Update the project name:

```toml
name = "your-site"
```

If you have custom domain routes, add them here.

### 2.5 Package metadata (`package.json`)

Update `name` and `description`:

```json
{
  "name": "your-site",
  "description": "Your site description"
}
```

### 2.6 Homepage (`src/pages/index.astro`)

Replace the loomwork placeholder homepage entirely. This is a site file — you
have full control. Import `Base` layout and build your page:

```astro
---
import Base from "../layouts/Base.astro";
import { SITE } from "../site.config";
---
<Base title={SITE.name} description={SITE.description}>
  <main>
    <!-- Your homepage content -->
  </main>
</Base>
```

### 2.7 README

```bash
echo "# Your Site Name" > README.md
```

---

## Phase 3: Migrate Content

### 3.1 Content structure

All content pages go in `src/content/pages/` as `.mdx` files. The file path
becomes the URL:

| File | URL |
|------|-----|
| `src/content/pages/about.mdx` | `/about` |
| `src/content/pages/work.mdx` | `/work` |
| `src/content/pages/services/consulting.mdx` | `/services/consulting` |

### 3.2 Frontmatter schema

Every content page needs frontmatter:

```yaml
---
title: "Page Title"
description: "SEO description, max 160 characters."
section: "optional-group"     # groups pages for longform sidebar
nav_title: "Short Nav Label"  # optional, used in nav if different from title
nav_order: 10                 # lower = earlier in nav order
template: "default"           # default | landing | guide | tool | longform
draft: false
date_created: 2026-01-15
tags: ["tag1", "tag2"]
---
```

### 3.3 Template selection guide

Choose templates based on page purpose:

| Template | Best for |
|----------|----------|
| `default` | Standard articles, about pages, policies |
| `landing` | Wide hero sections, feature grids, marketing pages |
| `guide` | Documentation, tutorials — sticky TOC sidebar on desktop |
| `tool` | Utility pages with React components |
| `longform` | Deep dives, case studies — split-panel with fixed sidebar |

### 3.4 Using components in MDX

```mdx
import Callout from '../../components/Callout.astro';

<Callout type="tip" title="Pro tip">
  Callout components render inline in your markdown.
</Callout>
```

Available types: `info`, `warning`, `tip`, `danger`.

YouTube embeds:

```mdx
import YouTube from '../../components/YouTube.astro';

<YouTube id="dQw4w9WgXcQ" />
```

### 3.5 Content migration checklist

For each page on your existing site:

- [ ] Create the `.mdx` file with correct frontmatter
- [ ] Copy/convert the content body (HTML to Markdown if needed)
- [ ] Update internal links to use new URL paths
- [ ] Move images to `public/images/` and update references
- [ ] Add Callout components where appropriate
- [ ] Verify the page renders in dev server

### 3.6 Blog posts (optional)

If your site has blog posts, create them in `src/content/posts/`:

```yaml
---
title: "Post Title"
description: "Post description, max 160 chars."
date: 2026-01-15
author: "Your Name"
tags: ["tag1"]
draft: false
---
```

---

## Phase 4: Verify and Deploy

### 4.1 Build

```bash
npm run build
```

Confirm:
- Zero errors (warnings about sharp/KV are expected)
- All your content pages appear in the output
- Homepage renders
- Mobile editor renders (`/mobile/index.html`)

### 4.2 Dev server

```bash
npm run dev
```

Walk through every page at http://localhost:4321. Check:
- All nav links resolve to real pages
- No dead links in content
- Images load correctly
- Theme looks right
- Mobile responsive layout works

### 4.3 Scrub for leftover references

Search for any references to the old site or loomwork placeholders:

```bash
grep -r "loomwork" src/ --include="*.ts" --include="*.css" --include="*.astro" --include="*.mdx" -l
```

Framework files will legitimately contain "loomwork" in comments — that's fine.
Site files should have zero loomwork references.

### 4.4 Initial commit and push

```bash
git add -A
git commit -m "Migrate to Loomwork framework"
git push origin main
```

### 4.5 Cloudflare Pages setup

1. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
2. Select your repo and branch (`main`)
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add custom domains in Settings → Domains & Routes

First deploy takes 1-2 minutes. Subsequent pushes auto-deploy in ~30 seconds.

---

## Post-Migration: Pulling Future Updates

You're now a standard Loomwork site. Future framework updates use the normal
upgrade path:

```bash
git fetch loomwork
git merge loomwork/main
npm install
npm run build
git push origin main
```

See `UPGRADE.md` for the full upgrade guide with conflict resolution details.

---

## Migration Notes for Specific Site Types

### Portfolio / consulting sites (e.g. throughlinetech.net)

These sites typically have:
- Custom homepage with hero, stats, and feature cards
- Case studies or work examples with structured layouts
- About page with timeline
- Contact / "let's talk" page

Mapping to Loomwork:

| Existing page | Loomwork approach |
|---------------|-------------------|
| Homepage | Custom `src/pages/index.astro` — full control |
| Case Studies | `guide` or `longform` template with structured MDX |
| About | `default` template |
| Projects | `guide` template with cards in MDX |
| Contact | Custom `src/pages/start.astro` or `default` template with mailto links |

For case study pages with repeated structure (NOTICED / BUILT / RESULT), create
a custom Astro component and import it in MDX:

```astro
---
// src/components/CaseStudy.astro
const { noticed, built, result } = Astro.props;
---
<div class="case-study">
  <div class="phase"><h4>Noticed</h4><p>{noticed}</p></div>
  <div class="phase"><h4>Built</h4><p>{built}</p></div>
  <div class="phase"><h4>Result</h4><p>{result}</p></div>
</div>
```

For contact forms, Loomwork doesn't include server-side form handling. Options:
- Simple mailto link (no form needed)
- Cloudflare Workers function (add to `functions/` directory)
- Third-party form service (Formspree, Tally, etc.)
- Custom React island with `client:load`

### Content-heavy sites

Sites with many pages benefit from Loomwork's content collections and template
system. Use `guide` template for anything that benefits from a persistent TOC
sidebar, and `longform` for deep dives with a sidebar index.

### Blog-focused sites

Use `src/content/posts/` for date-ordered blog content. You'll need to create
a blog index page at `src/pages/blog.astro` (this is a site file, not provided
by the framework).
