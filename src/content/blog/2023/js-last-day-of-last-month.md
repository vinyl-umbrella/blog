---
title: js で先月の月末を取得するテクニック
pubDate: 2023-10-27
description: js で先月の月末を取得するテクニック
tags: ['tips']
---

プログラムを書いていると，たまに日付処理が必要になることがありますよね．
日付処理は言語ごとに，いろいろな方法があるが，jsの日付処理が最も扱いづらく，クセが強いと思っています．

jsのDateの内部はunix timeで管理されている．すなわち，Dateの本質はただの大きな数値です．
1時間の加算は，3600秒を足すことと同義ということになる．

## 本題

私が，最もクセが強いと感じるのは，範囲外の日付を指定した場合の挙動です．

通常，先月の最終日を得ようとすると，今月のDateを作成し，日を1にした後に，1日を引くことを思いつくかと思います．

```js
let d = new Date();
console.log(d.toISOString());
// 2023-10-27T08:00:00.000Z
d.setDate(1);
d.setDate(d.getDate() - 1);
console.log(d.toISOString());
// 2023-09-31T08:00:00.000Z
```

しかし，jsのDateは範囲外の日付を指定すると，なんと自動的に補正されます．
`setDate(0)`をすると，今月の0日目になる，すなわち先月の最終日になります．
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

jsだと，8月32日を指定しても，エラーになりません！9月にはなりますが...

(月が0から始まり，日が1から始まることに注意)

```js
let d = new Date(2023, 7, 32, 15, 0, 0);
console.log(d.toISOString());
// 2023-09-01T06:00:00.000Z
```

60日後の計算とか，1000時間後の計算とかも，簡単に計算できます．

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
