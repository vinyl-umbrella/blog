---
title: Astro@4でブログを再構築
pubDate: 2024-01-14
updatedDate: 2024-02-03
description: 放置していたブログをAstro@4で作り直しました
tags: ['astro', 'front']
---

一年ほど前，[Astro@2 で環境構築](/blog/2023/first-article)まではやったけれども，メンテしておらず，余裕がなかったため，放置していたブログを再構築してみた．

久しぶりにフロントエンドを書いたが，かなりなまってて全然かけなかった．
CSSってこんなに難しかったっけ？

## 仕様技術

- astro 4.1.2

  - 1年前は2.0.6だったのに，もう4.1.2になっていた
  - 更新がすごく早い

- Cloudflare Pages

  - 最近はCloudflareを使うことが多くなった
  - Google Domainsが終了してからドメインをCloudflareに移管したり，個人のWebアプリをCloudflaredを使って公開したりと，ちょっとずつ使用率を増やしてる
  - IaCで管理するために，terraformで管理したいとも思ってる
    - [cf-terraforming](https://github.com/cloudflare/cf-terraforming)を使うと楽そう

- [octicons](https://primer.style/foundations/icons/)
  - シンプルで使いやすい

## 以前から改善した点

### tailwindcss は剥がした

便利だけれども，宣言されているクラスが多すぎた．
本ブログには，そんなに複雑なデザインでないし，最低限のものだけでこと足ります．
ビルド後のファイルサイズを小さくするためにも，やっぱりいらないだろうと判断しました．

フロントをあまり書かなくなった，SREが1年前に作ったものを見返してもあまりデザインの構成が理解できなかったのも大きい．

自分でクラスを作成し，最低限のものにすることで，メンテナンス性を高めました．

### デプロイ先

以前は，Firebase Hostingを使っていたが，Cloudflare Pagesに移行した．上にも書いたが，以前はほかにFirebaseで公開しているサービスがあったのと，Google Domainsでドメインを取っていたためでした．

けれども，Google Domainsの終了に伴い，レジストラをCloudflareに移行したのと，当時Firebaseで公開してたサービスの公開に，Cloudflaredを使っているため，Cloudflare Pagesに移行しました．

### コードブロックにコピーボタンを追加した

コードブロックには，ファイル名やコピーボタンがないと，技術ブログとしては非常に残念な形になってしまいます．(手軽にコピーして試せないと，おもてなしできていない)

実現するために，先駆者や既存ライブラリを探しましたが，ファイル名の表示とコピーボタンを一緒に実装しているものが見つからなかった．
コピーボタンの実装をいくつか読んでみましたが，クライアント側のjsでコピーボタンを作ってるものが多かった．

私はビルド時にボタンの生成までやりたかったので，remarkで実装しました．
`src/plugins/remarkAddUtil.js`にファイル名の追加と，コピーボタンの追加を行っています．
これを`astro.config.mjs`で`remarkPlugins`に食わせることで，ビルド時にボタンの追加を実現できました．

クライアント側であまりスクリプトを使わないようにしたかったけれでも，コピーするアクションはクライアント側でしかできないので，コピーの実現は`src/layouts/BlogPost.astro`に記述しています．

また，ボタンやファイル名のスタイルは，`/src/styles/global.css`に記述しています．

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

`/src/pages/og/[...slug].webp.ts`に，`/src/pages/blog/[...slug].astro`のOGP画像を生成するエンドポイントを作った．実装としては，`satori-html`にhtmlを渡して，svgを生成し，`sharp`でwebpに変換しています．

astroでブログを作って公開している人たちに感謝．
先人たちは，ビルド時にGoogle FontsからフォントのURLを取得して，そのファイルをぶっこ抜いて，むりやり生成している例が多かった．私は，フォントはローカルに用意して置いたものを使ってます．

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
