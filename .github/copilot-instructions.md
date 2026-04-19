# Copilot Instructions

## プロジェクト概要

Astro 6 で構築された日本語の個人技術ブログ (https://blog.jsmz.dev)．Cloudflare Pages にデプロイしている．

## 最重要: 情報の正確性

本リポジトリは技術ブログであり，**情報の正確性を最も重視する**．

- 不確かな情報を生成しないこと．確信が持てない場合はその旨を明示する
- URL・CVE 番号・コマンド・API 仕様などは，実在し正確であることを確認する
- 公式ドキュメント，公式の仕様書や論文，ライブラリや言語そのもののソースコードを参照すること
- 技術的な説明を推測で補完しない

## ブログ記事の規約

### ファイル配置

- 記事: `src/content/blog/{year}/` 配下に `.md` または `.mdx` で作成
- 下書き: `src/content/blog/draft/` に配置し，frontmatter に `draft: true` を設定

### Frontmatter

```yaml
---
title: 記事タイトル
pubDate: YYYY-MM-DD
description: 記事の説明
tags: ['tag1', 'tag2']
updatedDate: YYYY-MM-DD # 既存の記事を更新する場合に設定
draft: true # 下書きの場合にのみ設定
---
```

### 日本語の文章ルール

- **文体**: ですます調
- **句読点**: 全角カンマ・全角ピリオド `，` `．` を使用する
- **欧文と和文の間**: 半角スペースを入れる (例: `IT エンジニア`，`Astro で構築`)
- **1文の長さ**: 短めにする (150文字以内が目安)
- **固有名詞**: 大文字小文字を含め正式名称を使う (例: `GitHub`，`TypeScript`，`Cloudflare`)
- textlint (`npm run textlint`) で検証可能

### Markdown の書き方

- **コードブロック**: バッククォートの後ろに言語名を指定する．ファイル名を記載したほうが伝わりやすい場合は，言語名の後ろにスペースを挟んで記載する (例: `` ```ts index.ts ``) ．remarkAddCodeUtil プラグインがタイトル表示に変換する
- **実在するコードの引用**: Markdown 内にコピペせず，GitHub のパーマネントリンクを貼って埋め込む．`remarkGithubPermalinkEmbed` プラグインが対象リンクをマークし，`rehypeGithubPermalinkEmbed` プラグインがコード埋め込みの取得・描画を行う
- **図**: 図は可能であればアスキーでの表現ではなく，mermaid での表現をしましょう．コードブロックで言語を `mermaid` に指定すると描画される
- **外部リンク**: 自動で新しいタブで開く

## 開発コマンド

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | ビルド (`astro check && astro build`) |
| `npm run fmt` | Biome でフォーマット |
| `npm run fmt:check` | フォーマットチェック |
| `npm run textlint` | 日本語文章の lint |

CI (PR 時) では `fmt:check`, `textlint`, `astro check` が実行される．

## コードスタイル

Biome の設定 (`biome.jsonc`) に準拠する．`npm run fmt` で自動修正されるため，細かいスタイルを意識する必要はない．
