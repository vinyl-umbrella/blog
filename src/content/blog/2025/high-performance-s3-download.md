---
title: Go での高効率で高速な S3 ダウンロードの実装
pubDate: 2025-08-02
updatedDate: 2025-08-06
description: Go 言語での AWS S3 から大容量ファイルを効率的にダウンロードする方法について．メモリ効率と並列処理による最適化手法．
tags: ['aws', 'go']
---

## はじめに

AWS S3 から大容量ファイルをダウンロードする際，メモリ不足や処理時間の問題が問題になることがあります．

ローカル環境では問題なく動作していたコードが，メモリ制約のあるクラウド環境で実行すると以下のような問題が発生することがあります．

- OOMKiller
- 想定以上の処理時間
- リソース使用量の急激な増加

### 問題の原因

先述の問題が発生しているとき，多くはメモリの扱い方に問題があります．
S3 から取得したデータを一度にメモリ上に確保してしまっていたり，オンメモリで処理可能にもかかわらず，一度 /tmp に書き出してから処理を行うなどの非効率な実装が主な原因です．

もし，処理したいファイルが 100 GiB あった場合，100 GiB のメモリを用意するなんてことはコストの面でも現実的ではありません．

本記事では，Go 言語における高効率で高速な S3 ダウンロードの実装手法について，実測値を交えて説明します．

## 予備調査

まず，単純な実装である `s3.GetObject` で取得しオブジェクトを丸ごとメモリに乗せる場合，どれくらいのパフォーマンスか調査/測定しました．

```go bad_example.go
// とても非効率な実装
func badGetObject(ctx context.Context, s3Client *s3.Client, bucketName, objectKey, filename string) error {
	result, err := s3Client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return fmt.Errorf("failed to download object: %w", err)
	}
	defer result.Body.Close()

	fileSize := result.ContentLength
	buffer := make([]byte, *fileSize)  // ここでメモリ使用量が急増
    totalRead := 0
	for {
		n, err := result.Body.Read(buffer[totalRead:])

	...
```

この方法では，ファイルサイズと同等のメモリが必要になり，大容量ファイルでは実用的ではありません．

実装はこちらにあります．[GitHub](https://github.com/vinyl-umbrella/playground/blob/55b4fd75c5c1505b70d1108e6d8d09e9cd2bfce9/aws/s3go/main.go#L69-L106)

### 測定環境

- S3 オブジェクトサイズ: 1.5 GiB (=1,604,197,053 bytes)
- 実際の動画ファイルを使用 (非圧縮性データ)

**ハードウェアリソース** (結構リッチな構成ですね)

| 項目         | スペック                          |
| ------------ | --------------------------------- |
| CPU          | Intel Core i5-13500 (6P+8E cores) |
| メモリ       | 32 GiB (DDR5-5600)                |
| ストレージ   | 1 TB NVMe SSD                     |
| ネットワーク | 1 Gbps Ethernet                   |

**ソフトウェア環境**

| 項目         | バージョン |
| ------------ | ---------- |
| Linux Distro | Fedora 41  |
| Linux Kernel | 6.6.87     |
| Go           | 1.22.4     |

[その他 Go モジュールバージョン](https://github.com/vinyl-umbrella/playground/blob/55b4fd75c5c1505b70d1108e6d8d09e9cd2bfce9/aws/s3go/go.mod)

### 予備調査結果

パフォーマンス測定には，以下のコマンドを使用しました．

```sh
go test -bench=BenchmarkBadS3GetObject -benchmem -benchtime=1x
```

| 実行時間 (s) | 総メモリ割当量 (MiB) | アロケーション数 (allocs) |
| ------------ | -------------------- | ------------------------- |
| 120.6        | 1543.1               | 203,067                   |

アロケーション数は多くはないですが，総メモリ割当量はとても大きくなっています．

## 最適化に向けたアプローチ

### AWS SDK for Go v2のアーキテクチャ

AWS SDK for Go v2 では，異なる抽象レベルで 2 種類の API が提供されています．

#### 1. 低レベルAPI (Service Package)

```go
import "github.com/aws/aws-sdk-go-v2/service/s3"
```

- S3 API を直接操作
- 細かい制御が可能だが，実装が複雑
- e.g. `s3.GetObject`, `s3.PutObject` など

#### 2. 高レベルAPI (Manager Package)

```go
import "github.com/aws/aws-sdk-go-v2/feature/s3/manager"
```

- よく使われる操作を簡単に実行
- 自動的な並列処理，リトライ，分割アップロード/ダウンロード
- e.g. `manager.Downloader`, `manager.Uploader` など

大容量ファイルの場合，Manager Package の使用を推奨します．
Download Manager は以下の最適化を自動的に行います．

- Range Request によるファイル分割
- メモリ効率的なストリーミング
- 自動エラーハンドリング (Part 単位での部分的な再試行)

### 実装例

以下が高効率なダウンロード実装例です．

```go
type BucketBasics struct {
	S3Client   *s3.Client
	Downloader *manager.Downloader
}

func (b *BucketBasics) StreamDL(ctx context.Context, bucketName, objectKey, filename string) error {
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// stream download
	_, err = b.Downloader.Download(ctx, file, &s3.GetObjectInput{
		Bucket: aws.String(bucketName),
		Key:    aws.String(objectKey),
	})
	if err != nil {
		return fmt.Errorf("failed to download object: %w", err)
	}

	if fileInfo, err := os.Stat(filename); err == nil {
		log.Printf("Downloaded %d bytes to %s", fileInfo.Size(), filename)
	}

	return nil
}
```

実際に実装したのがこちらです．[GitHub](https://github.com/vinyl-umbrella/playground/blob/main/aws/s3go/main.go#L21-L42)

## 性能測定と最適パラメータの決定

### 測定方法

パフォーマンス測定には `go test -bench` を使用します．
PartSize や並列数を変えて，どのようなパフォーマンスになるかを測定しました．

### PartSizeの影響 (並列数は 1 に固定)

| PartSize | 実行時間(s) | メモリ使用量(MiB) | アロケーション数 |
| -------- | ----------- | ----------------- | ---------------- |
| 512 KiB  | 226.9       | 269               | 2,410,394        |
| 1 MiB    | 185.1       | 130               | 1,193,982        |
| 2 MiB    | 152.3       | 66.3              | 645,293          |
| 5 MiB    | 128.0       | 27.9              | 309,246          |
| 10 MiB   | 99.2        | 15.1              | 201,328          |

PartSize が大きいほど，実行時間・メモリ使用量・アロケーション数すべてが改善．

### Concurrency の影響 (PartSize は 1 MiB に固定)

| 並列数 | 実行時間(s) | メモリ使用量(MiB) | アロケーション数 |
| ------ | ----------- | ----------------- | ---------------- |
| 1      | 174.9       | 133               | 1,195,747        |
| 2      | 104.0       | 131               | 1,196,784        |
| 4      | 59.3        | 138               | 1,200,366        |
| 8      | 39.8        | 132               | 1,208,494        |
| 16     | 30.5        | 133               | 1,218,981        |

並列数は，メモリ使用量への影響はほとんどない一方で，実行時間に大きな影響があった．

### 最適組み合わせの探索

| PartSize | 並列数 | 実行時間(s) | メモリ使用量(MiB) |
| -------- | ------ | ----------- | ----------------- |
| 10 MiB   | 16     | 30.4        | 17.6              |
| 20 MiB   | 16     | 31.3        | 22.2              |
| 50 MiB   | 16     | 32.4        | 7.49              |
| 100 MiB  | 16     | 38.0        | 6.30              |
| 200 MiB  | 16     | 47.6        | 4.24              |

PartSize を大きくすると，予想に反してメモリ使用量は減少した一方で，実行時間は PartSize に比例し増加．

### 補足

AWS SDK for Go v2 のドキュメントでは「PartSize の最小値は 5MB」と記載されていますが<cite>[^1]</cite>，実際にはそれ以下の値でも動作し，性能に影響があることが確認できました．

[^1]: https://github.com/aws/aws-sdk-go-v2/blob/2e08461090ccba679456c05264e2c04bf228138e/feature/s3/manager/download.go#L50

### **余談** 単純なストリーミング読み込みの場合

s3.GetObject でメモリを確保しなかった場合の例．
`s3.GetObject` でも，`io.Reader` を使用してストリーミングで読み込むことで，メモリ効率を改善できます．

```go
resp, err := s3Client.GetObject(ctx, &s3.GetObjectInput{...})
if err != nil {
    return err
}
defer resp.Body.Close()

// ストリーミングでファイルにコピー
_, err = io.Copy(file, resp.Body)  // メモリ効率が良い
```

| 実行時間 (s) | 総メモリ割当量 (MiB) | アロケーション数 (allocs) |
| ------------ | -------------------- | ------------------------- |
| 134.0        | 13.1                 | 200,063                   |

この方法でも十分にメモリ効率は良いですが，並列処理による高速化は実現できません．計算リソースに余裕があり，大容量ファイルの場合は，Download Manager の使用を推奨します．

[GitHub](https://github.com/vinyl-umbrella/playground/blob/55b4fd75c5c1505b70d1108e6d8d09e9cd2bfce9/aws/s3go/main.go#L68-L106)

</details>

## まとめ

S3 の大きなオブジェクトのダウンロードでは，`github.com/aws/aws-sdk-go-v2/feature/s3/manager` を使用することをお勧めします．
ページサイズや並列数は使用する環境によって調整が必要だが，ページサイズは大きくするほど，メモリ割当回数が小さくなり，オーバヘッドは小さくなる傾向があります．
並列数も大きくするほど，総メモリ割当量が小さくなる傾向があります．

ただし，実行環境によって最適なパラメータは異なるため，実際のアプリケーションが動作する環境でパフォーマンステストを実施し，最適なパラメータを見つけることが重要です．
