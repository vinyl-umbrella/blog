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

// returns tag names list ordered by recent article desc
function getTags(collections: Collections): string[] {
  const tags = collections.flatMap((post) => post.data.tags);
  return Array.from(new Set(tags));
}

function convert2OgImagePath(url: URL): string {
  // if not posts, return default image
  if (!url.pathname.startsWith('/blog/')) return '/img/me_thumbnail.webp';

  // convert path
  let imgPath = url.pathname.replace('/blog/', '/og/');
  imgPath = imgPath.replace(/\/$/, '');

  imgPath += '.webp';
  return imgPath;
}

export { formatDate, getContents, getTags, convert2OgImagePath };
