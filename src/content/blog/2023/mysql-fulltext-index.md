---
title: MySQLで全文検索と設定する際の注意点
pubDate: 2023-02-04
description: MySQLで全文検索する方法と設定する際の注意点をまとめました
tags: ['mysql']
---

### 概要

私はとあるネット掲示板のチャットを記録し，そのログ検索システムを提供しています．
規模はかなり大きくなってきて，テーブル数は約**250**，総レコード数は**1000万**を超えました．

これほど巨大なのものは，herokuやFirebase，といったSaaSの無料枠では全く収まらない．
そこで，無料枠の大きいOCI（オラクルクラウド）のインスタンス上でMySQLを使い，自らサーバを管理することにしました．
OCIは無料枠が大きくていいですよね．

そのときの，詰まった点や注意点，テクニックを忘備録として残しておきます．

### 環境

データベースはOCIで立てており，スペックは以下の通りである．

- OS: Ubuntu 20.04.6 LTS
- CPU: Arm 3コア
- RAM 18GB
- MySQL: Ver 8.2.0

NoSQLであり機能が豊富なElasticsearchも選択肢にあったが，機能が豊富すぎるので今回のシステムには合わないと思いMySQLを選択した．

また，テーブル構造は以下のようなものだったとする．
`id`を各レコードのユニークな数字で，`posted_at`が投稿日時，`userid`が書き込んだ人のID，`message`が書き込んだ内容．

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

MySQLにはフルテキストインデックスという仕組みがある．これは，テキストベースのカラム（CHAR, VARCHAR, TEXT）につけることができるインデックスであり，高速な全文検索を可能にする．

今回は，テキストをn文字ずつ（デフォルト2文字）に分割してインデックスを作る方法を紹介します．

一回作れば，INSERT時に毎回インデックスが更新されるので，`CREATE TABLE`時に設定するか，後から既存のテーブルに対し`ALTER TABLE`でインデックスを作ればよい．

- 既存のテーブルにフルテキストインデックスを作る方法

```sql
ALTER TABLE chatlog
ADD FULLTEXT INDEX ngram_idx(message) WITH PARSER ngram;
```

- 新規のテーブルにフルテキストインデックスを作る方法

下のように宣言する

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

SQLの文字列検索は通常`WHERE message LIKE '%1234'`のようにLIKE句を用いるが，インデックスを使用する場合は，`MATCH (message) AGAINST ('1234')`のようにする．

```sql
SELECT *
FROM chatlog
WHERE MATCH(message) AGAINST ('1234' IN BOOLEAN MODE);
```

ここで検索モードは3種類あるので紹介．

- BOOLEAN MODE

  - AGAINST句に与えた文字に完全に一致するものだけを返す．ANDやOR検索もできる．

- NATURAL LANGUAGE MODE

  - フルテキストインデックスを使用して，検索文字列を多く含むテキストを類似度が高いとして評価される．

- QUERY EXPANSION MODE
  - 入力を拡張し関連する単語を検索し，検索結果を決定する．

### 注意点

**mysqlのngramパーサはアルファベットを含む文章をトークナイズする際に罠がある**

システムが完成し，高速に検索できるようになったなあと思ってから，数ヶ月後とある文字列を検索できないという報告があった．
具体的には，チャットログ検索で`yari`を検索しようとしたときに，空の結果が返ってきてしまっていた．
これは，メッセージを2文字ずつに分割してインデックスに入れるngramパーサにストップワードがあるためでした．

ストップワードとは，特定の文字に該当するものは無視してしまうもの．
例えば，`i`や`a`が登録されているため`yari`がインデックスに登録されてなかった．
ストップワードの一覧は下記の文を実行すれば取得できる．

```sql
SELECT * FROM INFORMATION_SCHEMA.INNODB_FT_DEFAULT_STOPWORD;
```

解決するには，`my.cnf`で下のように設定するとストップワードがオフになる．

```
[mysqld]
innodb_ft_enable_stopword = OFF
```

### [余談] さらに高速な検索へ

インデックスのおかげでLIKE句よりは早くなったが，テーブルサイズがデカくなるにつれて，インデックスも巨大化し検索に時間がかかるようになってしまう．

検索語に，次の50件を取得したいときに，高速に検索するためにはシーク法を用いるとよい．

シーク法は，前ページの最終行のIDをキーにして検索を行う．
この例のテーブルでは，IDがプライマリーキーなので，フルテキストインデックスより高速になる！

```sql
SELECT * FROM chatlog WHERE id > {id_on_last_line_of_the_previous_page};
```
