---
title: rdap サーバを作った
pubDate: 2025-10-02
description: .jp ドメインが RDAP プロトコルに対応していないため，自前で RDAP サーバを構築しました．
tags: ['domain']
---

## 背景

ドメインの有効期限や登録者情報を調べるときは `whois` コマンドを使用すると思います．
この `whois` コマンドの中では，レジストラが提供するサーバの TCP の 43 番ポートに接続して，ドメインの情報を取得しています．
ここで使用される [WHOIS プロトコル](https://datatracker.ietf.org/doc/html/rfc3912)は，応答の形式が標準化されていなかったり，確認したいドメインが，どのレジストリで管理されている情報であるのか確認してから WHOIS サーバに問い合わせる必要があったりと，いくつかの問題がありました．
また，WHOIS の提供が 2025 年 1 月から非義務化され，実際にいくつかの TLD では，WHOIS での問い合わせができなくなりました．

e.g. `.info`, `.fan`, `.xyz` など．

今後は，[RDAP (Registration Data Access Protocol)](https://datatracker.ietf.org/doc/html/rfc9083) を使用して，ドメインの情報を取得することが標準と変わっていきます．
しかしながら，RDAP の普及はまだまだであり，特に我々日本人が使用する `.jp` ドメインは，2025 年 9 月時点で RDAP に対応していません．

## RDAP 概要

RDAP は WHOIS を置き換えるために策定された「HTTPS + JSON」ベースのプロトコル群です．サーバは Web API のエンドポイントを公開し，クライアントは標準化されたパスに対して GET を行います．主な仕様は RFC 9082(クエリ)と RFC 9083(応答モデル)で定義されています．
特徴をざっと挙げると以下のとおりです．

- エンドポイント: `/domain/{name}`，`/entity/{handle}`，`/nameserver/{name}`，`/ip/{cidr}`，`/autnum/{asn}` などが標準化されている．
- オブジェクトモデル: `domain`／`entity`／`nameserver`／`autnum`／`ip network` 等に統一スキーマがあり，`events`(登録・更新・有効期限)，`status`，`links` といったフィールドが共通で使える．
- 国際化: LDH 名(ASCII，punycode)と Unicode 名を併記でき，IDN でも一貫した応答が得られる．
- 制御とエラー表現: HTTP ステータスと JSON エラー本文を用いるため，レートリミット通知(429)や詳細なエラー理由を機械判別しやすい．
- ブートストラップ: IANA が公開する辞書に「TLD -> RDAP ベース URL」が登録されており，クライアントはこれを元に問い合わせ先レジストリを決定する．

ブートストラップデータは次のような JSON で提供されます．以下は抜粋です．

```json
{
    "version": "1",
    "publication": "2024-09-01T00:00:00Z",
    "services": [
        [
            ["com"],
            ["https://rdap.verisign.com/com/v1/"]
        ]
    ]
}
```

クライアントはこのベース URL に対して `/domain/example.com` のようなパスで問い合わせます．応答は JSON なので，機械処理を行いやすくなっています．たとえば，`example.com` の情報は以下のように取得できます．

```json
{
    "objectClassName": "domain",
    "ldhName": "example.com",
    "status": ["active"],
    "events": [
        { "eventAction": "registration",                     "eventDate": "1995-08-14T04:00:00Z" },
        { "eventAction": "expiration",                       "eventDate": "2026-08-13T04:00:00Z" },
        { "eventAction": "last changed",                     "eventDate": "2025-08-14T07:01:39Z" },
        { "eventAction": "last update of RDAP database",     "eventDate": "2025-10-02T12:41:56Z" }
    ],
    "links": [
        { "rel": "self", "href": "https://rdap.verisign.com/com/v1/domain/EXAMPLE.COM" }
    ]
}
```

RDAP クライアントとしては `rdap` コマンドや単純な `curl` での利用が一般的です．

## `.jp` ドメインを RDAP に対応させよう

実際に作ったものは[こちら](https://github.com/vinyl-umbrella/jprdap)です．
課題はシンプルで，`.jp` は IANA の Bootstrap に RDAP ベース URL が登録されていないため，既存クライアントは「どこへ問い合わせればよいか」を自動判断できません．
そこで，クライアントが参照する Bootstrap を自前のものに差し替え，その先で RDAP 風の応答を返すことで `.jp` を暫定的に RDAP に対応させます．

アーキテクチャは次の 3 段構えです．

1. **Bootstrap 代替**: `/bootstrap/dns.json` エンドポイントで IANA と互換な JSON を返し，`.jp` のベース URL を `https://jprdap.jsmz.dev/rdap/` に誘導する．`rdap` コマンドを使う際は `--bs-url` をこちらに向けて使用する．
2. **RDAP アダプタ**: `/rdap/domain/{name}` への問い合わせを受け，JPRS が提供する WHOIS (Port 43) の既存ソースを参照しつつ，RDAP スキーマに正規化した JSON を返す．
3. **補助機能**: キャッシュやレートリミット，punycode／小文字化による入力正規化などを実装して安定運用できるようにする．

Bootstrap のレスポンス例を以下に示します．

```json
{
    "version": "1",
    "publication": "2025-09-01T00:00:00Z",
    "services": [
        [
            ["jp"],
            ["https://jprdap.jsmz.dev/rdap/"]
        ]
    ]
}
```

`.jp` 特有の注意点は次のとおりです．

- レジストラ種別の第 2 レベル (`co.jp`，`ne.jp` など) が存在しますが，登録単位は `example.co.jp` のような第 3 レベルが多いです．RDAP の `/domain/{name}` は問い合わせられた FQDN をそのまま対象にします (`co.jp` 自体は通常の登録対象ではありません)．
- Unicode ドメインは punycode へ正規化してから処理し，応答では `ldhName` (ASCII) と `unicodeName` を併記します．
- 応答のフィールド可用性は WHOIS 側の開示方針に依存します．

使い方．

```sh
rdap --bs-url="https://jprdap.jsmz.dev/bootstrap" --json google.jp
```

`curl` でも直接叩けます．

```sh
curl -s "https://jprdap.jsmz.dev/rdap/domain/google.jp" | jq .
```

実際のされる応答の例を以下に示します．

```jsonc
{
  "rdapConformance": [
    "rdap_level_0"
  ],
  "objectClassName": "domain",
  "ldhName": "google.jp",
  "unicodeName": {
    "domain": "google.jp",
    "error": false
  },
  "links": [
    {
      "rel": "self",
      "href": "https://jprdap.jsmz.dev/rdap/domain/google.jp",
      "type": "application/rdap+json"
    },
	// ...
  ],
  "events": [
    {
      "eventAction": "expiration",
      "eventDate": "2026-05-30T15:00:00.000Z"
    },
    {
      "eventAction": "last changed",
      "eventDate": "2025-05-31T16:05:04.000Z"
    }
  ],
  "status": [
    "active"
  ],
  "nameservers": [
    {
      "ldhName": "ns1.google.com"
    },
	// ...
  ],
  "entities": [
    {
      "objectClassName": "entity",
      "roles": [
        "registrant"
      ],
      // ...
    }
  ],
  "notices": [
	// ...
  ]
}

```

注意事項は以下のとおりです．

- 非公式サービスです．正確性は保証されません．重要用途では公式ソースと照合してください．
- DDoS 対策としてレートリミットを設けていますが，大量アクセスはご遠慮ください．
- 将来的に `.jp` に公式 RDAP が導入され，IANA Bootstrap が更新された場合は，`--bs-url` の指定は不要になり，通常の RDAP クライアントでそのまま解決できるようになります．
