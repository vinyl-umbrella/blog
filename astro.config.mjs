// https://astro.build/config
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import image from '@astrojs/image';

export default defineConfig({
  site: 'https://blog.manuke.dev',
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
    tailwind(),
    image({ serviceEntryPoint: '@astrojs/image/sharp' }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'monokai',
      wrap: true,
    },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'entry_[hash].js',
          // chunkFileNames: 'js/chunk_[hash].js',
          assetFileNames: 'assets/asset_[hash][extname]',
        },
      },
    },
  },
});
