// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SITE CONFIG - SITE-SPECIFIC FILE
//
// This file is YOURS. Edit it freely. It won't conflict
// with framework updates from the loomwork repo.
//
// Everything site-specific - name, nav, branding - lives here.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SITE = {
  // ── Identity ────────────────────────────────────────────
  name: "Loomwork",
  tagline: "A content-first Astro starter for crafting sites by hand",
  description:
    "MDX + Content Collections + Cloudflare Pages. Write markdown, push to GitHub, auto-deploy in 30 seconds.",
  url: "https://www.loomwork.org",
  author: "Dan",
  email: "",

  // ── Navigation ──────────────────────────────────────────
  // "Home" is automatically prepended. Set nav_home: false to remove it.
  nav_home: true,

  // Update these to match your content pages:
  nav: [
    { label: "About", href: "/about_Loomwork" },
    { label: "Building", href: "/building" },
    { label: "Theming", href: "/theming" },
    { label: "Page Types", href: "/page-types" },
    { label: "Controls", href: "/reader-controls" },
    { label: "Deploy", href: "/guide" },
    { label: "Progress", href: "/progress" },
  ],

  // ── Fonts ───────────────────────────────────────────────
  // Google Fonts URL. Themes load their own fonts automatically.
  // Set this only if you want to override the theme's font choices.
  // Leave empty to use the theme's default fonts (or system fonts if no theme).
  fonts_url: "",

  // ── Social ──────────────────────────────────────────────
  social: {
    github: "https://github.com/danrichardson/loomwork",
  },

  // ── Footer ──────────────────────────────────────────────
  footer: {
    company: "Throughline Technical Services, LLC",
    license: "MIT License",
  },

  // ── Theme ───────────────────────────────────────────────
  // Pick a built-in theme: "manuscript", "brutalist", "atelier",
  // "terminal", "gazette", "alpine", "campfire", "moonrise",
  // "fieldnotes", "neon"
  // Or leave empty / omit to use framework defaults + your site.css overrides.
  theme: "manuscript",

  // ── Reader Controls ─────────────────────────────────────
  // Set to true to show the floating reader-controls panel
  // (dark mode toggle, font size, TOC toggle, content width, focus mode)
  reader_controls: true,
} as const;

export type SiteConfig = typeof SITE;
