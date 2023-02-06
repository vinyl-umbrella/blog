---
layout: ../../layouts/BlogLayout.astro
title: Astro@2でブログを開設
pubDate: 2023-01-31
description: astroでブログを一から作ってみた
image: /img/tech/astro.png
---

修論が終わってようやくリラックスできる時間ができたが，同時に学生の終わり，社会人の始まりを実感する．
今後はまとまった時間を取るのが大変そうなので今のうちに自由に学びたいことをやってみる．

特に年末あたりから忙しくなり，技術を追得なくなっていたがたまたまおもしろそうな
[Publickey の記事](https://www.publickey1.jp/blog/23/astro_20content_cllectionsmarkdownhybrid_rendering.html)を目にした．
最近は，VueやReactといったSPAのフレームワークばっかり注目されているが，
私はMPAの時代がまた来るのではないかと思っている．

軽くAstroを触ってみたところをおもしろそうだったので，ITに関する学んだ技術・スキル・直面した課題とその解決法などをブログとして残していくことにする．


## 使用技術
本ブログの主な使用技術
- #### `"astro": "2.0.6",`
  - このブログを構成するメインのMPAフレームワーク
  - 記事をmd, mdxで書けるのが便利
  - [ドキュメント](https://docs.astro.build/ja/getting-started/)も結構整ってる
- #### `"@astrojs/image": "0.14.0"`
  - 画像をいい感じに最適化してくれる
  - `public/img/`に解像度とか考えずに放り込んどいて，ビルド時にwebpに変換するようにする
  - 解像度も指定するといい感じになる
- #### `"tailwindcss": "3.2.4"`
  - CSSフレームワークはtailwindを使うことにした
  - ここは特にこだわりはないが，`@astrojs/tailwind`があったのが大きな決め手
- #### Firebase Hosting
  - ホスティングサービス
  - 別プロジェクトでも使っていてある程度慣れているため
- #### Google Domains
  - Firebaseでホスティングするんで，Googleアカウントにまとめると楽そうだから
  - また，お名前ドットコムはメールがうっとうしいため信頼できるGoogleを選んだ

## ディレクトリ構成
ディレクトリ構成はかなりシンプル．

`astro.config.mjs`にastroの設定を書いて（設定を書くと言っても数行書くだけ），他のコードは`src/`の中

`src/components/`はReactのような文法でコンポーネントを書く

マークダウンで書いた記事は`src/content/`に置く

Next.jsやNuxtのようにファイル名で動的ルーティングが可能で，`src/pages/`下に置いたファイルのパスアクセスできる．
ここで`[...page].astro`は記事一覧となり，`[slug].astro`は各md, mdxの記事となる

各ページのレイアウトは`src/layouts/`に書いておいて，`page/`下のastroファイルで読み込むと便利

```
.
├── astro.config.mjs
├── dist/
├── firebase.json
├── node_modules/
├── package.json
├── public/
│   ├── favicon.svg
│   └── img/
├── src/
│   ├── components/
│   │   ├── *.astro
│   ├── const.ts
│   ├── content/
│   │   ├── config.ts
│   │   ├── game/
│   │   │   ├── *.mdx
│   │   └── tech/
│   │       └── *.mdx
│   ├── env.d.ts
│   ├── layouts/
│   │   └── MainLayout.astro
│   ├── pages/
│   │   ├── game/
│   │   │   ├── [...page].astro
│   │   │   └── [slug].astro
│   │   ├── index.astro
│   │   └── tech/
│   │       ├── [...page].astro
│   │       └── [slug].astro
│   └── util/
│       └── utils.ts
├── tailwind.config.cjs
└── tsconfig.json
```



### 一通り書き終えた所感
だいたい3日くらいでいい感じになった．
まだ，astro@2.0が出て日が浅いが，かなり癖はあまりないため，簡単に書けた．
特にjsxの記法に慣れている人はすぐできると思う．

astroはMPAなのでSEO関連も簡単そうだし，広告を置くことも難しくなさそう．

あと，md, mdxで書けるので他のところで書いた資産を持ってこれるのも嬉しい．
