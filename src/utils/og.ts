import fs from 'node:fs/promises';
import { loadDefaultJapaneseParser } from 'budoux';
import { html } from 'satori-html';
import satori from 'satori';
import sharp from 'sharp';

// Load BudouX parser once to avoid repeated initialization
const budouxParser = loadDefaultJapaneseParser();

async function getFont(): Promise<Buffer> {
  return await fs.readFile(
    'src/fonts/noto-sans-jp-v52-japanese_latin-regular.woff',
  );
}

async function createOgImage(title: string): Promise<Buffer> {
  // Parse title with BudouX for natural line breaks
  const chunks = budouxParser.parse(title);
  const titleWithBreaks = chunks.join('<wbr>');

  // create html markup
  const markup = html`
    <div
      style="
    display: flex;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.1em;
    background-color: rgb(59, 66, 82);
    color: rgb(216, 222, 233);
    border: 8px solid rgba(147, 197, 253, 0.6);

    background-image:  linear-gradient(30deg, #434c5e 12%, transparent 12.5%, transparent 87%, #434c5e 87.5%, #434c5e), linear-gradient(150deg, #434c5e 12%, transparent 12.5%, transparent 87%, #434c5e 87.5%, #434c5e), linear-gradient(30deg, #434c5e 12%, transparent 12.5%, transparent 87%, #434c5e 87.5%, #434c5e), linear-gradient(150deg, #434c5e 12%, transparent 12.5%, transparent 87%, #434c5e 87.5%, #434c5e), linear-gradient(60deg, #434c5e77 25%, transparent 25.5%, transparent 75%, #434c5e77 75%, #434c5e77), linear-gradient(60deg, #434c5e77 25%, transparent 25.5%, transparent 75%, #434c5e77 75%, #434c5e77);
    background-size: 90px 157px;
    background-position: 0 0, 0 0, 45px 81px, 45px 81px, 0 0, 45px 81px;
  "
    >
      <div
        style="
      right: 42;
      bottom: 42;
      position: absolute;
      display: flex;
      align-items: center;
    "
      >
        <span style="width: 16; height: 16; background: rgb(147, 197, 253);" />
        <span style="margin-left: 8; font-size: 20; color: rgb(147, 197, 253);">
          blog.jsmz.dev
        </span>
      </div>
      <div
        style="
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      padding: 20px 50px;
      margin: 0 42px;
      font-size: 45;
      width: auto;
      max-width: 750;
      text-align: center;
      background-color: rgb(46, 52, 64);
      line-height: 1.4;
      border-bottom: 4px solid rgba(147, 197, 253, 0.6);
    "
      >
        ${titleWithBreaks}
      </div>
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
