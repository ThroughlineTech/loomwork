# Loomwork Security Audit

**Initial audit:** March 3, 2026  
**Re-audit:** March 4, 2026  
**Auditor:** Independent security review  
**Scope:** Full codebase (`security` branch) + live site pen-test  
**Tested URL:** `https://security.loomwork.pages.dev`  
**Build:** Astro 5.7 static site + React mobile editor on Cloudflare Pages

---

## Executive Summary

Loomwork is a static Astro site with a client-side React mobile editor that talks directly to the GitHub API using a personal access token (PAT). The overall attack surface is small — there is no server-side runtime processing user input in production.

The initial audit on March 3 identified 18 findings (1 Critical, 3 High, 5 Medium, 5 Low, 4 Info). Significant remediation work has been completed on the `security` branch. **7 of 18 findings are now fully resolved**, 1 is partially fixed, and 10 remain open (mostly medium/low severity). No new vulnerabilities were introduced by the fixes.

### Remediation Scorecard

| Status | Count | Details |
|--------|-------|---------|
| ✅ Fixed | 7 | #1 (Critical XSS), #3, #4 (injection), #5 (headers), #8 (YouTube), #14 (noopener), #16 (generator) |
| ⚠️ Partial | 1 | #10 (deprecated `unescape` — fixed in github.ts, still in MobileApp.tsx) |
| 🔴 Open | 10 | #2, #6, #7, #9, #10 (partial), #11, #12, #13, #15, #17, #18 |

### Current Severity Breakdown (open items only)

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 1 |
| Medium   | 4 |
| Low      | 4 |
| Info     | 2 |

---

## Critical

### 1. ✅ FIXED — Stored XSS via `dangerouslySetInnerHTML` in Mobile Preview

**File:** `src/components/mobile/MobileApp.tsx` (line ~690)  
**Original risk:** Unsanitized `renderMarkdown()` output passed to `dangerouslySetInnerHTML`

**Fix applied:** DOMPurify 3.3.1 added as a dependency. Output is now sanitized:
```tsx
import DOMPurify from "dompurify";
// ...
__html: DOMPurify.sanitize(renderMarkdown(body)),
```

**Verification:** `package.json` includes `dompurify: ^3.3.1` and `@types/dompurify: ^3.0.5`. The sanitize call wraps every render path. The original PoC (`<img src=x onerror="...">`) would now be stripped by DOMPurify.

---

## High

### 2. 🔴 OPEN — GitHub PAT Stored in IndexedDB Without Encryption

**File:** `src/components/mobile/storage.ts`

The GitHub personal access token (a credential with repo read/write access) is stored in plaintext in IndexedDB under key `"credentials"`. Any XSS vulnerability or malicious browser extension can read it.

IndexedDB has no built-in encryption. On shared or compromised devices, the token is trivially extractable via DevTools or a page-context script.

**Impact:** Full repo takeover — push arbitrary code, delete branches, exfiltrate private repos.

**Mitigating factor:** With Critical #1 now fixed (DOMPurify), the primary XSS vector for stealing the PAT is closed. The risk is reduced but not eliminated — browser extensions and physical device access remain vectors.

**Fix:**
- At minimum, encrypt the token with the Web Crypto API using a key derived from a user-provided passphrase (PBKDF2 + AES-GCM)
- Better: use a fine-grained PAT scoped to only `contents:write` on the specific repo, and document this clearly for users
- Best: implement an OAuth flow with a backend proxy so the token never touches the browser

### 3. ✅ FIXED — `document.write()` with Unsanitized localStorage Values

**File:** `src/layouts/Base.astro` (lines ~121-126)

**Fix applied:** Theme names validated against `/^[a-z]+$/` regex. Font URLs validated against `https://fonts.googleapis.com/` origin check:
```js
if (theme && /^[a-z]+$/.test(theme)) {
  document.write('<link id="lw-theme" rel="stylesheet" href="/themes/' + theme + '.css">');
}
if (fonts && fonts.indexOf('https://fonts.googleapis.com/') === 0) {
  document.write('<link id="lw-fonts" rel="stylesheet" href="' + fonts + '">');
}
```

The original exploit (injecting `"><script>...` via localStorage) is no longer possible.

### 4. ✅ FIXED — Theme Picker CSS/Font Loading Uses Unsanitized Strings

**Files:** `ReaderControls.astro`, `ThemePicker.astro`, `DemoControl.astro`

**Fix applied:** All three components now validate theme names with `/^[a-z]+$/` and font URLs with `indexOf("https://fonts.googleapis.com/") === 0` before setting `.href`.

---

## Medium

### 5. ✅ FIXED — Security Headers Now Deployed

**File:** `public/_headers` (new)

**Fix applied:** `_headers` file added with security headers for Cloudflare Pages.

**Live verification (pen-test of `https://security.loomwork.pages.dev`):**
```
HTTP/1.1 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains  ✅
permissions-policy: camera=(), microphone=(), geolocation=()    ✅
referrer-policy: strict-origin-when-cross-origin                ✅
x-content-type-options: nosniff                                 ✅
x-frame-options: DENY                                           ✅
```

**CSP on `/mobile/` also confirmed:**
```
content-security-policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src https://api.github.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com  ✅
```

**Note:** The main site (`/*`) does not have a CSP due to `document.write()` and inline scripts. This is expected — adding a main-site CSP would require migrating to nonces or `strict-dynamic`, which is a larger refactor. The `/mobile/` path, which handles the PAT, is the priority and is now covered.

**Note:** Cloudflare Pages serves `Access-Control-Allow-Origin: *` by default on `*.pages.dev` domains. For a static site with no authenticated endpoints this is acceptable, but be aware that any resource on the site can be fetched cross-origin. This is a Cloudflare platform behavior, not configurable via `_headers`.

### 6. 🔴 OPEN — Service Worker Serves Stale Content with No Update Mechanism

**File:** `public/mobile/sw.js`

```js
const CACHE_NAME = "loomwork-mobile-v1";
```

The cache name is still hardcoded to `v1`. When you deploy updates, PWA users may continue getting the cached version because:
1. `skipWaiting()` activates immediately but only clears *other* caches
2. The fetch handler returns cached content first (`cached || fetched`) — stale-while-revalidate
3. There's no `updatefound` listener or user prompt to reload

**Security implications:** If a security fix is deployed, PWA users may never receive it.

**Fix:**
- Bump `CACHE_NAME` with each deploy (e.g., include a build hash or timestamp)
- Use a `network-first` strategy instead of `cache-first` for navigation requests
- Add a version check on the client that prompts users to reload when a new SW is detected

### 7. 🔴 OPEN — `execSync` in Footer.astro Runs Git Command at Build Time

**File:** `src/components/Footer.astro` (lines 6-7)

```ts
const { execSync } = await import("child_process");
const raw = execSync("git log -1 --format=%cI", { encoding: "utf-8" }).trim();
```

While this only runs at build time (not in production), it:
- Uses `execSync` which can throw and crash the build if git is not available
- In a CI/CD environment, if the git history is shallow-cloned or missing, this fails silently (caught by try/catch, which is good)
- In a fork scenario where build runs in an untrusted environment, any build-time file that calls `execSync` is a code execution vector

**Impact:** Low in isolation (build-time only, try/catch wrapped). But forks should be aware this runs shell commands during build.

**Fix:** Consider using `import.meta.env` or a Vite plugin for build metadata instead of shelling out. Or document this behavior for fork authors.

### 8. ✅ FIXED — YouTube Component Now Validates Video ID

**File:** `src/components/YouTube.astro`

**Fix applied:** Video ID validated with regex before rendering, with fallback:
```astro
const id = /^[a-zA-Z0-9_-]{11}$/.test(rawId) ? rawId : "";
// ...
{id ? ( <div class="youtube-embed">...</div> ) : <p><em>Invalid video ID.</em></p>}
```

### 9. 🔴 OPEN — Mobile App Commits Directly to `main` Branch

**File:** `src/components/mobile/github.ts` — `commitFilesBatch()` uses `branch: "main"` hardcoded, and `putFile()` commits directly to the default branch.

Any authenticated user can push directly to `main`, triggering immediate Cloudflare deployments. There is no review step, no branch protection enforcement, and no conflict resolution.

**Fix:**
- Document that GitHub branch protection rules should be enabled on `main`
- Consider having the mobile editor create commits on a branch and open a PR instead
- At minimum, add a confirmation step that shows the diff before committing

---

## Low

### 10. ⚠️ PARTIALLY FIXED — Deprecated `unescape()` Pattern

**Fixed in:** `src/components/mobile/github.ts` — replaced with `utf8ToBase64()` using `TextEncoder`:
```ts
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  return btoa(binString);
}
```

**Still present in:** `src/components/mobile/MobileApp.tsx` (line ~751):
```ts
function toBase64Utf8(content: string): string {
  return btoa(unescape(encodeURIComponent(content)));
}
```

**Fix:** Replace the `toBase64Utf8` function in MobileApp.tsx with the same `utf8ToBase64` pattern used in github.ts, or import the function from github.ts.

### 11. 🔴 OPEN — No Rate Limiting on GitHub API Calls

**File:** `src/components/mobile/github.ts`

The mobile editor makes authenticated GitHub API calls without any rate-limiting or retry logic. A rapid sequence of operations could hit GitHub's rate limits (5,000/hr for PATs) and lock the user out.

**Fix:** Add exponential backoff and check `X-RateLimit-Remaining` headers.

### 12. 🔴 OPEN — YAML Parser is Custom and Incomplete

**File:** `src/components/mobile/mdx.ts` — `parseYaml()` / `serializeYaml()`

The custom YAML parser only handles a subset of YAML. Edge cases include:
- Multi-line strings (`|` or `>` block scalars) are not supported
- Nested objects are not supported
- Values containing `:` without quotes may be misparsed
- Round-trip fidelity: parsing then serializing can change the format

While not a direct security issue, data corruption in frontmatter could lead to unexpected behavior or content exposure (e.g., a `draft: true` field being dropped, causing unpublished content to go live).

**Fix:** Use a battle-tested YAML library like `yaml` or `js-yaml` (they're small enough for client-side use).

### 13. 🔴 OPEN (Mitigated) — No CSRF Protection on Mobile Editor Actions

The mobile editor performs state-changing operations (commit to repo, delete files) using only the PAT for authentication. Since this is a client-only app with no backend session, CSRF is not a traditional concern.

**Mitigation:** `X-Frame-Options: DENY` is now deployed (see #5), preventing the `/mobile/` page from being embedded in an iframe by a malicious site. Additionally, the CSP on `/mobile/*` restricts script sources to `'self'`. Residual risk is minimal.

### 14. ✅ FIXED — External Links Now Have `rel="noopener"`

The only `target="_blank"` link in the codebase (`MobileApp.tsx` line ~665) correctly uses `rel="noopener noreferrer"`. No other external links with `target="_blank"` were found in any `.astro` component. This finding is resolved.

---

## Informational

### 15. `.gitignore` Includes `src/site.config.ts`

This means the site config (which contains the author's name, company, and site URL) won't be tracked in forks. While intentional for fork customization, it means fork authors may accidentally commit sensitive config if they remove this line.

No action needed, just awareness for fork documentation.

### 16. ✅ FIXED — `Astro.generator` Meta Tag Removed

**File:** `src/layouts/Base.astro`

The `<meta name="generator" content={Astro.generator} />` tag has been removed. The framework version is no longer exposed in page source.

### 17. Static Build Output is Public — No Sensitive Data Leakage Found

Pen-testing of `https://security.loomwork.pages.dev` confirmed:
- `/.git/config` → 404 ✅
- `/.env` → 404 ✅
- `/package.json` → 404 ✅
- `/wrangler.toml` → 404 ✅

Cloudflare Pages correctly serves only the `dist/` directory contents.

### 18. `npm audit` — Clean

```
found 0 vulnerabilities
```

All dependencies are current. The `overrides` for `undici` and `wrangler` in `package.json` are appropriately pinned to patched versions. DOMPurify 3.3.1 was added as a new dependency with no known vulnerabilities.

---

## Remaining Action Plan

### High priority (before public launch)

1. **Encrypt PAT in IndexedDB** or implement scoped OAuth (#2) — the only remaining High-severity item

### Medium priority (next sprint)

2. **Fix service worker versioning** — bump cache name with deploys (#6)
3. **Replace `execSync`** in Footer.astro with `import.meta.env` or Vite plugin (#7)
4. **Document branch protection** requirements for fork authors (#9)

### Low priority (backlog)

5. **Replace remaining `unescape()`** in MobileApp.tsx `toBase64Utf8` (#10)
6. **Add rate limiting** for GitHub API calls (#11)
7. **Replace custom YAML parser** with `js-yaml` (#12)

### Completed (this sprint) ✅

- ~~Sanitize `renderMarkdown()` output with DOMPurify~~ (#1)
- ~~Validate `document.write()` inputs~~ (#3, #4)
- ~~Add `_headers` file with security headers~~ (#5)
- ~~Validate YouTube IDs~~ (#8)
- ~~Fix `unescape()` in github.ts~~ (#10 partial)
- ~~Remove `Astro.generator` meta tag~~ (#16)
- ~~Verify `rel="noopener"` coverage~~ (#14)

---

## Testing Methodology

- **Static analysis:** Full manual code review of all source files + git diff review of `security` branch changes
- **Dependency audit:** `npm audit` (0 vulnerabilities), `npm outdated` (all current)
- **Live pen-test:** HTTP header inspection of `https://security.loomwork.pages.dev` and `/mobile/` path, sensitive file probing (`.git/config`, `.env`, `package.json`, `wrangler.toml`)
- **XSS analysis:** Traced all user-controlled data flows through `dangerouslySetInnerHTML`, `document.write()`, `innerHTML`, and `set:html`; verified DOMPurify integration
- **Authentication review:** Analyzed PAT storage, transmission, and scope
- **Service worker audit:** Cache strategy and update mechanism review
- **Header verification:** Confirmed all security headers are served on deployed site (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP on /mobile/)

---

*Initial audit: March 3, 2026. Re-audit: March 4, 2026 against `security` branch deployed to `https://security.loomwork.pages.dev`. Re-audit after significant changes or before major releases.*
