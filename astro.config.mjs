import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx'; // https://astro.build/config
import sitemap from '@astrojs/sitemap'; // https://astro.build/config
import tailwind from '@astrojs/tailwind'; // https://astro.build/config

// https://astro.build/config
export default defineConfig({
  site: 'https://manuke.site',
  integrations: [mdx(), sitemap(), tailwind()],
  markdown: {
    shikiConfig: {
      theme: 'monokai',
      wrap: true,
    },
  },
});
