# Loomwork Fork Verification Prompt

Use this prompt with a coding agent to verify that the Loomwork fork-and-rebrand process is clean after the author has implemented the feedback from `LOOMWORK_FORK_FEEDBACK.md`.

---

## Prompt

You are a developer testing the fork-and-rebrand workflow for Loomwork, an open-source Astro site starter. The repo is at https://github.com/danrichardson/loomwork
Your job is to follow the repo's directions exactly to create a new site called "Coastal Kitchen" — a food and recipe site focused on seafood and coastal cooking. You should NOT look at any other demo site for reference. Follow only the directions in the loomwork repo's README and any setup guides in the repo.

Requirements
1. Follow the Quick Start directions exactly as written. Clone the repo into c:\src\loomwork-verification (or an equivalent empty directory), remove the origin, and install dependencies. Do not skip steps or improvise — the point is to test whether the directions work.

2. Follow the "Make It Yours" checklist in the README. Rebrand everything:

src/site.config.ts — name: "Coastal Kitchen", tagline about seafood and coastal recipes, your own nav items, footer company "Coastal Kitchen", remove any loomwork-specific social links, pick Google Fonts (e.g., "Playfair Display" for headings, "Lato" for body)
src/styles/site.css — ocean-inspired color palette (blues, sandy tans, coral accents)
astro.config.mjs — site URL: "https://verification.loomwork.org"
wrangler.toml — project name: "coastal-kitchen"
package.json — name: "coastal-kitchen", update description
src/pages/index.astro — custom homepage with a hero section and feature cards for your content sections
3. Create 4 content pages as .mdx files in src/content/pages/:

about.mdx — About Coastal Kitchen (who you are, what you cover)
recipes.mdx — Featured recipes (use the guide template, include 4–6 seafood recipes with ingredients and steps, use Callout components for tips)
techniques.mdx — Cooking techniques (use the guide template, cover things like grilling fish, shucking oysters, making stock, etc.)
pantry.mdx — Pantry essentials (use the guide template, cover key ingredients, spices, sauces for coastal cooking)
Each page needs proper frontmatter: title, description (max 160 chars), section, nav_order, template, and date_created. Available templates: `default`, `landing`, `guide`, `tool`, `longform`. Use Callout components (import Callout from '../../components/Callout.astro';) with various types (tip, warning, info, danger).

4. Delete ALL loomwork-specific placeholder content. After creating your pages:

Delete any content pages that came with the repo (anything referencing Loomwork, deploy guides, mobile app pages, "about Loomwork", etc.)
Delete the docs/ directory (loomwork project docs, prompts, audits)
Delete any orphaned images in public/images/ that were referenced by deleted pages
Replace README.md with a site-specific readme for Coastal Kitchen
Note: src/pages/mobile/ and src/components/mobile/ are intentional framework files — a PWA mobile editor for editing content via GitHub. Do not delete them. Verify that /mobile/index.html appears in the build output.

5. Verify the build. Run npm run build and confirm:

Build completes with no errors
All 4 content pages render (you should see /about/index.html, /recipes/index.html, /techniques/index.html, /pantry/index.html in the output)
The homepage renders (/index.html)
The mobile editor renders (/mobile/index.html)
No loomwork-specific placeholder page slugs appear in the build output (about_Loomwork, guide, mobile-app)
6. Scrub for leftover loomwork references. Search src/ and root config files for:

"loomwork.org" (other than verification.loomwork.org)
"Throughline"
"danrichardson"
Any nav links pointing to pages that don't exist
Allowed references: Framework-marker comments like // won't conflict with framework updates from the loomwork repo are acceptable in site files — those are upstream annotations, not site content. The following are framework files; they may reference "loomwork" in comments and should not be edited or flagged:

File	Purpose
src/layouts/Base.astro	HTML shell, meta tags, font loading
src/layouts/Content.astro	Content page chrome, template variants
src/layouts/Longform.astro	Split-panel deep dive layout
src/components/*.astro	Callout, YouTube, Header, Footer, TOC, etc.
src/components/mobile/	PWA mobile editor components
src/styles/global.css	Reset, base typography, utilities
src/content.config.ts	Content collection schemas
src/pages/[...slug].astro	Dynamic route for content pages
src/pages/404.astro	Not found page
src/pages/mobile/	PWA mobile editor page
public/_headers	Security headers (Cloudflare Pages)
public/_redirects	URL redirects
public/.assetsignore	Cloudflare deploy fix
public/mobile/	PWA manifest and service worker
But site files (site.config.ts, site.css, index.astro, content pages, README.md, package.json, astro.config.mjs, wrangler.toml) should have zero loomwork-specific content.

7. Start the dev server (npm run dev) and confirm it runs without errors at http://localhost:4321.

Grading Criteria
After completing the above, evaluate the experience and report:

PASS if:

The README directions were sufficient to complete the process without guessing
No loomwork-specific placeholder content leaks into the finished site
The build succeeds cleanly
All nav links resolve to real pages
No unexplained files needed to be manually identified and deleted (beyond what the README covers)
FAIL if any of these occurred:

Directions were missing, ambiguous, or incorrect
Loomwork-specific placeholder content remained in site files after following directions
The build failed
Dead links in navigation
Files that should have been mentioned in the README cleanup section were not
Documentation gap (report but not a hard FAIL):

Intentional framework features (like the mobile editor) are undocumented or unexplained in the README, causing confusion about whether to keep or remove them
For each failure or gap, document: what happened, what you expected, and what the fix should be.

Final Deliverable
The completed Coastal Kitchen site in the workspace
A short report (in your response, not a file) summarizing PASS/FAIL with details
Commit everything to git with a descriptive message
---

*This prompt was generated to verify fixes to the issues documented in LOOMWORK_FORK_FEEDBACK.md from the Trail & Summit demo site.*
