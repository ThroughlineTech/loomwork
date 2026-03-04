# Loomwork Security Audit

**Initial audit:** March 3, 2026  
**Re-audit #1:** March 3, 2026 — Phase 1 fixes verified  
**Re-audit #2:** March 3, 2026 — No new code changes; re-verified deployed site  
**Re-audit #3:** March 3, 2026 — Phase 2 security hardening (`security: phase 2`) verified  
**Auditor:** Independent security review  
**Scope:** Full codebase (`security` branch) + live site pen-test  
**Tested URL:** `https://security.loomwork.pages.dev`  
**Build:** Astro 5.7 static site + React mobile editor on Cloudflare Pages

---

## Executive Summary

Loomwork is a static Astro site with a client-side React mobile editor that talks directly to the GitHub API using a personal access token (PAT). The overall attack surface is small — there is no server-side runtime processing user input in production.

The initial audit on March 3 identified 18 findings (1 Critical, 3 High, 5 Medium, 5 Low, 4 Info). Two phases of remediation have been completed on the `security` branch. **Phase 1** resolved the critical XSS, input validation, security headers, and several lower items. **Phase 2** addressed PAT encryption, service worker versioning, `execSync` removal, feature-branch commits, the deprecated `unescape()` pattern, and replaced the custom YAML parser with a proper library. The mobile editor has also been temporarily disabled during hardening.

**15 of 18 findings are now fully resolved.** No Critical or High issues remain. The 3 remaining items are Low severity or informational.

### Remediation Scorecard

| Status | Count | Details |
|--------|-------|---------|
| ✅ Fixed | 15 | #1 (XSS), #2 (PAT encryption), #3, #4 (injection), #5 (headers), #6 (SW), #7 (execSync), #8 (YouTube), #9 (branch commits), #10 (unescape), #12 (YAML), #13 (CSRF mitigated), #14 (noopener), #16 (generator), #18 (deps clean) |
| 🔴 Open | 3 | #11 (rate limiting — Low), #15 (gitignore — Info), #17 (no leakage — Info) |

### Current Severity Breakdown (open items only)

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High     | 0 |
| Medium   | 0 |
| Low      | 1 |
| Info     | 2 |

---

## Critical

### 1. ✅ FIXED — Stored XSS via `dangerouslySetInnerHTML` in Mobile Preview

**File:** `src/components/mobile/MobileApp.tsx` (line ~719)  
**Original risk:** Unsanitized `renderMarkdown()` output passed to `dangerouslySetInnerHTML`

**Fix applied (Phase 1):** DOMPurify 3.3.1 added as a dependency. Output is now sanitized:
```tsx
import DOMPurify from "dompurify";
// ...
__html: DOMPurify.sanitize(renderMarkdown(body)),
```

**Verification:** `package.json` includes `dompurify: ^3.3.1` and `@types/dompurify: ^3.0.5`. The sanitize call wraps every render path.

---

## High

### 2. ✅ FIXED — GitHub PAT Encrypted at Rest with AES-GCM

**File:** `src/components/mobile/storage.ts`

**Original risk:** PAT stored in plaintext in IndexedDB.

**Fix applied (Phase 2):** Full encryption implementation using Web Crypto API:
- PBKDF2 key derivation (100,000 iterations, SHA-256) from a user-provided passphrase
- AES-GCM (256-bit) encryption of the credential JSON
- Random 16-byte salt per save, random 12-byte IV per encryption
- Salt and encrypted blob stored as separate IndexedDB keys (`credentials_salt`, `credentials_enc`)
- Legacy unencrypted credentials removed on save
- Login form now requires an encryption passphrase field
- Login UI updated to recommend fine-grained PATs scoped to `Contents: Read and write`

**Verification:** Confirmed `deriveKey()`, `encryptString()`, `decryptString()` functions in storage.ts. `saveCredentials()` accepts passphrase, generates salt, encrypts, and removes legacy plaintext. `getCredentials()` handles both encrypted (with passphrase) and legacy (migration) paths. MobileApp.tsx login handler passes passphrase through.

### 3. ✅ FIXED — `document.write()` with Unsanitized localStorage Values

**File:** `src/layouts/Base.astro` (lines ~121-126)

**Fix applied (Phase 1):** Theme names validated against `/^[a-z]+$/` regex. Font URLs validated against `https://fonts.googleapis.com/` origin check.

### 4. ✅ FIXED — Theme Picker CSS/Font Loading Uses Unsanitized Strings

**Files:** `ReaderControls.astro`, `ThemePicker.astro`, `DemoControl.astro`

**Fix applied (Phase 1):** All three components validate theme names and font URLs before setting `.href`.

---

## Medium

### 5. ✅ FIXED — Security Headers Deployed and Verified

**File:** `public/_headers`

**Live verification (pen-test of `https://security.loomwork.pages.dev`):**
```
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

**Note:** Cloudflare Pages serves `Access-Control-Allow-Origin: *` by default on `*.pages.dev` domains. For a static site with no authenticated endpoints this is acceptable. This is a Cloudflare platform behavior, not configurable via `_headers`.

### 6. ✅ FIXED — Service Worker Now Uses Versioned Cache + Network-First

**File:** `public/mobile/sw.js`

**Original risk:** Hardcoded `v1` cache name with cache-first strategy — PWA users would never get security updates.

**Fix applied (Phase 2):**
```js
const CACHE_VERSION = "2026-03-03T00";  // bump with each deploy
const CACHE_NAME = `loomwork-mobile-${CACHE_VERSION}`;
```
- Cache name now includes a version timestamp to bump per deploy
- Strategy changed from cache-first (`cached || fetched`) to **network-first** with cache fallback (`.catch(() => caches.match(event.request))`)
- Old caches are purged on activate

**Verification:** Confirmed network-first fetch handler (`fetch(event.request).then(...).catch(() => caches.match(...))`) and versioned cache name in sw.js.

### 7. ✅ FIXED — `execSync` Replaced with `import.meta.env.BUILD_DATE`

**File:** `src/components/Footer.astro`

**Original risk:** `execSync("git log -1 --format=%cI")` at build time — shell command execution in a fork-able codebase.

**Fix applied (Phase 2):** Footer now reads `import.meta.env.BUILD_DATE` instead of shelling out:
```ts
const buildDate = import.meta.env.BUILD_DATE || "";
```
The build date is injected via Vite's `define` in `astro.config.mjs`:
```js
vite: {
  define: {
    "import.meta.env.BUILD_DATE": JSON.stringify(new Date().toISOString()),
  },
}
```

No more `execSync`, no more `child_process` import. Build works even without git.

### 8. ✅ FIXED — YouTube Component Validates Video ID

**File:** `src/components/YouTube.astro`

**Fix applied (Phase 1):** Regex validation `/^[a-zA-Z0-9_-]{11}$/` with fallback to "Invalid video ID" message.

### 9. ✅ FIXED — Mobile App Now Commits to Feature Branches

**File:** `src/components/mobile/MobileApp.tsx`, `src/components/mobile/github.ts`

**Original risk:** All commits pushed directly to `main`, triggering immediate production deploys.

**Fix applied (Phase 2):**
- New `getBranchSha()` and `createBranch()` functions added to github.ts
- Mobile editor now creates a `mobile/{timestamp}` feature branch from `main` before committing
- Both single-file and batch commits go to the feature branch
- Commit dialog updated: "This will create a new branch from main and commit your changes there. Open a pull request on GitHub to merge."
- Success message: "Committed to branch 'mobile/{timestamp}'. Open a PR to merge to main."

**Verification:** Confirmed `createBranch()` in github.ts creates `refs/heads/{branchName}` from main's SHA. MobileApp.tsx `handleCommit()` calls `createBranch()` before `commitFilesBatch()` with the feature branch name.

---

## Low

### 10. ✅ FIXED — Deprecated `unescape()` Fully Replaced

**Files:** `src/components/mobile/github.ts`, `src/components/mobile/MobileApp.tsx`

**Fix applied:**
- **github.ts (Phase 1):** `utf8ToBase64()` using `TextEncoder` replaces `btoa(unescape(encodeURIComponent(...)))`
- **MobileApp.tsx (Phase 2):** `toBase64Utf8()` rewritten with the same `TextEncoder` pattern:
```ts
function toBase64Utf8(content: string): string {
  const bytes = new TextEncoder().encode(content);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  return btoa(binString);
}
```

No `unescape()` calls remain in the codebase.

### 11. 🔴 OPEN — No Rate Limiting on GitHub API Calls

**File:** `src/components/mobile/github.ts`

The mobile editor makes authenticated GitHub API calls without any rate-limiting or retry logic. A rapid sequence of operations could hit GitHub's rate limits (5,000/hr for PATs).

**Mitigating factor:** The mobile editor is currently disabled (maintenance page) while hardening is in progress. When re-enabled, this should be addressed.

**Fix:** Add exponential backoff and check `X-RateLimit-Remaining` headers.

### 12. ✅ FIXED — Custom YAML Parser Replaced with `yaml` Library

**File:** `src/components/mobile/mdx.ts`

**Original risk:** Custom regex-based YAML parser couldn't handle multi-line strings, nested objects, or colons in values. Data corruption could cause draft/published state issues.

**Fix applied (Phase 2):** The entire custom `parseYaml()` and `serializeYaml()` implementation (80+ lines) has been replaced with the `yaml` library (v2.8.2):
```ts
import { parse as yamlParse, stringify as yamlStringify } from "yaml";

function parseYaml(str: string): Record<string, any> {
  try {
    const result = yamlParse(str);
    return result && typeof result === "object" ? result : {};
  } catch {
    return {};
  }
}

function serializeYaml(obj: Record<string, any>): string {
  return yamlStringify(obj, { lineWidth: 0 });
}
```

**Verification:** `package.json` includes `yaml: ^2.8.2`. The `yaml` library supports full YAML 1.2 spec including block scalars, nested objects, and special characters.

### 13. ✅ FIXED (Mitigated) — CSRF Protection via Headers + CSP

**Original risk:** Mobile editor in iframe could be manipulated by attacker pages.

**Mitigation:** `X-Frame-Options: DENY` prevents iframe embedding. CSP on `/mobile/*` restricts scripts to `'self'` only. Additionally, the mobile editor is currently disabled. Residual risk is negligible.

### 14. ✅ FIXED — External Links Have `rel="noopener"`

The only `target="_blank"` link in the codebase correctly uses `rel="noopener noreferrer"`.

---

## Informational

### 15. `.gitignore` Includes `src/site.config.ts`

Intentional for fork customization. No action needed, just awareness for fork documentation.

### 16. ✅ FIXED — `Astro.generator` Meta Tag Removed

The framework version is no longer exposed in page source.

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

All dependencies are current. DOMPurify 3.3.1 and yaml 2.8.2 added with no known vulnerabilities.

---

## Additional Observation: Mobile Editor Temporarily Disabled

**File:** `src/pages/mobile/index.astro`

The mobile editor React component has been commented out and replaced with a maintenance page:
```
The mobile editor is temporarily disabled while security improvements are being completed.
```

The `MobileApp` import is commented out, the service worker registration script is removed, and the `<meta name="apple-mobile-web-app-capable">` and `<link rel="manifest">` tags are removed. This is a sound approach — the editor remains in the codebase with all security fixes applied, but is not executable on the live site during hardening.

**When re-enabling:** Uncomment the MobileApp import and component, re-add the service worker registration, and consider adding the rate-limiting fix (#11) at the same time.

---

## Remaining Action Plan

### Before re-enabling the mobile editor

1. **Add rate limiting** for GitHub API calls (#11) — the only remaining Low-severity code item

### Backlog / Nice-to-have

2. Re-enable mobile editor with all security fixes active
3. Add a main-site CSP using nonces or `strict-dynamic` (currently blocked by inline scripts)
4. Consider automating `CACHE_VERSION` bump in sw.js via build script

### Completed ✅

| Phase | Findings Resolved |
|-------|-------------------|
| Phase 1 | #1 (Critical XSS), #3 + #4 (input validation), #5 (security headers), #8 (YouTube), #10 partial (github.ts), #14 (noopener), #16 (generator meta) |
| Phase 2 | #2 (PAT encryption), #6 (SW versioning + network-first), #7 (execSync → Vite env), #9 (feature branches), #10 complete (MobileApp.tsx), #12 (yaml library), #13 (CSRF mitigated), mobile editor disabled |

---

## Testing Methodology

- **Static analysis:** Full manual code review of all source files + git diff review of both `security` branch commits
- **Dependency audit:** `npm audit` (0 vulnerabilities), `npm outdated` (all current)
- **Live pen-test:** HTTP header inspection of `https://security.loomwork.pages.dev` and `/mobile/` path, sensitive file probing (`.git/config`, `.env`, `package.json`, `wrangler.toml`)
- **XSS analysis:** Traced all user-controlled data flows through `dangerouslySetInnerHTML`, `document.write()`, `innerHTML`, and `set:html`; verified DOMPurify integration
- **Authentication review:** Analyzed PAT storage encryption (PBKDF2 + AES-GCM), transmission, and scope
- **Service worker audit:** Cache strategy (network-first) and versioned cache name review
- **Header verification:** Confirmed all security headers served on deployed site (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, CSP on /mobile/)
- **Branch workflow audit:** Verified feature-branch commit flow replaces direct-to-main pushes

---

*Initial audit: March 3, 2026. Phase 1 fixes verified: March 3, 2026. Phase 2 fixes verified: March 3, 2026. 15 of 18 findings resolved, 0 Critical/High remaining. Re-audit after significant changes or before major releases.*
