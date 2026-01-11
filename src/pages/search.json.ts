import type { APIRoute } from 'astro';
import { getContents } from '../utils/util';

type PostEntry = {
  id: string;
  body?: string;
  data: { title: string; tags: string[] };
};

function stripMarkdown(md: string): string {
  if (!md) return '';
  let s = md;
  s = s.replace(/```[\s\S]*?```/g, ' ');
  s = s.replace(/`[^`]*`/g, ' ');
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ');
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
  s = s.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1');
  s = s.replace(/^\s*[#>\-+*]+\s+/gm, '');
  s = s.replace(/^\s*-{3,}\s*$/gm, '');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

export const GET: APIRoute = async () => {
  const posts = await getContents();
  const docs = posts
    // exclude "sample" tag posts
    .filter((p) => !p.data.tags.includes('sample'))
    .map((p: PostEntry) => {
      const raw = typeof p.body === 'string' ? p.body : '';
      const content = stripMarkdown(raw);
      return {
        id: p.id,
        title: p.data.title,
        url: `/blog/${p.id}/`,
        content,
      };
    });

  return new Response(JSON.stringify(docs), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
};
