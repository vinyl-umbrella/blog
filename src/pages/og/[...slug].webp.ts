import type { APIContext } from 'astro';
import { createOgImage } from '../../utils/og';
import { getContents } from '../../utils/util';

export async function getStaticPaths() {
  const posts = await getContents();
  return posts.map((post) => ({ params: { slug: post.id } }));
}

export async function GET({ params }: APIContext) {
  const { slug } = params;
  if (!slug) return { status: 404 };
  const posts = (await getContents()).find((post) => post.id === slug);
  if (!posts) return { status: 404 };

  const body = await createOgImage(posts.data.title);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
    },
  });
}
