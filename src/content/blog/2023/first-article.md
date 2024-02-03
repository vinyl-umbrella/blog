---
title: Astro@2でブログを開設
pubDate: 2023-01-31
description: astroでブログを一から作ってみた
tags: ['astro', 'front']
---

修論が終わってようやくリラックスできる時間ができたが，同時に学生の終わり，すなわち社会人の始まりを実感します．
わくわくどきどきです．

今後はまとまった時間を取るのが大変そうなので今のうちに自由に学びたいことをやってみようと思う．ひとまず，面白そうなフレームワークを使って，ブログを作ってみました．

私は，いろんな技術記事を読むのが趣味で日ごろからインプットには欠かさないようにしていますが，修論のせいで，特に年末あたりから忙しくなり，技術を追得なくなっていました．
ようやく時間に余裕ができたので，たまっていた記事を読んでいると，
[Publickey の記事](https://www.publickey1.jp/blog/23/astro_20content_cllectionsmarkdownhybrid_rendering.html)が目に留まった．
なんと，
Astroという静的サイトジェネレータが注目されているらしい．MDでかけるのはうれしい．

最近は，VueやReactといったSPAのフレームワークばっかり注目されているようですが，
私はMPAの時代はまだまだ続くし，期待もしています．

軽くAstroを触ってみたところをおもしろそうだったので，ITに関する学んだ技術・スキル・直面した課題とその解決法などをブログとして残していきたい．

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
まだ，astro@2.0が出て日が浅いが，癖はあまりないため，簡単に書けた．
特にjsxの記法に慣れている人はすぐできそう．

astroはMPAなのでSEO関連も簡単そうだし，広告を置くことも難しくなさそう．

あと，md, mdxで書けた記事のエクスポート/インポートができるため，他サービスへの移行も容易だと思われ．
