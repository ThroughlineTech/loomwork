# Loomwork Upgrade Prompt

Use this prompt to instruct an agent to upgrade a loomwork-based site to the
latest framework version. This is the prompt consumed by the "Upgrade Demo Site"
GitHub Action, and can be given to any coding agent working in a site repo.

---

## Prompt

Your task is to upgrade this site to the latest version of the loomwork
framework. Follow these steps exactly.

### 1. Verify the loomwork remote is configured

```bash
git remote -v
```

You should see a `loomwork` remote pointing to
`https://github.com/danrichardson/loomwork.git`. If it is missing, add it:

```bash
git remote add loomwork https://github.com/danrichardson/loomwork.git
```

### 2. Fetch and merge the latest loomwork

```bash
git fetch loomwork
git merge loomwork/main
```

### 3. Resolve any conflicts

Conflicts will fall into one of three categories. Handle each differently:

**Pure site files (always keep yours — HEAD side):**
- `README.md`
- `src/site.config.ts`
- `src/styles/site.css`
- `src/pages/index.astro`
- `src/content/pages/*.mdx`
- `astro.config.mjs`
- `wrangler.toml`

**Framework files (should auto-merge cleanly — if they conflict, accept
loomwork's version):**
- `src/layouts/`
- `src/components/`
- `src/styles/global.css`
- `src/content.config.ts`
- `src/pages/[...slug].astro`
- `src/pages/404.astro`
- `src/pages/mobile/`
- `public/_headers`
- `public/_redirects`
- `public/.assetsignore`

**Dependency files (special handling):**
- `package.json` — If conflicted, accept the **incoming loomwork version** so
  new framework dependencies are included, then verify your project `name` and
  `description` fields are still correct. If loomwork added dependencies your
  site also added, both will be present after merge.
- `package-lock.json` — **Always delete and regenerate.** Do not try to merge
  this file manually:

```bash
git checkout --theirs package.json   # take framework deps
# Then verify and fix name/description if needed
rm package-lock.json
```

After resolving all conflicts:

```bash
git add .
```

If the merge was interrupted, complete it:

```bash
git merge --continue
```

### 4. Install dependencies

This is required after every merge — framework updates may add, remove, or
upgrade npm packages:

```bash
npm install
```

This also regenerates `package-lock.json` if you deleted it in step 3.

### 5. Check for CSS variable changes

If the merge updated `src/styles/global.css`, check whether any CSS custom
property names you reference in `src/styles/site.css` were renamed or removed:

```bash
git diff HEAD~1 HEAD -- src/styles/global.css | grep "^[-+].*--"
```

If this shows renamed variables, update `site.css` to match.

### 6. Build and verify locally

```bash
npm run build
```

The build must complete with no errors before proceeding. Warnings about sharp
or KV bindings are expected and can be ignored.

Confirm:
- Your content pages still appear in the build output
- The homepage renders (`dist/index.html`)
- The mobile editor renders (`dist/mobile/index.html`)

### 7. Add a small visible change to a content file

Pick any page in `src/content/pages/` and add a small note at the bottom (e.g.
a last-updated date). This gives you something concrete to verify the
deployment went live.

### 8. Commit

```bash
git add -A
git commit -m "Upgrade to latest loomwork framework"
```

### 9. Push

```bash
git push origin main
```

### 10. Verify deployment

Wait 1-2 minutes for Cloudflare to deploy, then check the live site. Confirm
the small content change you added in step 7 is visible. If it is, the upgrade
is complete.

---

## Notes for the agent

- If the merge produces conflicts in framework files (layouts, components,
  global.css), that means those files were edited in the site repo. Accept the
  incoming loomwork changes to get back in sync.
- If `git merge` fails entirely (unrelated histories), use:
  `git merge loomwork/main --allow-unrelated-histories`
- Do not push until the local build is clean.
- If anything goes wrong after merging, you can abort or roll back:
  - Before committing: `git merge --abort`
  - After committing: `git reset --hard HEAD~1`
