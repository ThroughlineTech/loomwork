# Loomwork

A content-first Astro starter for crafting sites by hand.

Write markdown. Push to GitHub. Live in 30 seconds.

> **Note:** This file lives in `.github/README.md` rather than the repository root. This is intentional — it prevents merge conflicts when site repos pull framework updates, since every site has its own root `README.md`. After forking, you may keep it here for reference or delete it — it won't conflict with your root `README.md` either way.

## Quick Start

```bash
git clone https://github.com/danrichardson/loomwork.git my-site
cd my-site
git remote remove origin
git remote add origin https://github.com/YOUR-USER/YOUR-SITE.git
git remote add loomwork https://github.com/danrichardson/loomwork.git
npm install
npm run dev        # → http://localhost:4321
```

## After Forking: Clean Up Loomwork-Specific Files

Delete these before building your site — they're loomwork repo files, not part of the framework:

```bash
rm -rf docs/              # loomwork project docs, prompts, audits
```

Keep `UPGRADE.md` if you want the upgrade guide handy for future framework
updates. Otherwise, you can always find it at the loomwork repo.

Then replace the loomwork placeholder content:

```bash
rm src/content/pages/about_Loomwork.mdx
rm src/content/pages/guide.mdx
rm src/content/pages/mobile-app.mdx
rm src/content/pages/building.mdx
rm src/content/pages/page-types.mdx
rm src/content/pages/reader-controls.mdx
rm src/content/pages/theming.mdx
rm -rf src/content/pages/deep-dives/
rm -f public/images/1771364152056-image.jpg
```

Then create your own project README:

```bash
echo "# My Site" > README.md
```

## Make It Yours

1. **`src/site.config.ts`** - Name, tagline, nav, footer, email, fonts
2. **`src/styles/site.css`** - Override colors, fonts, spacing
3. **`astro.config.mjs`** - Your site URL
4. **`wrangler.toml`** - Cloudflare project name and custom domains
5. Replace content in `src/content/pages/`
6. Customize `src/pages/index.astro` (your homepage)
7. Push to GitHub → connect to Cloudflare → live

## Project Structure

```
src/
├── site.config.ts         ← SITE FILE: name, nav, footer, fonts
├── content.config.ts      ← FRAMEWORK: content collection schemas
├── styles/
│   ├── global.css         ← FRAMEWORK: base styles, reset, utilities
│   └── site.css           ← SITE FILE: your color/font overrides
├── content/
│   ├── pages/             ← SITE FILE: your MDX content
│   └── posts/             ← SITE FILE: optional blog posts
├── components/
│   ├── *.astro            ← FRAMEWORK: shared components
│   └── mobile/            ← FRAMEWORK: mobile editor components
├── layouts/
│   ├── Base.astro         ← FRAMEWORK: HTML shell
│   ├── Content.astro      ← FRAMEWORK: standard page layout
│   └── Longform.astro     ← FRAMEWORK: split-panel deep dives
└── pages/
    ├── index.astro        ← SITE FILE: your homepage
    ├── [...slug].astro    ← FRAMEWORK: renders content pages
    ├── 404.astro          ← FRAMEWORK: not found page
    └── mobile/            ← FRAMEWORK: mobile editor PWA
```

## Framework vs Site Files

This matters if you want to pull framework updates from the loomwork repo.

### Framework files - don't edit in your site repo

| File | Purpose |
|------|---------|
| `src/layouts/Base.astro` | HTML shell, meta tags, font loading |
| `src/layouts/Content.astro` | Content page chrome, template variants |
| `src/layouts/Longform.astro` | Split-panel deep dive layout |
| `src/components/*.astro` | Callout, YouTube, Header, Footer, TOC, etc. |
| `src/components/mobile/` | Mobile editor React components |
| `src/styles/global.css` | Reset, base typography, utilities |
| `src/content.config.ts` | Content collection schemas |
| `src/pages/[...slug].astro` | Dynamic route for content pages |
| `src/pages/404.astro` | Not found page |
| `src/pages/mobile/` | Mobile editor PWA page (served at `/mobile`) |
| `public/_headers` | Security headers (Cloudflare Pages) |
| `public/_redirects` | URL redirects |
| `public/.assetsignore` | Cloudflare deploy fix |
| `public/mobile/` | PWA manifest and service worker |

### Site files - yours to customize

| File | Purpose |
|------|---------|
| `src/site.config.ts` | Site identity, navigation, fonts |
| `src/styles/site.css` | CSS variable overrides, site-specific styles |
| `src/pages/index.astro` | Homepage layout and content |
| `src/content/pages/*.mdx` | All your site content |
| `src/content/posts/*.mdx` | Blog posts (optional) |
| `astro.config.mjs` | Site URL (change one line) |
| `wrangler.toml` | Cloudflare project name and routes |
| `package.json` | Project name |
| `README.md` | Your project README (not provided by loomwork) |

## Pulling Framework Updates

Set up loomwork as an upstream remote (one-time):

```bash
git remote add loomwork https://github.com/danrichardson/loomwork.git
```

When loomwork gets updates:

```bash
git fetch loomwork
git merge loomwork/main
npm install
npm run build
```

Framework files merge cleanly because you haven't edited them. Site files won't conflict because loomwork only has placeholder versions.

See `docs/UPGRADE.md` in the loomwork repo for the full guide with conflict resolution, CSS variable migration, rollback instructions, and dependency handling.

## Mobile Editor

Loomwork includes a built-in PWA at `/mobile` that lets you edit and create content pages directly from a phone, committing changes to GitHub without a desktop. It is a framework feature — **do not delete** `src/pages/mobile/` or `src/components/mobile/` when cleaning up loomwork placeholder files.

The content page `src/content/pages/mobile-app.mdx` is a placeholder and should be deleted. The mobile editor itself lives in `src/pages/mobile/` and is separate from your site content.

## Styling

The styling system has two layers:

**`global.css`** (framework) - Contains the CSS reset, base typography, component styles, and utility classes. All values reference CSS custom properties. Don't edit this in site repos.

**`site.css`** (yours) - Override any CSS variable to rebrand:

```css
:root {
  --color-accent:       #2d6a4f;
  --color-accent-hover: #1b4332;
  --color-accent-light: #d1fae5;
  --font-heading: "Bitter", Georgia, serif;
  --font-body: "Source Sans 3", system-ui, sans-serif;
}

/* Site-specific styles go here too */
```

To use Google Fonts, set `fonts_url` in `site.config.ts`:

```typescript
fonts_url: "https://fonts.googleapis.com/css2?family=Bitter:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap",
```

## Content Authoring

### Pages

Create `.mdx` files in `src/content/pages/`. Frontmatter:

```yaml
---
title: "Page Title"
description: "SEO description, max 160 chars."
section: "guides"
nav_order: 10
template: "guide"     # default | landing | guide | tool | longform
draft: false
---
```

File path = URL: `src/content/pages/docs/intro.mdx` → `/docs/intro`

### Components in MDX

```mdx
import Callout from '../../components/Callout.astro';

<Callout type="tip" title="Pro tip">
  Components render inline in your markdown.
</Callout>
```

Available: `Callout` (info/warning/tip/danger), `YouTube` (video embeds).

### Templates

- **`default`** - Centered content, comfortable reading width
- **`landing`** - Wide container, no sidebar
- **`guide`** - Sticky table of contents sidebar on desktop
- **`tool`** - Minimal chrome for interactive React components
- **`longform`** - Split-panel: fixed sidebar index + scrollable content (deep dives, essays)

## Deploy to Cloudflare

1. Push to GitHub
2. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git
3. Build command: `npm run build` / Output: `dist`
4. Add custom domains in Settings → Domains & Routes

## Adding React Islands

```tsx
// src/components/Calculator.tsx
import { useState } from "react";
export default function Calculator() {
  const [val, setVal] = useState(0);
  return <div>...</div>;
}
```

```astro
import Calculator from '../components/Calculator';
<Calculator client:load />
```

## Tech Stack

- **Astro 5** - Static site generator with MDX and React islands
- **Cloudflare Workers** - Free global hosting, auto-deploy from GitHub
- **MDX** - Markdown with inline components
- **Content Collections** - Schema-validated content with TypeScript

## License

MIT - [Throughline Technical Services, LLC](https://www.throughlinetech.net)
