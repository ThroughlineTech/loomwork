# Upgrading from Loomwork Upstream

This guide is for AI agents and developers upgrading a forked loomwork site to
the latest framework version. Follow each step in order. Do not skip the
pre-flight check.

---

## How Loomwork Updates Work

Loomwork separates files into two categories:

**Framework files** — maintained upstream, never edited in site repos. These
merge cleanly from loomwork because your repo hasn't touched them.

**Site files** — yours to own. Loomwork only ships placeholder versions of
these, so they won't conflict either.

In practice, `git merge loomwork/main` should almost always be conflict-free.
The pre-flight check below catches the rare case where someone edited a
framework file by mistake.

---

## Pre-Flight: Identify Any Edited Framework Files

Before merging, check whether any framework files have been modified in this
repo. If they have, note the changes — you will need to reapply them after the
merge or accept the upstream version.

**Framework files (should not be edited in site repos):**

| File | Purpose |
|------|---------|
| `src/layouts/Base.astro` | HTML shell, meta tags, font loading |
| `src/layouts/Content.astro` | Content page chrome, template variants |
| `src/layouts/Longform.astro` | Split-panel deep dive layout |
| `src/components/Callout.astro` | Callout component |
| `src/components/DemoControl.astro` | Demo theme switcher |
| `src/components/ReaderControls.astro` | Reader preferences panel |
| `src/components/ReadingEnhancements.astro` | Reading enhancements |
| `src/components/TableOfContents.astro` | TOC sidebar component |
| `src/components/ThemePicker.astro` | Theme picker component |
| `src/components/YouTube.astro` | YouTube embed component |
| `src/components/mobile/` | PWA mobile editor components |
| `src/pages/[...slug].astro` | Dynamic content page route |
| `src/pages/404.astro` | Not found page |
| `src/pages/mobile/` | PWA mobile editor page |
| `src/styles/global.css` | Base styles, reset, utilities |
| `src/content.config.ts` | Content collection schemas |
| `public/_headers` | Security headers (Cloudflare Pages) |
| `public/_redirects` | URL redirects |
| `public/.assetsignore` | Cloudflare deploy fix |
| `public/mobile/` | PWA manifest and service worker |

Run this to see if any of them have been edited in this repo compared to the
last upstream merge:

```bash
git diff HEAD -- \
  src/layouts/ \
  src/components/ \
  src/pages/\[...slug\].astro \
  src/pages/404.astro \
  src/pages/mobile/ \
  src/styles/global.css \
  src/content.config.ts \
  public/.assetsignore \
  public/_headers \
  public/_redirects \
  public/mobile/
```

If this produces output, record what changed and why before proceeding.

**Site files (yours — will not be touched by the merge):**

- `src/site.config.ts`
- `src/styles/site.css`
- `src/pages/index.astro`
- `src/components/Header.astro` (ships as a starter — customize freely)
- `src/components/Footer.astro` (ships as a starter — customize freely)
- `src/content/pages/*.mdx`
- `src/content/posts/*.mdx`
- `astro.config.mjs`
- `wrangler.toml`
- `package.json` (project name/description are yours; deps may be updated)
- `README.md`

---

## Step 1: Add Loomwork as an Upstream Remote (One-Time Setup)

If you haven't done this before:

```bash
git remote add loomwork https://github.com/danrichardson/loomwork.git
```

Verify it's set:

```bash
git remote -v
```

You should see both `origin` (your repo) and `loomwork` (upstream).

---

## Step 2: Fetch Latest Upstream Changes

```bash
git fetch loomwork
```

To preview what has changed in the framework before merging:

```bash
git log main..loomwork/main --oneline
```

To see the actual diff of framework files only:

```bash
git diff main loomwork/main -- \
  src/layouts/ \
  src/components/ \
  src/pages/\[...slug\].astro \
  src/pages/404.astro \
  src/pages/mobile/ \
  src/styles/global.css \
  src/content.config.ts \
  public/.assetsignore \
  public/_headers \
  public/_redirects
```

Read this diff before merging. Understand what is changing.

---

## Step 3: Merge

```bash
git merge loomwork/main
```

**If the merge completes with no conflicts:** proceed to Step 5.

**If there are conflicts:** go to Step 4.

---

## Step 4: Resolve Conflicts (If Any)

Conflicts will only occur in files that both you and loomwork have changed.
This should only happen if you edited a framework file (caught in pre-flight)
or if dependency files diverged.

### Framework file conflicts

Accept the upstream (loomwork) version:

```bash
# Accept upstream version of a framework file
git checkout loomwork/main -- src/layouts/Base.astro
git add src/layouts/Base.astro
```

### Site file conflicts

Keep your version:

```bash
# Keep your version of a site file
git checkout HEAD -- src/site.config.ts
git add src/site.config.ts
```

### Dependency file conflicts (`package.json` / `package-lock.json`)

`package.json` may conflict if both you and loomwork changed dependencies.
Accept loomwork's version, then verify your project metadata:

```bash
git checkout --theirs package.json
git add package.json
```

Then open `package.json` and confirm your `name` and `description` fields are
correct. If you added site-specific dependencies, verify they're still present.
If not, they'll be re-added in Step 5.

For `package-lock.json`, always delete and regenerate — never merge manually:

```bash
git rm package-lock.json
git add package-lock.json
```

### Complete the merge

After resolving all conflicts:

```bash
git merge --continue
```

---

## Step 5: Update Dependencies

Framework updates may add, remove, or upgrade npm packages. Always run this
after a merge, even if there were no conflicts:

```bash
npm install
```

This regenerates `package-lock.json` and ensures all framework dependencies
are installed. If you have site-specific dependencies that were lost in a
`package.json` conflict, re-add them now:

```bash
npm install <your-package>
```

---

## Step 6: Check for CSS Variable Changes

If global.css was updated, check whether any CSS custom properties you use in
`site.css` were renamed or removed:

```bash
git diff HEAD~1 HEAD -- src/styles/global.css | grep "^[-+].*--"
```

Lines starting with `-` show removed/renamed variables; `+` shows new ones.
Update `site.css` to match any renames.

---

## Step 7: Verify the Build

```bash
npm run build
```

Confirm:
- Build completes with no errors
- Your content pages still render (check `dist/` for your page slugs)
- The homepage renders (`dist/index.html`)
- The mobile editor renders (`dist/mobile/index.html`)
- No unexpected new pages appeared in `dist/`

Warnings about sharp or KV bindings are expected and can be ignored.

---

## Step 8: Verify the Dev Server

```bash
npm run dev
```

Confirm the dev server starts cleanly at http://localhost:4321 and your
pages load without errors in the browser console.

---

## Step 9: Commit and Push

```bash
git add -A
git commit -m "Upgrade to latest loomwork framework"
git push origin main
```

---

## Rollback

If something goes wrong at any point:

**Before committing the merge:**

```bash
git merge --abort
```

**After committing but before pushing:**

```bash
git reset --hard HEAD~1
```

**After pushing (if the live site is broken):**

```bash
git revert HEAD
git push origin main
```

Then investigate what went wrong before trying the upgrade again.

---

## What to Watch For

**New framework files:** Loomwork may add new files to `src/components/`,
`src/layouts/`, or `public/`. These are framework files — do not edit them.
New components can be used in your MDX files going forward.

**CSS variable changes in `global.css`:** If loomwork renames or removes a
CSS variable you reference in `site.css`, your styles may break silently.
See Step 6 for how to check. See also
[CSS-ARCHITECTURE.md](CSS-ARCHITECTURE.md) for the full variable reference
table and guidance on writing theme-compatible `site.css`.

**Content schema changes in `content.config.ts`:** If the schema for content
collections changes, your MDX frontmatter may fail validation. Check the build
output for schema errors and update your `.mdx` files accordingly.

**New or renamed templates:** Loomwork supports these templates in frontmatter:
`default`, `landing`, `guide`, `tool`, `longform`. If a new template is added
or an existing one renamed, update your MDX frontmatter if needed.

**Security headers in `public/_headers`:** Loomwork ships default security
headers for Cloudflare Pages. If you have custom headers, review the merge
result to ensure your additions are preserved alongside the framework defaults.

---

## Loomwork Framework File Reference

If you are unsure whether a file is a framework file or a site file, the
rule is: **if it existed in the original loomwork repo and is not listed in
the "Site files" section of the README, don't edit it.**

When in doubt, check:

```bash
git log --oneline loomwork/main -- <file>
```

If loomwork has commits touching that file, it's a framework file.
