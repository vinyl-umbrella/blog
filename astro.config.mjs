import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import addCodeUtil from './src/plugins/remarkAddCodeUtil';
import linkNewTab from './src/plugins/remarkLinkNewTab';
import remarkMermaidDetector from './src/plugins/remarkMermaidDetector';
import remarkBreaks from 'remark-breaks';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.jsmz.dev',
  redirects: {
    '/blog': '/',
  },
  trailingSlash: 'ignore',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.match(/\/blog\/draft\//g) &&
        !page.match(/\/tags\//g) &&
        !page.match(/\/\d+\/$/g),
      priority: 0.7,
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    syntaxHighlight: {
      type: 'shiki',
      excludeLangs: ['mermaid'],
    },
    remarkPlugins: [
      addCodeUtil,
      linkNewTab,
      remarkMermaidDetector,
      remarkBreaks,
    ],
  },
  vite: {
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
});
