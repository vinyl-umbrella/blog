import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

function collectBlogLastmodMap() {
  const baseDir = path.resolve(process.cwd(), 'src/content/blog');
  const map = new Map();
  const nowISO = new Date().toISOString();

  function toIso(val) {
    if (val == null) return null;
    // Allow Date object or string
    if (val instanceof Date && !Number.isNaN(val.getTime()))
      return val.toISOString();
    const s = String(val).trim();
    const dateOnly = /^\d{4}-\d{2}-\d{2}$/;
    try {
      if (dateOnly.test(s)) return new Date(`${s}T00:00:00Z`).toISOString();
      const d = new Date(s);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    } catch {}
    return null;
  }

  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const name = ent.name;
      if (name === 'draft' || name === 'assets') continue;
      const fp = path.join(dir, name);
      if (ent.isDirectory()) {
        walk(fp);
        continue;
      }
      if (!/\.(md|mdx)$/.test(name)) continue;

      const rel = path.relative(baseDir, fp).replace(/\.(md|mdx)$/i, '');
      const urlPath = `/blog/${rel}/`;
      const { data } = matter(readFileSync(fp, 'utf8'));
      const lastmod =
        toIso(data?.updatedDate) ?? toIso(data?.pubDate) ?? nowISO;
      map.set(urlPath, lastmod);
    }
  }

  try {
    walk(baseDir);
  } catch {}
  return map;
}

function createBlogLastmodSerialize() {
  const MAP = collectBlogLastmodMap();
  return function serialize(item) {
    const now = new Date().toISOString();
    try {
      const u = new URL(item.url);
      const pathName = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
      item.lastmod = MAP.get(pathName) || now;
    } catch {
      item.lastmod = now;
    }
    return item;
  };
}

export const blogLastmodSerialize = createBlogLastmodSerialize();
