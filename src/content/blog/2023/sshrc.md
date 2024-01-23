---
title: SSHログインをSlackやDiscordに通知する方法
pubDate: 2023-02-06
description: SSHログインをSlackやDiscordに通知する方法
tags: ['tips']
---

## 背景

色んなクラウドサービスを使い始めると，インスタンスが増え管理が厄介になりますよね．

そこで，SSHで誰かが入ったときにSlackやDiscordに通知する方法を忘備録としてここに残しておきます．

メールを送信して通知するのでもいいんですが，最近はメールよりもSlackやDiscordといったチャットツールのほうがよく使うのでこっちに通知を送りたい．

(もちろん電子メールも優れた技術だと思ってます．)

## 実現方法

`/etc/ssh/sshrc` はSSHログイン後，shellの起動時に発火するスクリプトです．
ここにログインを通知するようなシェルスクリプトを書けば通知してくれます．

また，`sshrc`はシェルスクリプトなので任意のコマンドを実行し投げるメッセージ内容をカスタマイズも可能．

### Slackの場合

WebhookのURLを設定し，`sshrc`に以下の内容を設定すると，ホスト名，ログイン日時，クライアントIP，クライアントポートが任意のSlackのチャンネルに投稿される．

送信する内容のカスタマイズに関しては[Slackのドキュメント](https://api.slack.com/messaging/webhooks)を見るとよい．

```sh:/etc/ssh/sshrc
SLACK_WEBHOOK_URL=''
echo '{"username": "`hostname`", "text": "`'`date "+%Y-%m-%d %H:%M:%S"` '[login]:' $SSH_CLIENT'`"}' | curl -X POST -H "Content-Type: application/json" -d @- $SLACK_WEBHOOK_URL
```

![sshrc slack](./assets/sshrc_slack.webp)

### Discordの場合

Discordも同様に，WebhookのURLを設定し，`sshrc`に以下の内容を設定すると，ホスト名，ログイン日時，クライアントIP，クライアントポートが任意のDiscordのチャンネルに投稿される．

もちろんアイコンなども設定できる．詳しくは[Discordのドキュメント](https://discord.com/developers/docs/resources/webhook)を見るとよい．

```sh:/etc/ssh/sshrc
DISCORD_WEBHOOK_URL=''
echo '{"username": "'`hostname`'", "content": "`'`date "+%Y-%m-%d %H:%M:%S"` '[login]:' $SSH_CLIENT'`"}' | curl -X POST -H "Content-Type: application/json" -d @- $DISCORD_WEBHOOK_URL
```

![sshrc discord](./assets/sshrc_discord.webp)

## 余談

- `sshrc`に使える環境変数は実行環境によって異なるが，[ubuntuのmanpage](https://manpages.ubuntu.com/manpages/jammy/en/man1/ssh.1.html#environment)を見ると，いろいろ紹介されてる．

- 本記事で紹介したサンプルコードでは，`$SSH_CLIENT`を使っているが，こちらはdeprecatedらしい．`$SSH_CONNECTION`を使うのが良いかもしれない．
  https://github.com/openssh/openssh-portable/blob/0d96b1506b2f4757fefa5d1f884d49e96a6fd4c3/session.c#L1164-L1185

- ほかに使えそうな環境変数を探したいときはひとまず`printenv`で確認してみるとよい．
