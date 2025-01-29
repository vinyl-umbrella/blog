---
title: js で先月の月末を取得するテクニック
pubDate: 2023-10-27
description: js で先月の月末を取得するテクニック
tags: ['tips']
---

プログラムを書いていると，たまに日付処理が必要になることがありますよね．日付処理は言語ごとに，いろいろな方法があるが，js の日付処理が最も扱いづらく，クセが強いと思っています．
js の Date の内部は unix time で管理されている．すなわち，Date の本質はただの大きな数値です．
1 時間の加算は，3600 秒を足すことと同義です．

## 本題

私が，最もクセが強いと感じるのは，範囲外の日付を指定した場合の挙動です．
通常，先月の最終日を得ようとすると，今月の Date を作成し，日を 1 にした後，1 日を引くことを思いつくかと思います．

```js
let d = new Date();
console.log(d.toISOString());
// 2023-10-27T08:00:00.000Z
d.setDate(1);
d.setDate(d.getDate() - 1);
console.log(d.toISOString());
// 2023-09-31T08:00:00.000Z
```

しかし，js の Date は範囲外の日付を指定すると，なんと自動的に補正されます．
`setDate(0)` をすると，今月の 0 日目になる，すなわち先月の最終日になります．
これ，すごく面白い挙動ですよね．

```js
let d = new Date();
console.log(d.toISOString());
// 2023-10-27T08:00:00.000Z
d.setDate(0);
console.log(d.toISOString());
// 2023-09-30T08:00:00.000Z
```

## 余談

<!-- textlint-disable -->

js だと，8 月 32 日を指定しても，エラーになりません！9 月にはなりますが...

<!-- textlint-enable -->

(月が 0 から始まり，日が 1 から始まることに注意)

```js
let d = new Date(2023, 7, 32, 15, 0, 0);
console.log(d.toISOString());
// 2023-09-01T06:00:00.000Z
```

60 日後の計算とか，1000 時間後の計算とかも，簡単に計算できます．

```js
let d = new Date();
d.setDate(d.getDate() + 60);
console.log(d.toISOString());
// 2023-12-26T08:00:00.000Z

d = new Date();
d.setHours(d.getHours() + 1000);
console.log(d.toISOString());
// 2023-12-08T00:00:00.000Z
```
