# Loomwork Fork Verification Prompt

Use this prompt with a coding agent to verify that the Loomwork fork-and-rebrand process is clean. The result should be a fully-themed site that exercises all major framework features including the theme system, reader controls, multiple page templates, and content components.

---

## Prompt

You are a developer testing the fork-and-rebrand workflow for Loomwork, an open-source Astro site starter. The repo is at https://github.com/danrichardson/loomwork
Your job is to follow the repo's directions exactly to create a new site called "Coastal Kitchen" — a food and recipe site focused on seafood and coastal cooking. You should NOT look at any other demo site for reference. Follow only the directions in the loomwork repo's README and any setup guides in the repo.

Requirements

1. Follow the Quick Start directions exactly as written. Clone the repo into c:\src\loomwork-verification (or an equivalent empty directory), remove the origin, and install dependencies. Do not skip steps or improvise — the point is to test whether the directions work.

2. Follow the "Make It Yours" checklist in the README. Rebrand everything:

src/site.config.ts:
- name: "Coastal Kitchen"
- tagline about seafood and coastal recipes
- Your own nav items matching your content pages
- footer company: "Coastal Kitchen"
- Remove any loomwork-specific social links
- theme: "alpine" (the built-in theme — do NOT manually set fonts or colors, let the theme handle it)
- reader_controls: true (enables the floating reader preferences panel)
- fonts_url: "" (leave empty — the alpine theme loads its own fonts automatically)

src/styles/site.css — Add minimal site-specific CSS overrides on top of the theme. The alpine theme already provides a clean, modern palette. You may override a few accent variables for an ocean feel (e.g., a teal --color-accent), but do NOT redefine the full color palette — that's the theme's job. Keep site.css small (under 30 lines of overrides).

astro.config.mjs — site URL: "https://verification.loomwork.org"
wrangler.toml — project name: "coastal-kitchen"
package.json — name: "coastal-kitchen", update description
src/pages/index.astro — custom homepage with a hero section and feature cards for your content sections. Style using only CSS variables from the theme (--color-accent, --color-bg, --color-surface, etc.) — no hardcoded hex colors.

3. Create 5 content pages as .mdx files in src/content/pages/ that exercise different templates:

about.mdx — About Coastal Kitchen (use the `default` template — who you are, what you cover)
recipes.mdx — Featured recipes (use the `guide` template — include 4–6 seafood recipes with ingredients and steps, use Callout components for tips)
techniques.mdx — Cooking techniques (use the `guide` template — cover things like grilling fish, shucking oysters, making stock, etc.)
pantry.mdx — Pantry essentials (use the `guide` template — cover key ingredients, spices, sauces for coastal cooking)
deep-dives/seasonal-catch.mdx — A deep-dive article about seasonal seafood (use the `longform` template — this exercises the split-panel Longform layout with a fixed sidebar. Write 1000+ words covering spring/summer/fall/winter catches, with sections for each season. Include Callout components.)

Each page needs proper frontmatter: title, description (max 160 chars), section, nav_order, template, and date_created. Available templates: `default`, `landing`, `guide`, `tool`, `longform`. Use Callout components (import Callout from '../../components/Callout.astro';) with various types (tip, warning, info, danger).

The nav in site.config.ts should include links to all 5 pages. Use a "Deep Dives" label for the seasonal-catch page.

4. Delete ALL loomwork-specific placeholder content. After creating your pages:

Delete any content pages that came with the repo (anything referencing Loomwork, deploy guides, mobile app pages, "about Loomwork", etc.), including the deep-dives/ folder that ships with loomwork.
Delete the docs/ directory (loomwork project docs, prompts, audits)
Delete any orphaned images in public/images/ that were referenced by deleted pages
Delete public/icons/ (loomwork homepage icons — replace with your own or remove)
Replace public/favicon.svg with your own favicon
Replace README.md with a site-specific readme for Coastal Kitchen
Note: These are intentional framework files — do NOT delete them:
- src/pages/mobile/ and src/components/mobile/ (PWA mobile editor)
- src/themes/_index.ts (theme registry)
- public/themes/*.css (theme stylesheets)
- public/mobile/ (PWA manifest and service worker)
- public/_headers, public/_redirects, public/.assetsignore

5. Verify the build. Run npm run build and confirm:

Build completes with no errors
All 5 content pages render (you should see /about/index.html, /recipes/index.html, /techniques/index.html, /pantry/index.html, and /deep-dives/seasonal-catch/index.html in the output)
The homepage renders (/index.html)
The mobile editor renders (/mobile/index.html)
Theme CSS files are present in the output (dist/themes/*.css)
No loomwork-specific placeholder page slugs appear in the build output (about_Loomwork, guide, mobile-app, building, theming, page-types, reader-controls, designing-for-focus, what-is-longform, campfire-2-retro)

6. Verify 2.0 features work:

Theme: Confirm the alpine theme CSS is loaded. Check that dist/themes/alpine.css exists and the site references it.
Reader Controls: Confirm the floating reader-controls panel markup is in the built HTML (search for "lw-reader-controls" in the output HTML files).
Longform template: Confirm the seasonal-catch page uses the longform layout (search for "longform" class or layout markers in its HTML output).
Theme registry: Confirm the theme map JSON is injected in the page head (search for "lw-theme-map" in the output HTML).
All 10 theme CSS files should be in dist/themes/ (alpine.css, atelier.css, brutalist.css, campfire.css, fieldnotes.css, gazette.css, manuscript.css, moonrise.css, neon.css, terminal.css).

7. Scrub for leftover loomwork references. Search src/ and root config files for:

"loomwork.org" (other than verification.loomwork.org)
"Throughline"
"danrichardson"
Any nav links pointing to pages that don't exist

Allowed references: Framework-marker comments like `// won't conflict with framework updates from the loomwork repo` are acceptable in site files — those are upstream annotations, not site content. The following are framework files; they may reference "loomwork" in comments and should not be edited or flagged:

| File | Purpose |
|------|---------|
| src/layouts/Base.astro | HTML shell, meta tags, font/theme loading |
| src/layouts/Content.astro | Content page chrome, template variants |
| src/layouts/Longform.astro | Split-panel deep dive layout |
| src/components/*.astro | Callout, YouTube, Header, Footer, TOC, ThemePicker, ReaderControls, ReadingEnhancements, DemoControl |
| src/components/mobile/ | PWA mobile editor components |
| src/styles/global.css | Reset, base typography, utilities |
| src/styles/themes.css | Theme-related global styles |
| src/content.config.ts | Content collection schemas |
| src/themes/_index.ts | Theme registry (maps theme names to CSS/fonts) |
| src/pages/[...slug].astro | Dynamic route for content pages |
| src/pages/404.astro | Not found page |
| src/pages/mobile/ | PWA mobile editor page |
| public/_headers | Security headers (Cloudflare Pages) |
| public/_redirects | URL redirects |
| public/.assetsignore | Cloudflare deploy fix |
| public/mobile/ | PWA manifest and service worker |
| public/themes/*.css | Built-in theme stylesheets |

But site files (site.config.ts, site.css, index.astro, content pages, README.md, package.json, astro.config.mjs, wrangler.toml) should have zero loomwork-specific content.

8. Start the dev server (npm run dev) and confirm it runs without errors at http://localhost:4321.

Grading Criteria

After completing the above, evaluate the experience and report:

PASS if:

- The README directions were sufficient to complete the process without guessing
- No loomwork-specific placeholder content leaks into the finished site
- The build succeeds cleanly
- All nav links resolve to real pages
- No unexplained files needed to be manually identified and deleted (beyond what the README covers)
- A built-in theme is active and the site uses themed CSS variables (not hardcoded colors)
- Reader controls panel is present and functional
- The longform template renders correctly for the deep-dive page
- All 10 theme CSS files are in the build output
- The theme registry JSON is injected in the page head

FAIL if any of these occurred:

- Directions were missing, ambiguous, or incorrect
- Loomwork-specific placeholder content remained in site files after following directions
- The build failed
- Dead links in navigation
- Files that should have been mentioned in the README cleanup section were not
- No theme was set (site uses raw global.css defaults instead of a built-in theme)
- reader_controls is not enabled
- The longform template was not used for any page

Documentation gap (report but not a hard FAIL):

- Intentional framework features (like the mobile editor, themes, or reader controls) are undocumented or unexplained in the README, causing confusion about whether to keep or remove them

For each failure or gap, document: what happened, what you expected, and what the fix should be.

Final Deliverable

- The completed Coastal Kitchen site in the workspace — fully themed (alpine), reader controls enabled, using default/guide/longform templates
- A short report (in your response, not a file) summarizing PASS/FAIL with details
- Commit everything to git with a descriptive message
