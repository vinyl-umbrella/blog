---
title: AWS Signature Version 4 (SigV4) の解説
pubDate: 2025-06-14
description: SigV4 の仕様を理解し実装したので，学習メモとしておいておきます．
tags: ['aws']
---

AWS を使う上で，認証がどうなっているのか，アクセスキーとは何なのかが気になったので，その仕様を調査し実際に実装してみました．
[私のサンプル実装](https://github.com/vinyl-umbrella/sigv4)

詳細な仕様は [AWS のドキュメント](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_sigv.html)をご参照ください．

## AWS Signature Version 4 (SigV4) とは

SigV4 は、AWS の API リクエストを認証するための署名プロトコルです。
SigV4 では，リクエストの中にシークレットアクセスキーを含めず，SigV4 によって生成された署名を使用します．以下の手順で署名を生成します．

1. 送信するリクエストの内容に基づいて署名を生成するための情報を収集
2. AWS 認証情報を用いて，署名を生成
3. 生成された署名をリクエストヘッダに追加
4. リクエストを送信

## 署名に必要な要素

### エンドポイント

送信先の AWS サービスのエンドポイントの DNS 名です．
たとえば，東京リージョンの AWS Lambda のエンドポイントは `lambda.ap-northeast-1.amazonaws.com` です．
IAM はグローバルサービスなので，エンドポイントにリージョンが含まれず，GovCloud などの特殊なリージョンを除いて，`iam.amazonaws.com` となります．

[各サービスのエンドポイントの一覧](https://docs.aws.amazon.com/general/latest/gr/aws-service-information.html)

### アクション

エンドポイントで指定した AWS サービスに対して実行するアクションも必要です．
AWS CLI を触ったことがある方は，`aws lambda list-functions` や `aws iam delete-user` のようなコマンドに見覚えがあると思います．
これらのコマンドは，それぞれ `ListFunctions` や `DeleteUser` というアクションを指定しています．

[AWS Lambda の API リファレンス](https://docs.aws.amazon.com/lambda/latest/api/welcome.html) を見ると，アクションのと次節で説明するパラメータの一覧を確認できます．

### アクションパラメータ

アクションに対して必要なパラメータを指定します．
たとえば，AWS Lambda には `Invoke` という関数を実行するためのアクションがありますが，どの関数を実行するかを指定するために `FunctionName` というパラメータが必要です．

### 日付

リプレイ攻撃の対策として，日付も署名に含める必要があります．

## 署名の生成

順を追って署名の生成について説明します．
実装は[ここ](https://github.com/vinyl-umbrella/sigv4/blob/e2496042d298ae02e1909f67e3bce1dd6157cb7c/sigv4/signer.go#L37)

### 正規化リクエストの生成

リクエストに必要なパラメータを改行 `\n` 区切りで連結した以下のフォーマットの文字列を生成します．

```
<HTTPMethod>\n
<CanonicalURI>\n
<CanonicalQueryString>\n
<CanonicalHeaders>\n
<SignedHeaders>\n
<HashedPayload>
```

`CanonicalHeaders` に含まれるヘッダ名は小文字であり，アルファベット順に指定している必要があります．
STS を使用して short-term credentials を用いる場合は，`x-amz-security-token` ヘッダも含める必要があります．
`SignedHeaders` は，`CanonicalHeaders` に含まれるヘッダ名をセミコロンで連結した文字列です．
最後に，`HashedPayload` はリクエストボディの SHA-256 ハッシュ値を 16 進数で表現したものです．リクエストボディがないときはから文字列の SHA-256 ハッシュ値を使用します．

ListFunctions の例．

```
GET
/2015-03-31/functions
MaxItems=10
content-type:application/x-amz-json-1.1
host:lambda.ap-northeast-1.amazonaws.com
x-amz-date:20250614T081521Z
x-amz-security-token:xxxxxx

content-type;host;x-amz-date;x-amz-security-token
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### 署名文字列の生成

署名文字列は以下のフォーマットです．

```
<Algorithm>\n
<RequestDateTime>\n
<CredentialScope>\n
<HashedCanonicalRequest>
```

SigV4 ではアルゴリズムに `AWS4-HMAC-SHA256` を使用します．
`CredentialScope` は以下のフォーマットで，リージョンとサービス名を含めます．

```
<YYYYMMDD>/<AWSRegion>/<AWSService>/aws4_request
```

`HashedCanonicalRequest` は前ステップで生成した正規化リクエストの SHA-256 ハッシュ値を 16 進数で表現したものです．

例．
```
AWS4-HMAC-SHA256
20250614T081521Z
20250614/ap-northeast-1/lambda/aws4_request
1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 署名キーを取得

署名キーは AWS シークレットアクセスキーを使用し，日付，リージョン，サービス名を組み合わせて HMAC-SHA256 で生成します．
サンプルの実装を以下に示します．

```go
kSecret := "AWS4" + credentials.SecretAccessKey
kDate := HMAC_SHA256([]byte(timestamp.Format("20060102")), []byte(kSecret))
kRegion := HMAC_SHA256([]byte(region), kDate)
kService := HMAC_SHA256([]byte(service), kRegion)
kSigning := HMAC_SHA256([]byte("aws4_request"), kService)
```

AWS Lambda API 呼び出し時の例では、以下のようになります．

```
HMAC_SHA256("aws4_request",
    HMAC_SHA256("lambda",
        HMAC_SHA256("ap-northeast-1",
            HMAC_SHA256("20250614", "AWS4" + <シークレットアクセスキー>))))
```

### 署名の生成

署名の値は，前ステップで生成した署名キーを使用して，署名文字列を HMAC-SHA256 でハッシュ化することで生成します．

### ヘッダに署名を追加

最後に，以上で生成した署名をリクエストヘッダに付与します．
ヘッダのフォーマットは以下の通りです．

```
Authorization: AWS4-HMAC-SHA256 Credential=<アクセスキー>/<日付>/<リージョン>/<サービス>/aws4_request, SignedHeaders=content-type;host;x-amz-date;x-amz-security-token, Signature=<署名>
```

これで AWS へのリクエストが認証されます．

## まとめ

SigV4 では，シークレットアクセスキーはそのままリクエストに含めるのではなく，リージョンやサービス名，日付などを組み合わせていることが理解できました．
そのため，使用するサービスごとに署名は異なるうえ，同じサービスでもリプレイ攻撃の対策されていることもわかりました．
