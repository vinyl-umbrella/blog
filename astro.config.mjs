import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import addCodeUtil from './src/plugins/remarkAddCodeUtil';
import linkNewTab from './src/plugins/remarkLinkNewTab';
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
      filter: (page) => !page.match(/\/blog\/draft\//g),
      changefreq: 'weekly',
      priority: 0.7,
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    remarkPlugins: [addCodeUtil, linkNewTab, remarkBreaks],
  },
  vite: {
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
});
