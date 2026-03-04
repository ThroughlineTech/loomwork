# Changelog / Progress Page Prompt

Use this prompt to instruct an agent to update a site's progress page based on
recent git activity. The agent reads commits and diffs, groups changes into
readable entries, and updates a static MDX page. No runtime data fetching needed.

---

## Prompt

Your task is to update the progress page for this site. This page is a
human-readable changelog that summarizes what has been built, fixed, and
improved — written for visitors, not developers.

### Step 1: Find the last update date

Read `src/content/pages/progress.mdx`. Find the most recent date heading
(e.g., `## March 3, 2026`). This is the cutoff — you only need to document
changes AFTER this date.

If progress.mdx doesn't exist, create it using the starter template at the
end of this prompt and set the cutoff to 30 days ago.

### Step 2: Gather changes

Run:

```bash
git log --oneline --after="CUTOFF_DATE" --no-merges
```

For any commit that isn't self-explanatory from its message, read the diff:

```bash
git diff COMMIT_HASH~1 COMMIT_HASH --stat
```

If the stat shows interesting file changes, read the actual diff for key files
to understand what changed and why.

### Step 3: Group changes

Organize changes into these categories (skip any category with zero entries):

| Category | Icon | What goes here |
|----------|------|---------------|
| **Features** | ✦ | New pages, components, functionality |
| **Design** | ◈ | Visual changes, CSS, layout, theme work |
| **Content** | ✎ | New or updated written content |
| **Infrastructure** | ⚙ | Build, deploy, config, dependencies |
| **Fixes** | ✓ | Bug fixes, corrections |

### Step 4: Write entries

For each change, write ONE line that answers: "What does a visitor or site
owner see or get from this change?"

**Good entries:**
- ✦ Deep dive pages now have a split-panel layout with persistent sidebar navigation
- ◈ Site switches to the Manuscript theme — warm serif headings, tighter spacing
- ⚙ Framework upgraded to Loomwork 2.1 with theme-aware header height
- ✓ Deep dive titles no longer hidden behind the fixed header

**Bad entries (too developer-y or vague):**
- Fixed CSS specificity issue in global.css
- Updated package.json
- Merge branch 'release/2.1'
- Various improvements

Each entry should be a single line. No sub-bullets. No code snippets.

### Step 5: Write the date section

Add a new `## Date` heading at the TOP of the content body (after the
frontmatter and imports, before the previous date section). Format:

```markdown
## March 4, 2026

- ✦ Added auto-rotating feature showcase to the homepage
- ◈ Tightened spacing throughout the design system
- ⚙ Upgraded to Loomwork 2.1 — new `--header-height` CSS variable
- ✓ Fixed longform page content being cut off by the header
```

### Step 6: Update the frontmatter date

Update the `date_updated` field in the frontmatter to today's date.

### Step 7: Build and verify

```bash
npm run build
```

Confirm the progress page appears in the build output. If the build fails,
fix the issue before continuing.

### Step 8: Commit

```bash
git add src/content/pages/progress.mdx
git commit -m "Update progress page through DATE"
```

---

## Starter template

If no progress.mdx exists, create `src/content/pages/progress.mdx`:

```mdx
---
title: "Progress"
description: "What's been built, fixed, and improved — a running changelog."
template: "guide"
date_created: TODAY_DATE
date_updated: TODAY_DATE
nav_order: 90
---

## MONTH DAY, YEAR

- ✦ Initial launch
```

Replace TODAY_DATE with the current date in `YYYY-MM-DD` format, and
MONTH DAY, YEAR with the human-readable date.

---

## Notes for the agent

- **Tone:** Clear, direct, past tense. "Added X" not "X was added" or "We added X."
- **Granularity:** One entry per user-visible change. Collapse 5 commits that
  all fix the same feature into one entry. Don't list every commit.
- **Skip:** Merge commits, lock file updates, formatting-only commits, anything
  with no user-visible effect.
- **Order within a date:** Features first, then Design, Content, Infrastructure, Fixes.
- **If there are no changes since the last update:** Do nothing. Report "No changes since [date]."
- **Keep the file growing:** Never delete previous date sections. The page is
  an append-only log. Old entries stay forever.
- **Max entries per date section:** ~15. If there are more, consolidate related
  changes into broader entries.
