// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GITHUB SERVICE - Talks to GitHub REST API via PAT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const API = "https://api.github.com";

/** UTF-8-safe base64 encoding (replaces deprecated unescape/encodeURIComponent pattern) */
function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  const binString = Array.from(bytes, (b) => String.fromCodePoint(b)).join("");
  return btoa(binString);
}

export interface RepoFile {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
}

export interface FileContent {
  content: string; // decoded
  sha: string;
  path: string;
  encoding: string;
}

export interface CommitResult {
  sha: string;
  html_url: string;
}

export interface BatchFileInput {
  path: string;
  contentBase64: string;
}

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

// ── Rate-limit-aware fetch wrapper ────────────────────────

let _rateLimitRemaining: number | null = null;
let _rateLimitReset: number | null = null;

/** Current rate limit state (read-only, for UI display) */
export function getRateLimitInfo(): { remaining: number | null; resetsAt: Date | null } {
  return {
    remaining: _rateLimitRemaining,
    resetsAt: _rateLimitReset ? new Date(_rateLimitReset * 1000) : null,
  };
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

/**
 * Fetch wrapper that:
 * 1. Tracks X-RateLimit-Remaining / X-RateLimit-Reset from every response
 * 2. Retries on 429 with exponential backoff (1s → 2s → 4s)
 * 3. Waits if we already know we're rate-limited before even sending
 */
async function ghFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Pre-flight: if we know we're exhausted, wait until reset
  if (_rateLimitRemaining !== null && _rateLimitRemaining <= 0 && _rateLimitReset) {
    const waitMs = Math.max(0, _rateLimitReset * 1000 - Date.now()) + 1000;
    if (waitMs > 0 && waitMs < 120_000) {
      await sleep(waitMs);
    }
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(input, init);

    // Track rate limit headers from every response
    const remaining = res.headers.get("X-RateLimit-Remaining");
    const reset = res.headers.get("X-RateLimit-Reset");
    if (remaining !== null) _rateLimitRemaining = parseInt(remaining, 10);
    if (reset !== null) _rateLimitReset = parseInt(reset, 10);

    if (res.status !== 429 && res.status !== 403) return res;

    // 403 can also mean secondary rate limit — check the body hint
    if (res.status === 403) {
      const body = await res.clone().text();
      if (!body.includes("rate limit") && !body.includes("abuse")) return res;
    }

    // Rate limited — retry with backoff
    if (attempt < MAX_RETRIES) {
      const retryAfter = res.headers.get("Retry-After");
      const delayMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt);
      await sleep(Math.min(delayMs, 60_000));
    } else {
      lastError = new Error(`GitHub API rate limited after ${MAX_RETRIES} retries (${res.status})`);
    }
  }
  throw lastError || new Error("GitHub API rate limited");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Parse "owner/repo" from a full GitHub URL or "owner/repo" string */
export function parseRepo(input: string): { owner: string; repo: string } {
  const cleaned = input.replace(/\.git$/, "").replace(/\/$/, "");
  const match = cleaned.match(/(?:github\.com\/)?([^/]+)\/([^/]+)$/);
  if (!match) throw new Error("Invalid repo format. Use owner/repo or a GitHub URL.");
  return { owner: match[1], repo: match[2] };
}

/** Validate the token can access the repo */
export async function validateToken(
  token: string,
  owner: string,
  repo: string
): Promise<boolean> {
  const res = await ghFetch(`${API}/repos/${owner}/${repo}`, {
    headers: headers(token),
  });
  return res.ok;
}

/** List files in a directory */
export async function listFiles(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<RepoFile[]> {
  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/contents/${path}`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(`Failed to list ${path}: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((f: any) => ({
    name: f.name,
    path: f.path,
    sha: f.sha,
    type: f.type,
  }));
}

/** Recursively list all files under a path */
export async function listFilesRecursive(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<RepoFile[]> {
  const items = await listFiles(token, owner, repo, path);
  const results: RepoFile[] = [];
  for (const item of items) {
    if (item.type === "file") {
      results.push(item);
    } else if (item.type === "dir") {
      const children = await listFilesRecursive(token, owner, repo, item.path);
      results.push(...children);
    }
  }
  return results;
}

/** Get file content (decoded from base64) */
export async function getFile(
  token: string,
  owner: string,
  repo: string,
  path: string
): Promise<FileContent> {
  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/contents/${path}`,
    { headers: headers(token) }
  );
  if (!res.ok) throw new Error(`Failed to get ${path}: ${res.status}`);
  const data = await res.json();
  const bytes = Uint8Array.from(atob(data.content.replace(/\n/g, "")), c => c.charCodeAt(0));
  const content = new TextDecoder().decode(bytes);
  return {
    content,
    sha: data.sha,
    path: data.path,
    encoding: data.encoding,
  };
}

/** Create or update a file */
export async function putFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string // required for updates, omit for new files
): Promise<CommitResult> {
  const body: any = {
    message,
    content: utf8ToBase64(content),
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to save ${path}: ${res.status} ${err.message || ""}`);
  }
  const data = await res.json();
  return {
    sha: data.commit.sha,
    html_url: data.commit.html_url,
  };
}

/** Create or update a file using already-base64-encoded content (binary-safe) */
export async function putFileBase64(
  token: string,
  owner: string,
  repo: string,
  path: string,
  base64Content: string,
  message: string,
  sha?: string
): Promise<CommitResult> {
  const body: any = {
    message,
    content: base64Content,
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      headers: headers(token),
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to save ${path}: ${res.status} ${err.message || ""}`);
  }
  const data = await res.json();
  return {
    sha: data.commit.sha,
    html_url: data.commit.html_url,
  };
}

/** Commit multiple files in a single Git commit on a branch */
export async function commitFilesBatch(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  message: string,
  files: BatchFileInput[]
): Promise<CommitResult> {
  if (!files.length) {
    throw new Error("No files provided for batch commit.");
  }

  const refRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: headers(token) }
  );
  if (!refRes.ok) {
    throw new Error(`Failed to read branch ${branch}: ${refRes.status}`);
  }
  const refData = await refRes.json();
  const headSha = refData.object?.sha;

  const headCommitRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/commits/${headSha}`,
    { headers: headers(token) }
  );
  if (!headCommitRes.ok) {
    throw new Error(`Failed to read HEAD commit: ${headCommitRes.status}`);
  }
  const headCommitData = await headCommitRes.json();
  const baseTreeSha = headCommitData.tree?.sha;

  const treeEntries = [];
  for (const file of files) {
    const blobRes = await ghFetch(
      `${API}/repos/${owner}/${repo}/git/blobs`,
      {
        method: "POST",
        headers: headers(token),
        body: JSON.stringify({
          content: file.contentBase64,
          encoding: "base64",
        }),
      }
    );
    if (!blobRes.ok) {
      const err = await blobRes.json().catch(() => ({}));
      throw new Error(`Failed to create blob for ${file.path}: ${blobRes.status} ${err.message || ""}`);
    }
    const blobData = await blobRes.json();
    treeEntries.push({
      path: file.path,
      mode: "100644",
      type: "blob",
      sha: blobData.sha,
    });
  }

  const treeRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/trees`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    }
  );
  if (!treeRes.ok) {
    const err = await treeRes.json().catch(() => ({}));
    throw new Error(`Failed to create tree: ${treeRes.status} ${err.message || ""}`);
  }
  const treeData = await treeRes.json();

  const commitRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/commits`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [headSha],
      }),
    }
  );
  if (!commitRes.ok) {
    const err = await commitRes.json().catch(() => ({}));
    throw new Error(`Failed to create commit: ${commitRes.status} ${err.message || ""}`);
  }
  const commitData = await commitRes.json();

  const updateRefRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers: headers(token),
      body: JSON.stringify({ sha: commitData.sha, force: false }),
    }
  );
  if (!updateRefRes.ok) {
    const err = await updateRefRes.json().catch(() => ({}));
    throw new Error(`Failed to update branch ${branch}: ${updateRefRes.status} ${err.message || ""}`);
  }

  return {
    sha: commitData.sha,
    html_url: `https://github.com/${owner}/${repo}/commit/${commitData.sha}`,
  };
}

/** Delete a file */
export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "DELETE",
      headers: headers(token),
      body: JSON.stringify({ message, sha }),
    }
  );
  if (!res.ok) throw new Error(`Failed to delete ${path}: ${res.status}`);
}

/** Get the SHA of a branch head (null if branch doesn't exist) */
export async function getBranchSha(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<string | null> {
  const res = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/ref/heads/${branch}`,
    { headers: headers(token) }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.object?.sha ?? null;
}

/** Create a branch from a base branch (e.g. main). Returns the SHA. */
export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  newBranch: string,
  fromBranch: string = "main"
): Promise<string> {
  // Get the SHA of the base branch
  const baseRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/ref/heads/${fromBranch}`,
    { headers: headers(token) }
  );
  if (!baseRes.ok) throw new Error(`Base branch '${fromBranch}' not found: ${baseRes.status}`);
  const baseData = await baseRes.json();
  const baseSha = baseData.object?.sha;
  if (!baseSha) throw new Error(`Could not read SHA of ${fromBranch}`);

  // Create the new ref
  const createRes = await ghFetch(
    `${API}/repos/${owner}/${repo}/git/refs`,
    {
      method: "POST",
      headers: headers(token),
      body: JSON.stringify({ ref: `refs/heads/${newBranch}`, sha: baseSha }),
    }
  );
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Failed to create branch '${newBranch}': ${createRes.status} ${err.message || ""}`);
  }
  return baseSha;
}
