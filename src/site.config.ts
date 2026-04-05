export const SITE = {
  name: "Throughline",
  tagline: "A Interactive Exhibit",
  description: "A 6,963-line AI session that designed a brilliant experiment — then spent 3,328 lines saying 'Done.' over and over.",
  url: "https://throughlinetech.net",
  author: "Dan",
  email: "hello@throughlinetech.net",

  nav_home: true,
  nav: [
    { label: "About the Project", href: "/about" },
    { label: "Transcript", href: "/transcript" },
  ],

  fonts_url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Merriweather:ital,wght@0,300;0,700;1,300&family=IBM+Plex+Mono:wght@400;500&display=swap",

  social: {},

  footer: {
    company: "Throughline Technical Services, LLC",
    license: "All rights reserved.",
  },

  theme: "brutalist", // Or empty to use the custom CSS we injected

  reader_controls: true,
} as const;

export type SiteConfig = typeof SITE;
