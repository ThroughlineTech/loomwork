// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MDX UTILITIES - Parse frontmatter, split content
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { parse as yamlParse, stringify as yamlStringify } from "yaml";

export interface ParsedFile {
  frontmatter: Record<string, any>;
  body: string;
  raw: string;
}

/** Parse YAML frontmatter from MDX/MD content */
export function parseFile(raw: string): ParsedFile {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: raw, raw };
  }
  const yamlStr = match[1];
  const body = match[2];
  const frontmatter = parseYaml(yamlStr);
  return { frontmatter, body, raw };
}

/** Serialize frontmatter + body back to MDX string */
export function serializeFile(
  frontmatter: Record<string, any>,
  body: string
): string {
  const yaml = serializeYaml(frontmatter);
  return `---\n${yaml}---\n${body}`;
}

/** Parse YAML string into an object using the yaml library */
function parseYaml(str: string): Record<string, any> {
  try {
    const result = yamlParse(str);
    return result && typeof result === "object" ? result : {};
  } catch {
    return {};
  }
}

/** Serialize object to YAML string using the yaml library */
function serializeYaml(obj: Record<string, any>): string {
  return yamlStringify(obj, { lineWidth: 0 });
}

/** Render very basic markdown to HTML (for preview without dependencies) */
export function renderMarkdown(md: string): string {
  let html = md
    // Code blocks (must be before other transforms)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) =>
      `<pre><code class="language-${lang}">${escapeHtml(code.trim())}</code></pre>`)
    // Headers
    .replace(/^#### (.+)$/gm, "<h4>$1</h4>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr />")
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Blockquote
    .replace(/^>\s*(.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    // Unordered list items
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Paragraphs (lines that aren't already wrapped in tags)
    .replace(/^(?!<[a-z/])((?!^\s*$).+)$/gm, "<p>$1</p>");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  return html;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Extract title from frontmatter or filename */
export function getTitle(frontmatter: Record<string, any>, filename: string): string {
  return frontmatter.title || filename.replace(/\.mdx?$/, "").replace(/[-_]/g, " ");
}

/** Default frontmatter for new pages */
export function defaultPageFrontmatter(): Record<string, any> {
  return {
    title: "",
    description: "",
    section: "",
    template: "default",
    draft: true,
    tags: [],
  };
}

/** Default frontmatter for new posts */
export function defaultPostFrontmatter(): Record<string, any> {
  return {
    title: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    author: "",
    tags: [],
    draft: true,
  };
}
