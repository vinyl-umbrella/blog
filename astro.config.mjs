import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import remarkBreaks from 'remark-breaks';
import rehypeGithubPermalinkEmbed from './src/plugins/rehypeGithubPermalinkEmbed';
import addCodeUtil from './src/plugins/remarkAddCodeUtil';
import remarkGithubPermalinkEmbed from './src/plugins/remarkGithubPermalinkEmbed';
import linkNewTab from './src/plugins/remarkLinkNewTab';
import remarkMermaidDetector from './src/plugins/remarkMermaidDetector';
import { blogLastmodSerialize } from './src/utils/blogLastmod.js';

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
      serialize: blogLastmodSerialize,
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
      remarkGithubPermalinkEmbed,
      linkNewTab,
      remarkMermaidDetector,
      remarkBreaks,
    ],
    rehypePlugins: [
      rehypeGithubPermalinkEmbed,
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'wrap',
        },
      ],
    ],
  },
  vite: {
    optimizeDeps: {
      exclude: ['sharp'],
    },
  },
});
