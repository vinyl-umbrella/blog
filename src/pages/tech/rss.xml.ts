import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

let collection = await getCollection('tech');
const site = 'https://manuke.dev';

export const get = () =>
  rss({
    title: 'マヌケなエンジニアの覚書 - Tech',
    description:
      'ITに関する学んだ技術・スキル・直面した課題とその解決法などの記事をまとめています',
    site: site,
    items: collection.map((post) => ({
      link: site + '/tech/' + post.slug,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
    })),
  });
