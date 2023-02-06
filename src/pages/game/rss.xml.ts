import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

let collection = await getCollection('game');
const site = 'https://manuke.dev';

export const get = () =>
  rss({
    title: 'マヌケなエンジニアの覚書 - Game',
    description:
      'プレイしたゲームやクリアしたゲームなど，ゲームに関する話を書きます',
    site: site,
    items: collection.map((post) => ({
      link: site + '/game/' + post.slug,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
    })),
  });
