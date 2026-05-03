// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'MBCS NFC Wallet',
  tagline: 'Offline NFC wallet system — system design and technical specifications',
  favicon: 'img/favicon.ico',

  // Set the production URL of your site here.
  // Update stradivary and koperasi-desa-docs to match your GitHub organisation and repository.
  url: 'https://stradivary.github.io',
  baseUrl: '/koperasi-desa-docs/',

  organizationName: 'stradivary',
  projectName: 'koperasi-desa-docs',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          // Remove or replace the editUrl with your own GitHub repo URL to enable
          // "Edit this page" links on every doc page.
          // editUrl: 'https://github.com/stradivary/koperasi-desa-docs/tree/main/',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'MBCS NFC Wallet',
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'systemDesignSidebar',
            position: 'left',
            label: 'System Design',
          },
          {
            type: 'docSidebar',
            sidebarId: 'techSpecsSidebar',
            position: 'left',
            label: 'Tech Specs',
          },
          {
            href: 'https://github.com/stradivary/koperasi-desa-docs',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Copyright © ${new Date().getFullYear()} MBCS. Built with Docusaurus.`,
      },
      prism: {
        theme: require('prism-react-renderer').themes.github,
        darkTheme: require('prism-react-renderer').themes.dracula,
        additionalLanguages: ['json'],
      },
    }),
};

module.exports = config;
