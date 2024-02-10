---
title: AWS SAA 合格体験記
pubDate: 2023-11-30
description: 新卒SRE が AWS SAA 合格にしました
tags: ['aws', 'infra']
---

## 筆者のプロフィール

- 新卒1年目
- 7月にSREに配属
- 経験
  - awsはちょっと触ったことがある (EC2, SES, Route 53)
  - インフラの知識もちょっとある (メールサーバ，Webサーバは構築したことある)
  - Linux(Unix)は好き

## 勉強前の知識

- 業務でちょっとAWSをさわりはjメタ
- EC2 で遊んだことがある．
- Lambda サーバレスな関数で便利ということは知っており，ちょっと触ったことがある．
- S3 はオブジェクトストレージであることは知っているが，バケットポリシーやライフサイクルなどの機能の詳細，細かな設定値は知らない．
- サービス間のつながりはまだまだわからない．
- 運用の知識なし

## 勉強方法，スケジュール

1. まずは，Skill BuilderのCLFの映像講座，練習問題をやった
   - サービス名とその機能を一通り眺めて，少ないが知らない部分を補った
   - レベルはあまり高くなかったので，私は受ける必要はないなと思った
2. [UdemyのSAAの講座](https://www.udemy.com/course/aws-associate/)を受講
   - 2倍速で流した
   - 全部で50時間近くあり，半分くらい見たところで長すぎると感じた．先に問題を解くことにした
3. Skill BuilderのSAAの問題を解いた
   - 本番よりちょっと優しめ？
   - 1周目の正答率は60%くらい．2周目の正答率は90%くらい
4. Udemyの講座の各カテゴリの小テストを解いた
   - 正答率が低かったカテゴリは，動画で見直し
   - 再度，小テスト
   - 繰り返し行うことで，知識が定着した気がする
5. Udemy 講座の模擬試験1つ目(65問)解いた
   - 1つめは容易
   - 正解した問題も間違えたものもすべて解説を読んだ
6. Udemy 講座の模擬試験2つ目(65問)解いた
   - 本番と同等レベル
   - 合格率は68%くらい．ちょっと不安になった
   - 正解した問題も間違えたものもすべて解説を読んだ
   - 次の日にまた，解いて85%くらいになった
7. 試験申し込み
   - ある程度，自信がついたので，4日後に受けることを決意
8. Udemy 講座の模擬試験3つ目(65問)解いた
   - 試験前日にといた．得点は74%でギリギリかもしれないと思ったが，試験に臨んだ
   - 本番と同等レベル
   - 正解した問題も間違えたものもすべて解説を読んだ

## 反省点

動画を垂れ流ししているだけでは，知識が定着しないので，さっさと模擬試験・小テストを解き，理解していない分野を動画で補強する方が効率が良さそうだった．

また，触れたことないサービスについては手を動かしてみると，さらによさそう．

## まとめ

無事，一発でSAAを取得することができました．得点は模擬試験よりも高く，776点でした．
これでSREとしての一歩を踏み出すことができたかな．

---

以下，学習時のメモ抜粋

<details>
<summary> S3 </summary>

S3は強い整合性モデル．アップデートがオブジェクトに対して同じキー名で設定しても，誤差が生じることがない．not 結果整合性モデル．

ストレージクラス

- STANDARD
  - 複数個所にデータを複製するため耐久性あり
- STANDARD-IA
  - Infrequent Access
  - 低頻度アクセスデータ用
  - データ取得は早い
  - Standardより安い
- OneZone-IA
  - マルチAZされていないので可用性が低い
  - Standard-IAより安い
- INTELLIGENT_TIERING
  - 高頻度と低頻度(Standard-ia)のアクセスを自動的に判断して適切なストレージクラスに配置
  - アクセスパターンが不明な場合に有効
  - 最初はStandardに配置
  - 30日アクセスがないと Standard-IA に移動
  - 90日アクセスがないと Glacier に移動
  - 180日アクセスがないと Glacier Deep Archive に移動
- S3 Glacier
  - 1年に1~2回くらいのアクセス用
  - データ検索で3~5時間かかる
  - 迅速取り出しというちょっとお金がかかる取り出しを使うと2~5分で取り出せる
- S3 Glacier Instant Rtrieval
  - アクセスされることがほとんどなく，ミリ秒単位の取り出しが必要な長期間有効なデータ向け
  - 医用画像やニュースメディアなど
  - S3 Standard と同じパフォーマンス
- S3 Glacier Deep Archive

  - 7~10年以上保持される長期間使用されるが，めったに取り出さないデータ向け
  - 標準の取り出しで12時間以内かかる

- S3 Transfer Acceleration

  - edgeを使って地理的に近いとこにアップロードするため高速でアップロードできる

- S3 レプリケーション
  - リージョン間をまたぐS3の複製
  - 別アカウントへの複製も可能

</details>

<details>
<summary> Well Architected Framework </summary>

- 6つの柱
  - Reliability 信頼性
  - Performance Efficiency パフォーマンス効率
  - Security セキュリティ
  - Cost Optimization コスト最適化
  - Operational Excellence 運用の優秀性
  - Sustainability 持続可能性

上4つがSAAの試験範囲．Well Architected Frameworkを利用することで，最適解や改善点を見つけることができる．ただ，あくまで参考であり，絶対ではない．

</details>

<details>
<summary> 信頼性の設計 </summary>

- ELB

  - ヘルスチェック
  - クロスゾーン負荷分散
    - オフだとAZ間で均衡
    - オンだとインスタンスごとに均等(ゾーンレベルでは不均衡)
  - スティッキーセッション
    - セッション維持のために端末が別インスタンス宛にならないようにする機能
  - Connection Draining
    - インスタンスに異常が発生した場合に，そのバックエンドインスタンスへの指定した数秒は通信が切れずに，処理中のリクエストが終わるまで一定期間待機する

- Auto Scaling

  - 負荷が高まった時に，新しくインスタンスを増設してくれる機能
  - 垂直スケーリング
    - サーバの性能の増強
  - 水平スケーリング
    - マシンの台数を増加
  - 起動テンプレートから起動設定を設定
    - 閾値の設定等をする

- RDS
  - プライマリとセカンダリは自動同期
  - プライマリに障害が発生した場合，自動でフェールオーバーが実行．セカンダリがプライマリに昇格
  - Auroraではリードレプリカからプライマリに昇格可能
  - キャッシュ
  - ElastiCacheがインメモリDB
  - MySQLならMemCached機能を利用することも選択肢
  </details>

<details>
<summary> DB </summary>

- Dynamo

  - 大量の読み書きには向いていない
  - IoTデータとか，ゲームのセッションデータとかに向いている
  - 無制限に性能を拡張可能
    - テーブルサイズには制限なし
    - データ項目は400kbまで
  - 高可用性
  - DAXつかえば高速になる
    - インメモリキャッシュ
  - デフォルトでは結果整合性
    - オプションで強い整合性モデル
  - オンデマンドモード
    - ストレージ，Read, Writeにより，課金
    - Read/Writeを自動スケーリング
  - プロビジョニングモード
    - 設定したキャパシティに基づいて課金
    - キャパシティ要領に近づくとHTTP400を返す
  - クロスリージョン可能(別料金)

  - Dynamo DB ストリーム
    - データのイベントをキャプチャできる機能
    - 24時間以内の履歴を参照できる
    - Kinesisと連携してイベントをストリームする
  - バックアップ
    - オンデマンドバックアップ
      - 任意のタイミングでテーブルの完全なバックアップの作成
      - 長期間の保存とアーカイブを実施
    - ポイントインタイムリカバリ
      - 連続バックアップを有効化して，バックアップを継続的に実施
      - 最大35日間の任意の地点にテーブルを復元可能
  - セカンダリインデックス
    - プライマリキー以外にインデックスを作りたいときに作成する
  - TTL
    - データの生存時間を設定できる

---

- Aurora
  - 自動で3つのazにコピー
  - 各コピーは仮想ボリュームで，これを1つのDBとしてみている
  - リードレプリカは最大15個(RDSは最大5個)
  - マスタに障害が起きると，リードレプリカがマスタに昇格してフェールオーバー
  - マスタを複数作ることもできる(マスタ・スレーブ構成)

---

- Auroraサーバレス
  - Auroraと同様に自動でCPU数などをスケーリングしてくれる
  - エンドポイントを使用して接続せずにSQLを実行できる
  - 変動が激しい場合にサーバレスの利用

---

- Redshift

  - マルチAZで自動フェールオーバーもできる
  - プライマリのリージョンで障害に起きた時に，別AZに自動で移動することもできる
  - ただしスナップショットからの復元のためちょっとダウンタイムがある
    - コンピュートノードをリザーブドノードにするとコスト削減が可能
  - 利用時間が限られるならRedshift Serverlessを使用するほうがコストが低い

    - Redshiftから移行可能

  - Redshift Spectrum
    - S3にあるデータをぶんせきできる

---

- ElastiCache

  - インメモリキャッシュDB

    - Memcachedは一時的．基本的にRedisを使用

  - Encryption In Transit
    - 通信路の暗号化
  - Redis Auth
    - 認証
  - Encryption at REST
    - 保存時の暗号化

</details>

<details>
<summary> SQS </summary>

ちゃんと処理がおわったらDelete MessageAPIで削除する

- 標準キュー

  - 重複の可能性あり
  - なるべく順番通り

- FIFOキュー
  - 順番通り
  - トランザクション数に制限ができる

アクセスポリシーで許可などの設定

可視性タイムアウトを設定することで一定期間1つのコンシューマだけがそのメッセージを閲覧できるようになる

</details>