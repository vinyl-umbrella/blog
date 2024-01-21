import fs from 'fs/promises';
import { html } from 'satori-html';
import satori from 'satori';
import sharp from 'sharp';

async function getFont(): Promise<Buffer> {
  return await fs.readFile(
    'src/fonts/noto-sans-jp-v52-japanese_latin-regular.woff',
  );
}

async function createOgImage(title: string, tags: string[]): Promise<Buffer> {
  // create html markup
  const markup = html`
    <div
      style="width: 1200px; height: 630px; display: flex; flex-direction: column; flex-wrap: wrap; justify-content: center; align-items: center; padding: 0 24px; background-color: rgb(59, 66, 82); color: rgb(216, 222, 233);"
    >
      <h1 style="font-size: 5.5rem; font-weight: 700">${title}</h1>
      <h2 style="font-size: 2.5rem; font-weight: 700">jsmz.dev</h2>
      <div>${tags.map((tag) => `#${tag}`).join(' ')}</div>
    </div>
  `;

  // create svg
  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    embedFont: true,
    fonts: [
      {
        name: 'NotoSansJP',
        data: await getFont(),
        weight: 400,
        style: 'normal',
      },
    ],
  });

  // create png with sharp
  return await sharp(Buffer.from(svg)).webp().toBuffer();
}

export { createOgImage };
