---
title: MySQLで全文検索と設定する際の注意点
pubDate: 2023-02-04
description: MySQLで全文検索する方法と設定する際の注意点をまとめました
tags: ['mysql']
---

### 概要

私はとあるネット掲示板のチャットを記録し，そのログ検索システムを提供しています．
規模はかなり大きくなってきて，テーブル数は約**250**，総レコード数は**1000万**を超えました．

これほど巨大なのものは，heroku や Firebase，といった SaaS の無料枠では全く収まらない．
そこで，無料枠の大きい OCI（オラクルクラウド）のインスタンス上で MySQL を使い，自らサーバを管理することにしました．
OCI は無料枠が大きくていいですよね．

そのときの，詰まった点や注意点，テクニックを忘備録として残しておきます．

### 環境

データベースは OCI で立てており，スペックは以下の通りです．

- OS: Ubuntu 20.04.6 LTS
- CPU: Arm 3 コア
- RAM 18GB
- MySQL: Ver 8.2.0

NoSQL であり機能が豊富な Elasticsearch も選択肢にあったが，機能が豊富すぎるので今回のシステムには合わないと思い MySQL を選択した．

また，テーブル構造は以下のようなものだったとする．
`id` を各レコードのユニークな数字で，`posted_at` が投稿日時，`userid` が書き込んだ人の ID，`message` が書き込んだ内容．

```sql
CREATE TABLE chatlog (
  id AUTO_INCREMENT,
  posted_at DATETIME NOT NULL,
  userid VARCHAR(255),
  message TEXT,
  PRIMARY KEY (id)
) CHARSET=utf8mb4;
```

### 設定

MySQL にはフルテキストインデックスという仕組みがある．これは，テキストベースのカラム（CHAR, VARCHAR, TEXT）につけることができるインデックスであり，高速な全文検索を可能にする．

今回は，テキストを n 文字ずつ（デフォルト 2 文字）に分割してインデックスを作る方法を紹介します．

一度作れば，INSERT 時に毎回インデックスが更新されるので，`CREATE TABLE` 時に設定するか，後から既存のテーブルに対し `ALTER TABLE` でインデックスを作ればよい．

- 既存のテーブルにフルテキストインデックスを作る方法

```sql
ALTER TABLE chatlog
ADD FULLTEXT INDEX ngram_idx(message) WITH PARSER ngram;
```

- 新規のテーブルにフルテキストインデックスを作る方法

下のように宣言する．

```sql
CREATE TABLE chatlog (
  id AUTO_INCREMENT,
  posted_at DATETIME NOT NULL,
  userid VARCHAR(255),
  message TEXT,
  FULLTEXT ngram_idx(message) WITH PARSER ngram
  PRIMARY KEY (id)
) CHARSET=utf8mb4;
```

### 検索方法

SQL の文字列検索は通常 `WHERE message LIKE '%1234'` のように LIKE 句を用いるが，インデックスを使用する場合は，`MATCH (message) AGAINST ('1234')` のようにする．

```sql
SELECT *
FROM chatlog
WHERE MATCH(message) AGAINST ('1234' IN BOOLEAN MODE);
```

ここで検索モードは 3 種類あるので紹介．

- BOOLEAN MODE
  - AGAINST 句に与えた文字と完全に一致するものだけを返す．AND や OR 検索もできる．
- NATURAL LANGUAGE MODE
  - フルテキストインデックスを使用して，検索文字列を多く含むテキストを類似度が高いとして評価される．
- QUERY EXPANSION MODE
  - 入力を拡張し関連する単語を検索し，検索結果を決定する．

### 注意点

**mysqlのngramパーサはアルファベットを含む文章をトークナイズする際に罠がある**

システムが完成し，高速に検索できるようなシステムができたなあと思ってから，数ヶ月後とある文字列を検索できないという報告があった．
具体的には，チャットログ検索で `yari` を検索しようとしたときに，空の結果が返ってきてしまっていた．

これは，メッセージを 2 文字ずつに分割してインデックスに入れる ngram パーサにストップワードがあるためでした．

ストップワードとは，特定の文字に該当するものは無視してしまうもの．
例えば，`i` や `a` が登録されているため `yari` がインデックスに登録されてなかった．
ストップワードの一覧は下記の文を実行すれば取得できる．

```sql
SELECT * FROM INFORMATION_SCHEMA.INNODB_FT_DEFAULT_STOPWORD;
```

解決するには，`my.cnf` で下のように設定するとストップワードがオフになる．

```
[mysqld]
innodb_ft_enable_stopword = OFF
```

### [余談] さらに高速な検索へ

インデックスのおかげで LIKE 句よりは早くなったが，テーブルサイズがデカくなるにつれて，インデックスも巨大化し検索に時間がかかるようになってしまう．

検索語に，次の 50 件を取得したいときに，高速に検索するためにはシーク法を用いるとよい．

シーク法は，前ページの最終行の ID をキーにして検索する．
この例のテーブルでは，ID がプライマリーキーなので，フルテキストインデックスより高速になる！

```sql
SELECT * FROM chatlog WHERE id > {id_on_last_line_of_the_previous_page};
```
