import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import addCodeUtil from './src/plugins/remarkAddCodeUtil';

// https://astro.build/config
export default defineConfig({
  site: 'https://jsmz.dev',
  redirects: {
    '/blog': '/'
  },
  trailingSlash: 'never',
  integrations: [mdx(), sitemap({
    filter: page => !page.match(/\/blog\/draft\//g),
    changefreq: 'weekly',
    priority: 0.7
  })],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true
    },
    remarkPlugins: [addCodeUtil],
  },
  vite: {
    optimizeDeps: {
      exclude: ['sharp']
    }
  }
});
