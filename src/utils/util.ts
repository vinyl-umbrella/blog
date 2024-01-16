import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

type Collections = CollectionEntry<'blog'>[];

function formatDate(pubDate: Date): string {
  const d = new Date(pubDate);
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

// exclude drafts, and sort by pubDate
async function getContents(): Promise<Collections> {
  const posts = (
    await getCollection('blog', ({ data }) => {
      return import.meta.env.PROD ? data.draft !== true : true;
    })
  ).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return posts;
}

function getTags(collections: Collections): string[] {
  return [...new Set(collections.map((post) => post.data.tags).flat())];
}

export { formatDate, getContents, getTags };
