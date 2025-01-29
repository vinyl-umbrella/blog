---
title: Astro@4でブログを再構築
pubDate: 2024-01-14
updatedDate: 2024-02-23
description: 放置していたブログをAstro@4で作り直しました
tags: ['astro', 'front']
---

一年ほど前，[Astro@2 で環境構築](/blog/2023/first-article/) まではやったけれども，メンテしておらず，余裕がなかったため，放置していたブログを再構築してみた．
久しぶりにフロントエンドを書いたが，かなりなまってて全然かけなかったです．CSS ってこんなに難しかったっけ？

## 使用技術

- astro 4.1.2
  1 年前は 2.0.6 だったのに，もう 4.1.2 になっていた．
  更新がすごく早いですね．
- Cloudflare Pages
  最近は Cloudflare をよくつかっています．
  Google Domains が終了してからドメインを Cloudflare に移管したり，個人の Web アプリを Cloudflared を使って公開したりと，ちょっとずつ使用率を増やしています．
  IaC で管理するために，terraform で管理したいとも思っています．[cf-terraforming](https://github.com/cloudflare/cf-terraforming) を使うと楽そう．

- [Octicons](https://primer.style/foundations/icons/)
  シンプルで使いやすい．GitHub によって提供されている．

## 以前から改善した点

### tailwindcss は剥がした

便利だけれども，宣言されているクラスが多すぎました．
本ブログには，そんなに複雑なデザインでないし，最低限のものだけでこと足ります．
ビルド後のファイルサイズを小さくするためにも，やっぱりいらないだろうと判断しました．
フロントをあまり書かなくなった SRE が，1 年前に作ったものを見返してもあまりデザインの構成が理解できなかったのも大きいですね．
HTML 上のタグが長く長すぎるのも避けたいです．
常日頃から tailwind を使っていないと，クラス名だけを見ても，どのような CSS が適応されているかわからないという欠点もありました．実際，私はわかりませんでした．

また，CSS は CSS ごとにまとまっているほうがメンテナンス性は高いと思ってます．
自分でクラスを作成し，最低限のものコンポーネントごとに記述することで，メンテナンス性を高めました．

### デプロイ先

以前は，Firebase Hosting を使っていましたが，Cloudflare Pages に移行してみました．上にも書きましたが，以前はほかに Firebase で公開しているサービスがあったのと，Google Domains でドメインを取っていたため，Firebase を使っていました．
けれども，Google Domains の終了に伴い，レジストラを Cloudflare に移行しました．さらに，当時 Firebase で公開してたサービスに，Cloudflared を使用するようになりました．

たくさんのサービスを使うと，一人で管理できなくなっちゃうので，本ブログも Cloudflare Pages に移行しました．

### コードブロックにコピーボタンを追加

コードブロックには，ファイル名やコピーボタンがないと，技術ブログとしては非常に残念な形になってしまいます．(手軽にコピーして試せないと，おもてなしできていない)

実現するために，先駆者や既存ライブラリを探しましたが，ファイル名の表示とコピーボタンを一緒に実装しているものが見つからなかったです．
コピーボタンの実装をいくつか読んでみましたが，クライアント側の js でコピーボタンを作ってるものが多かったです．

私はビルド時にボタンの生成までやりたかったので，remark で実現しました．
`src/plugins/remarkAddUtil.js` にファイル名の追加と，コピーボタンの追加をしています．
これを `astro.config.mjs` で `remarkPlugins` に食わせることで，ビルド時にボタンの追加を実現できました．

クライアント側であまりスクリプトを使わないようにしたかったけれでも，コピーするアクションはクライアント側でしかできないので，コピーの実現は `src/layouts/BlogPost.astro` に記述しています．

また，ボタンやファイル名のスタイルは，`/src/styles/global.css` に記述しています．

```js src/plugins/remarkAddUtil.js
import { visit } from 'unist-util-visit';

const reCodeblock = () => {
  return (tree) => {
    visit(tree, 'code', (ele, index, parent) => {
      const codeblockMeta = {
        type: 'container',
        data: {
          hName: 'div',
          hProperties: {
            className: ['remark-codeblock'],
          },
        },
        children: [
          {
            type: 'paragraph',
            data: {
              hName: 'div',
              hProperties: {
                className: ['remark-code-title'],
              },
            },
            children: [{ type: 'text', value: ele.meta || '' }],
          },
          {
            type: 'container',
            data: {
              hName: 'button',
              hProperties: {
                className: ['remark-code-copy-button'],
              },
            },
            children: [{ type: 'text', value: 'Copy' }],
          },
        ],
      };

      parent.children.splice(index, 0, codeblockMeta);
      // skip title element
      return index + 2;
    });
  };
};

export default reCodeblock;
```

```astro src/layouts/BlogPost.astro
...

<script is:inline>
  function attachListenerToCopyButton() {
    async function copyCode(block, button) {
      const code = block.querySelector('code');
      const text = code?.innerText;

      await navigator.clipboard.writeText(text ?? '');

      button.innerText = 'Copied';
      setTimeout(() => {
        button.innerText = 'Copy';
      }, 700);
    }

    let codeBlocks = Array.from(document.querySelectorAll('pre'));
    for (let codeBlock of codeBlocks) {
      let copyButton = codeBlock.previousElementSibling.querySelector(
        '.remark-code-copy-button',
      );

      copyButton.addEventListener('click', async () => {
        await copyCode(codeBlock, copyButton);
      });
    }
  }
  attachListenerToCopyButton();
</script>
```

### og画像の生成

`/src/pages/og/[...slug].webp.ts` に，`/src/pages/blog/[...slug].astro` の OGP 画像を生成するエンドポイントを作りました．実装としては，`satori-html` に html を渡して，svg を生成し，`sharp` で webp に変換しています．

astro でブログを作って公開している人たちにとても感謝しています．ありがとうございます！
先人たちは，ビルド時に Google Fonts からフォントの URL を取得して，そのファイルをぶっこ抜いて，むりやり生成している例が多かったですが，私は，フォントはローカルに用意して置いたものを使ってます．

```ts src/pages/og/[...slug].webp.ts
import type { APIContext } from 'astro';
import { createOgImage } from '../../utils/og';
import { getContents } from '../../utils/util';

export async function getStaticPaths() {
  const posts = await getContents();
  return posts.map((post) => ({ params: { slug: post.slug } }));
}

export async function GET({ params }: APIContext) {
  const { slug } = params;
  if (!slug) return { status: 404 };
  const posts = (await getContents()).find((post) => post.slug === slug);
  if (!posts) return { status: 404 };

  const body = await createOgImage(posts.data.title);
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'image/webp',
    },
  });
}
```

```ts src/utils/og.ts
import fs from 'fs/promises';
import { html } from 'satori-html';
import satori from 'satori';
import sharp from 'sharp';

async function getFont(): Promise<Buffer> {
  return await fs.readFile(
    // donwloaded from google fonts
    'src/fonts/noto-sans-jp-v52-japanese_latin-regular.woff',
  );
}

async function createOgImage(title: string): Promise<Buffer> {
  // create html markup
  const markup = html` ここにog画像となるhtmlを書く `;

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
```

## フォルダ構成

```
.
├── astro.config.mjs
├── dist/
├── node_modules/
├── package-lock.json
├── package.json
├── public
│   ├── favicon.ico
│   ├── img
│   │   ├── me.webp
│   │   └── me_thumbnail.webp
│   └── robots.txt
├── src
│   ├── components
│   │   ├── BaseHead.astro
│   │   ├── BlogCard.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── HeaderLink.astro
│   │   ├── Pages.astro
│   │   ├── TagList.astro
│   │   └── Toc.astro
│   ├── consts.ts
│   ├── content
│   │   ├── blog
│   │   │   ├── 2022
│   │   │   │   ├── *.md
│   │   │   ├── 2023
│   │   │   │   ├── assets
│   │   │   │   │   ├── *.webp
│   │   │   │   ├── *.md
│   │   │   ├── 2024
│   │   │   │   └── *.md
│   │   │   └── draft
│   │   └── config.ts
│   ├── env.d.ts
│   ├── fonts
│   │   └── noto-sans-jp-v52-japanese_latin-regular.woff
│   ├── layouts
│   │   ├── BlogList.astro
│   │   ├── BlogPost.astro
│   │   └── General.astro
│   ├── pages
│   │   ├── 404.astro
│   │   ├── [...page].astro
│   │   ├── about.astro
│   │   ├── blog
│   │   │   └── [...slug].astro
│   │   ├── og
│   │   │   └── [...slug].webp.ts
│   │   ├── rss.xml.js
│   │   └── tags
│   │       └── [tag]
│   │           └── [...page].astro
│   ├── styles
│   │   └── global.css
│   └── utils
│       ├── og.ts
│       └── util.ts
└── tsconfig.json
```

## 参考になったリポジトリ様

- https://github.com/macoshita/macoshita.me-astro
- https://github.com/h-yoshikawa44/change-of-pace-astro
- https://github.com/retrorocket/astro-blog
- https://github.com/hiroppy/site
