import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap'; // https://astro.build/config
import tailwind from '@astrojs/tailwind'; // https://astro.build/config
import image from '@astrojs/image'; // https://astro.build/config

// https://astro.build/config
export default defineConfig({
  site: 'https://manuke.dev',
  integrations: [
    mdx(),
    sitemap(),
    tailwind(),
    image({ serviceEntryPoint: '@astrojs/image/sharp' }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'monokai',
      wrap: true,
    },
  },
});
