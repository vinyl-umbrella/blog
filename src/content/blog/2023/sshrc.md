---
title: SSH のログインを Slack や Discord に通知する方法
pubDate: 2023-02-06
description: SSH のログイン を Slack や Discord に通知する方法
tags: ['tips']
---

## 背景

色んなクラウドサービスを使い始めると，インスタンスが増え管理が厄介になりますよね．
そこで，SSH で誰かが入ったときに Slack や Discord に通知する方法を忘備録としてここに残しておきます．
メールを送信して通知するのでもよいですが，最近はメールよりも Slack や Discord といったチャットツールのほうがよく使うので，こっちに通知を送るのがよいかなと思います．(もちろん電子メールも優れた技術だと思っています！)

## 実現方法

`/etc/ssh/sshrc` は SSH ログイン後，shell の起動時に発火するスクリプトです．ここにログインを通知するようなシェルスクリプトを書けば通知してくれます．
また，`sshrc` はシェルスクリプトなので任意のコマンドを実行し投げるメッセージ内容をカスタマイズも可能です．

### Slackの場合

Webhook の URL を設定し，`sshrc` に以下の内容を設定すると，ホスト名，ログイン日時，クライアント IP，クライアントポートが任意の Slack のチャンネルに投稿されます．
送信する内容のカスタマイズに関しては [Slackのドキュメント](https://api.slack.com/messaging/webhooks) を参照ください．

```sh /etc/ssh/sshrc
SLACK_WEBHOOK_URL=''
post_data='{"username": "'$(hostname)'", "text": "`'$(date "+%Y-%m-%d %H:%M:%S")' [login]: '$($SSH_CLIENT)'`"}'
echo $post_data | curl -X POST -H "Content-Type: application/json" -d @- $SLACK_WEBHOOK_URL
```

![sshrc slack](./assets/sshrc_slack.webp)

### Discordの場合

Discord も同様に，Webhook の URL を設定し，`sshrc` に以下の内容を設定すると，ホスト名，ログイン日時，クライアント IP，クライアントポートが任意の Discord のチャンネルに投稿されます．
もちろんアイコンなども設定できます．詳しくは [Discordのドキュメント](https://discord.com/developers/docs/resources/webhook) を参照ください．

```sh /etc/ssh/sshrc
DISCORD_WEBHOOK_URL=''
post_data='{"username": "'$(hostname)'", "content": "`'$(date "+%Y-%m-%d %H:%M:%S")' [login]: '$($SSH_CLIENT)'`"}'
echo $post_data | curl -X POST -H "Content-Type: application/json" -d @- $DISCORD_WEBHOOK_URL
```

![sshrc discord](./assets/sshrc_discord.webp)

## 余談

- `sshrc` に使える環境変数は実行環境によって異なりますが，[ubuntu の manpage](https://manpages.ubuntu.com/manpages/jammy/en/man1/ssh.1.html#environment) を見ると，いろいろ紹介されています．

- 本記事で紹介したサンプルコードでは，`$SSH_CLIENT` を使っていますが，こちらは deprecated らしい．`$SSH_CONNECTION` を使うのが良いかも
  https://github.com/openssh/openssh-portable/blob/0d96b1506b2f4757fefa5d1f884d49e96a6fd4c3/session.c#L1164-L1185

- ほかに使えそうな環境変数を探したいときは，ひとまず `printenv` で確認してみるとよい．
