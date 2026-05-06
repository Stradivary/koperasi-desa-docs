// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "MBCS NFC Wallet",
  tagline:
    "Offline NFC wallet system — system design and technical specifications",
  favicon: "img/favicon.ico",

  // Set the production URL of your site here.
  // Update stradivary and koperasi-kegelapan-docs to match your GitHub organisation and repository.
  url: "https://stradivary.github.io",
  baseUrl: "/koperasi-kegelapan-docs/",

  organizationName: "stradivary",
  projectName: "koperasi-kegelapan-docs",

  onBrokenLinks: "throw",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  presets: [
    [
      "classic",
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: "./sidebars.js",
          // Remove or replace the editUrl with your own GitHub repo URL to enable
          // "Edit this page" links on every doc page.
          // editUrl: 'https://github.com/stradivary/koperasi-kegelapan-docs/tree/main/',
          routeBasePath: "/",
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: "MBCS NFC Wallet",
        items: [
          {
            type: "dropdown",
            label: "Spec Layers",
            position: "left",
            items: [
              {
                type: "docSidebar",
                sidebarId: "productSpecSidebar",
                label: "1. Product Spec",
              },
              {
                type: "docSidebar",
                sidebarId: "systemDesignSidebar",
                label: "2. System Design",
              },
              {
                type: "docSidebar",
                sidebarId: "techSpecsSidebar",
                label: "3. Tech Specs",
              },
              {
                type: "docSidebar",
                sidebarId: "apiSpecSidebar",
                label: "4. API Spec",
              },
              {
                type: "docSidebar",
                sidebarId: "dataSpecSidebar",
                label: "5. Data Spec",
              },
              {
                type: "html",
                value: '<span class="navbar-item-planned">6. Security Spec <span class="navbar-item-planned__badge">planned</span></span>',
              },
              {
                type: "html",
                value: '<span class="navbar-item-planned">7. Test Spec <span class="navbar-item-planned__badge">planned</span></span>',
              },
              {
                type: "docSidebar",
                sidebarId: "adrSidebar",
                label: "ADRs",
              },
            ],
          },
          {
            href: "https://github.com/stradivary/koperasi-kegelapan-docs",
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        style: "dark",
        copyright: `Copyright © ${new Date().getFullYear()} MBCS. By Stradivary.`,
      },
      prism: {
        theme: require("prism-react-renderer").themes.github,
        darkTheme: require("prism-react-renderer").themes.dracula,
        additionalLanguages: ["json"],
      },
    }),
};

module.exports = config;
