import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkFlexibleCodeTitles from 'remark-flexible-code-titles';

// https://astro.build/config
export default defineConfig({
  site: 'https://jsmz.dev',
  redirects: {
    '/blog': '/',
  },
  trailingSlash: 'never',

  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
    })
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-dimmed',
      wrap: true,
    },
    remarkPlugins: [remarkFlexibleCodeTitles],
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name][extname]',
        },
      }
    }
  },
});
