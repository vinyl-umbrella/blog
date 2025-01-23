---
title: Cython で遊んでみた
pubDate: 2024-02-10
description: Cython による高速化を試してみました．どの程度高速化できるのか，竹内関数を実装して比較してみました．
tags: ['python']
---

先日，[pandasのTimestampの実装](https://github.com/pandas-dev/pandas/blob/main/pandas/_libs/tslibs/timestamps.pyx) を読む機会がありました．pandas では，`pyx` という見慣れない拡張子のファイルで，プログラムが実装されていました．

変数や関数に型定義がされていたりと，ちょっと見慣れない記述が多かったので，調べてみたところ，Cython という言語で書かれていることがわかりました．

## Cython とは

[Cython](https://cython.org/) は，Python と C 言語の統合を可能にし，Python コードを高速で効率的なモジュールを作成するための言語です．

Cython では，C 言語の関数を直接呼び出せたり，C 言語の型やクラスを扱うことができます．

端的に言えば，Cython は，C 言語の高速な実行速度と Python の簡潔な記述を両立させることができる便利な言語です．

## Cythonの基礎文法

本稿では，Cython で書かれたコードと Python で書かれたコードの実行時間を比較することを目的とします．

基本的な文法は，Python と同じです．
明らかに異なる点は，Python の文法と異なる点は，関数の宣言と，変数の型を明示している点くらいですね．
(細かいところを見れば，もっとたくさんの違いがあります！本稿で紹介するのは，その一部です．)

Cython での関数の宣言には，`def`, `cpdef`, `cpdef` の 3 つのキーワードがあります．

- `def`
  - Python の関数として定義
  - Cython 内(C 言語)から呼び出すことはできない
- `cdef`
  - `def` の反対で，Cython 内(C 言語)からのみ呼び出すことができる
  - Python からは呼び出すことができない
  - C 言語の関数に変換されるので高速
    - Python での不要なオーバヘッドを削減できる
- `cpdef`
  - Python, Cython 内の両方から呼び出すことができる
  - Python のオブジェクトを操作したいけど，C 言語の関数としても扱いたいときに用いる
  - `cpdef` は `cdef` よりもオーバヘッドが増える分ちょっと遅い

## Cythonのインストール

```sh
pip install cython
```

## Cythonを使ってみる

### 実装

パフォーマンス測定によく使われる [竹内関数](https://ja.wikipedia.org/wiki/%E7%AB%B9%E5%86%85%E9%96%A2%E6%95%B0) を実装してみます．

以下が，Cython で実装した竹内関数です．(syntax highlight してくれなくて悲しい...)

[私のGitHub](https://github.com/vinyl-umbrella/playground/tree/main/python/cython) にもコードを置いておきます．

先ほど示したように，`cpdef` で宣言しています．また，`int` 型の引数を受け取り，`int` 型の戻り値を返すことを明示しています．

```pyx tarai.pyx
cpdef int tarai(int n):
    if n == 0 or n == 1:
        return 0

    elif n == 2:
        return 1

    else:
        return tarai(n - 1) + tarai(n - 2) + tarai(n - 3)
```

### ビルド

`cython` コマンドを使ってビルドしてもよいですが，オプション等扱うには，`setup.py` を使ったほうが便利ですので，そちらを使用します．

`cythonize()` に対象ファイルを含めています．

`setup()` には，ビルド時のオプションとして，`build_ext` と `--inplace` を指定しています．
これらにより，ビルドしたファイルがカレントディレクトリに出力されます．

```python setup.py
from distutils.core import setup
from Cython.Build import cythonize

setup(
    ext_modules=cythonize(
        "tarai.pyx",
        compiler_directives={"language_level": "3"},
    ),
    script_args=["build_ext", "--inplace"],
)
```

`setup.py` を実行するだけでビルドできます！

また，ビルド時に，どのようにしてビルドしているか出力されます．`gcc` を使っていることや，`-O2` オプション等が指定されていることがわかります．

```sh
# ビルド
python3 setup.py

# Compiling tarai.pyx because it changed.
# [1/1] Cythonizing tarai.pyx
# running build_ext
# building 'tarai' extension
# C compiler: x86_64-linux-gnu-gcc -Wno-unused-result -Wsign-compare -DNDEBUG -g -fwrapv -O2 -Wall -g -fstack-protector-strong -Wformat -Werror=format-security -g -fwrapv -O2 -fPIC

# compile options: '-I/usr/include/python3.10 -c'
# x86_64-linux-gnu-gcc: tarai.c
# x86_64-linux-gnu-gcc -shared -Wl,-O1 -Wl,-Bsymbolic-functions -Wl,-Bsymbolic-functions -g -fwrapv -O2 build/temp.linux-x86_64-cpython-310/tarai.o -L/usr/lib/x86_64-linux-gnu -o build/lib.linux-x86_64-cpython-310/tarai.cpython-310-x86_64-linux-gnu.so
# copying build/lib.linux-x86_64-cpython-310/tarai.cpython-310-x86_64-linux-gnu.so ->
```

ビルドすると，C 言語に変換されたファイルや，それからコンパイルされた共有ライブラリ，オブジェクトファイルが生成されます．
以下がビルド後のディレクトリ構造です．

```
.
├── build
│   ├── lib.linux-x86_64-cpython-310
│   │   └── tarai.cpython-310-x86_64-linux-gnu.so
│   └── temp.linux-x86_64-cpython-310
│       └── tarai.o
├── setup.py
├── tarai.c
├── tarai.cpython-310-x86_64-linux-gnu.so
└── tarai.pyx
```

サイズは以下のようになりました．Python から扱えるよう，いろいろ含まれているので，大きいですね．

| ファイル名                                  | サイズ |
| ------------------------------------------- | ------ |
| tarai.c                                     | 230K   |
| tarai.cpython-310-x86_64-linux-gnu.so       | 149K   |
| build/temp.linux-x86_64-cpython-310/tarai.o | 239K   |

### Pythonからの呼び出し

さて，ビルドが完了したので，Python から呼び出してみます．

通常の Python のモジュールと同じように，`import` して使うことができます．モジュール使用者は，モジュールが Python で実装されているのか，Cython で実装されているのかを意識せずに使うことができます！
これはうれしい．

```python call_cython.py
import tarai


n = 30
result = tarai.tarai(n)
print(result)
```

## パフォーマンス測定

Python でも同様の竹内関数を実装し，実行時間を比較してみます．

```py compare.py
import time

import tarai


def pytarai(n) -> int:
    if n == 0 or n == 1:
        return 0
    elif n == 2:
        return 1
    else:
        return pytarai(n - 1) + pytarai(n - 2) + pytarai(n - 3)


n = 30
s1 = time.perf_counter()
pytarai(n)
total1 = time.perf_counter() - s1
print("python:\t", total1)

s2 = time.perf_counter()
tarai.tarai(n)
total2 = time.perf_counter() - s2
print("cython:\t", total2)


print(total1 / total2)
```

### 実行結果

| 実装言語 | 実行時間 (s) |
| -------- | ------------ |
| Python   | 2.808        |
| Cython   | 0.08199      |

なんと，34 倍も高速化されました！

実行時間にすごく影響が出るプログラムを実装し，比較しているので，差が大きく出ました．
とはいえ，Cython を用いると一般的なプログラムでも，数倍の高速化が期待できると思います．

## 所感

Cython は，Python コードの高速化に使えて，便利そうです．

プログラムの高速化だけであれば，Python なんて遅い言語を使わず，初めからコンパイル言語を使うべきだと思います．
しかし，Cython の強みは Python の柔軟な記述を活かしつつ，高速化できることだろうと感じました．

pandas のように大きなデータを扱うモジュールが Cython を使用していることは理にかなっています．
