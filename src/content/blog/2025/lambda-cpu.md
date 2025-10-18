---
title: AWS Lambda のメモリ設定による CPU の変化
pubDate: 2025-10-18
updatedDate: 2025-10-18
description: AWS Lambda では，CPU の選択ができず，メモリ設定によって自動で CPU 性能が変化します．コア数などがどう変わるのか調査した際のメモです．
tags: ['aws']
---

みんな大好き AWS Lambda (以降，Lambda) は，サーバレスでアプリケーションを実行できる便利なサービスです．
Lambda の設定には，メモリサイズを指定する項目はありますが，CPU は直接指定できません (アーキテクチャを x86_64 または ARM64 にするかは選択可能です)．
[公式ドキュメント](https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/configuration-memory.html)には，以下の通り記載があります．

> Lambda は、設定されたメモリの量に比例して CPU パワーを割り当てます。メモリは、実行時に Lambda 関数で使用できるメモリの量です。[メモリ] 設定を使用して、関数に割り当てられたメモリと CPU パワーを増減できます。メモリは、128 MB～10,240 MB の値を 1 MB 単位で設定できます。1,769 MB の場合、1 つの vCPU (1 秒あたりのクレジットの 1 vCPU 秒分) に相当します。

しかし，CPU バウンドな処理に Lambda を使いたい場合，メモリしか設定できないと困ります．
4 vCPU が欲しいけれども，メモリサイズをどの値に設定するといいんだろうかといった悩みが生じます．
そこで，実際に複数のメモリ設定で Lambda を実行してみて，CPU のコア数やクロック周波数がどう変化するか観測してみました．

[先駆者](https://qiita.com/komikoni/items/101ccd3cb98fdc4f4389)もいらっしゃいますが，その記事から 5 年も経っているので，改めて現在の Lambda がどうなのか検証しています．

## 結果

先に結果を示します．4 GiB くらいまでは 2 コアで，それ以上は段階的にコア数が増えるようです．この傾向は CPU アーキテクチャに依らず一貫していました．
コア数の推移は先駆者の実験結果と変わらず，今も同じアルゴリズムで割り当てられていると予想できます．

また，x86_64 の CPU モデルは Intel Xeon 系であり，ほとんどが， 2.50 GHz のものでしたが，まれに 2.90 GHz のアタリを引くこともあるみたいです．
100 回のコールドスタートを試行していますが，1%程度の頻度なので，あまり期待しないほうが良さそうです．
ARM64 の場合は，`/proc/cpuinfo` から CPU モデル名を取得できませんでしたが，おそらく Graviton 系のプロセッサを使っていると思われます．

| メモリサイズ (MB) | CPU アーキテクチャ | 論理コア | 物理コア | CPU モデル                                                                                    |
| ----------------- | ------------------ | -------- | -------- | --------------------------------------------------------------------------------------------- |
| 128               | amd64              | 2        | 2        | Intel(R) Xeon(R) Processor @ 2.50GHz (99/100)<br>Intel(R) Xeon(R) Processor @ 2.90GHz (1/100) |
| 128               | arm64              | 2        | -        | -                                                                                             |
| 256               | amd64              | 2        | 2        | Intel(R) Xeon(R) Processor @ 2.50GHz -                                                        |
| 256               | arm64              | 2        | -        | -                                                                                             |
| 512               | amd64              | 2        | 2        | Intel(R) Xeon(R) Processor @ 2.50GHz -                                                        |
| 512               | arm64              | 2        | -        | -                                                                                             |
| 1024              | amd64              | 2        | 2        | Intel(R) Xeon(R) Processor @ 2.50GHz -                                                        |
| 1024              | arm64              | 2        | -        | -                                                                                             |
| 2048              | amd64              | 2        | 2        | Intel(R) Xeon(R) Processor @ 2.50GHz (99/100)<br>Intel(R) Xeon(R) Processor @ 2.90GHz (1/100) |
| 2048              | arm64              | 2        | -        | -                                                                                             |
| 3008              | amd64              | 2        | 2        | Intel(R) Xeon(R) Processor @ 2.50GHz -                                                        |
| 3008              | arm64              | 2        | -        | -                                                                                             |
| 4096              | amd64              | 3        | 3        | Intel(R) Xeon(R) Processor @ 2.50GHz -                                                        |
| 4096              | arm64              | 3        | -        | -                                                                                             |
| 8192              | amd64              | 5        | 5        | Intel(R) Xeon(R) Processor @ 2.50GHz (99/100)<br>Intel(R) Xeon(R) Processor @ 2.90GHz (1/100) |
| 8192              | arm64              | 5        | -        | -                                                                                             |
| 10240             | amd64              | 6        | 6        | Intel(R) Xeon(R) Processor @ 2.50GHz -                                                        |
| 10240             | arm64              | 6        | -        | -                                                                                             |

## 実験方法

実験に使用したコードは[こちら](https://github.com/vinyl-umbrella/playground/tree/main/aws/lambda-cpu)に置いています．
このコードには，3 つの異なる目的のプログラムで構成されています．

- [`lambdasrc/main.go`](https://github.com/vinyl-umbrella/playground/blob/044a4667fdcb414a1b6e4b7e30889e3ed5008c22/aws/lambda-cpu/lambdasrc/main.go): `/proc/cpuinfo` から CPU 情報を取得し，DynamoDB に保存する Lambda 関数．x86_64 と ARM64 の両方の Lambda 関数がデプロイ．
- [`invoke.py`](https://github.com/vinyl-umbrella/playground/blob/044a4667fdcb414a1b6e4b7e30889e3ed5008c22/aws/lambda-cpu/invoke.py): 先述の Lambda 関数を様々なメモリ設定で呼び出すスクリプト．<br>※ Lambda は設定を変更すると次の実行はコールドスタートになるので，実行基盤の変更を強制しています．
- [`stats.py`](https://github.com/vinyl-umbrella/playground/blob/044a4667fdcb414a1b6e4b7e30889e3ed5008c22/aws/lambda-cpu/stats.py): DynamoDB に保存された結果を集計するスクリプト．

メモリ設定を 128MB から 10,240MB まで変更しつつ Lambda を実行し，DynamoDB に蓄積した CPU 情報を集計しました．
なお，本稿の「論理コア／物理コア」は `/proc/cpuinfo` の `processor` 数や `cpu cores` を基準に算出しています．

## まとめ

- 約 4GB までは論理コア 2，それ以上で段階的に増加 (4096MB: 3，8192MB: 5，10240MB: 6)．
- x86_64 では，ほとんどが Intel Xeon @ 2.50GHz ．まれに 2.90GHz を引くこともある．
- ARM64 はモデル名が取得できず (おそらく Graviton)．
- CPU バウンド処理でスレッド並列性を引き出すには，4–8GiB 以上のメモリ設定を検討するとよい．
