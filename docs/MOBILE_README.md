# Loomwork Mobile - Quick Start

Loomwork Mobile is the built-in PWA editor served at `/mobile`.

## What It Does Today (v1)

- Connects directly to GitHub with a Personal Access Token (PAT)
- Lists files from:
  - `src/content/pages`
  - `src/content/posts`
- Opens `.mdx` files for edit
- Supports body editing, frontmatter edits, preview, and publish (commit to `main`)
- Saves local drafts in IndexedDB
- Installable as a PWA on iOS/Android

## Deploy / Access

1. Push this repo to GitHub.
2. Let Cloudflare Pages deploy.
3. Open:
   - `https://<your-domain>/mobile`

`/mobile` redirects to `/mobile/` and should open the app shell.

## First-Time Login

On the login screen, enter:

- **GitHub Repository**: `owner/repo` (or full GitHub repo URL)
- **Personal Access Token**: from your GitHub account

### Token Guidance

Use a **fine-grained PAT** from:

`GitHub → Settings → Developer settings → Personal access tokens`

Recommended minimum repo permissions:

- `Contents: Read and write`
- `Metadata: Read`

The token is stored in browser IndexedDB. Re-enter only if local app data is cleared/evicted.

## PWA Notes

- iOS standalone mode does not reliably support pull-to-refresh.
- Use the in-app **Reload app** button (`⟲`) in the header.
- App updates are picked up after deploy and app reload/reopen.

## Editing Content

1. Open a page/post file from the browser screen.
2. Edit body/frontmatter.
3. Tap **Publish**.
4. Confirm commit appears in GitHub.
5. Wait for Cloudflare auto-deploy.

## Images in Content (Current State)

Yes, you can add images now by editing markdown directly in the body, e.g.:

```md
![Alt text](/images/my-photo.jpg)
```

And/or set `hero_image` in frontmatter.

You can also use the editor toolbar image button (`🖼️`) in Edit mode to pick a photo from your phone. The app queues the image for `public/images/`, auto-inserts markdown, and commits both image + doc together when you tap **Publish**.

## Known Limitations (for now)

- No OAuth (PAT only)
- Image picker is available, but there is no media library browser yet
- No schema-driven dynamic frontmatter form yet (baseline fields are currently hardcoded)
- **Mobile editor is currently disabled** — the `/mobile` page shows a maintenance notice while security hardening is completed

## Roadmap

- **Pre-commit preview / diff view** — show a summary of all changes before committing so the author can review what will be pushed
- **PR workflow integration** — after creating a feature branch, offer a one-tap "Open PR" link to GitHub
- **Passphrase-based session unlock** — encrypted credentials require the passphrase each session; add an unlock screen instead of full re-login
- **Schema-driven frontmatter forms** — read `loomwork.schema.json` at runtime to dynamically generate the form
- **Media library browser** — browse and manage images in `public/images/` from within the editor
- **Conflict detection** — warn when the remote file has changed since the editor loaded it
- **Rate limit awareness** — show remaining GitHub API quota and gracefully handle 429s

## Suggested Smoke Test

1. Open `/mobile` on desktop and mobile.
2. Install to home screen.
3. Log in with `owner/repo` + PAT.
4. Edit one page and publish.
5. Verify commit and Cloudflare deploy.
6. Reopen app and verify persisted login.
