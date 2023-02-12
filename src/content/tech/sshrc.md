---
layout: ../../layouts/BlogLayout.astro
title: SSHログインをSlackやDiscordに通知する方法
pubDate: 2023-02-06
description: SSHログインをSlackやDiscordに通知する方法
---

## 背景
色んなクラウドサービスを使い始めると，インスタンスが増え管理が厄介になる．

そこで，SSHで誰かが入ったときにSlackやDiscordに通知する方法を忘備録としてここに残しておく．

メールを送信して通知するのでもよいが，最近はメールよりもSlackやDiscordのほうがよく使うのでこっちに通知を送りたい．

## 実現方法
`/etc/ssh/sshrc`はSSHログインをトリガーにして実行されるスクリプトである．
ここにログインを通知するようなシェルスクリプトを書けば通知してくれる．

また，`sshrc`はシェルスクリプトなので任意のコマンドを実行し投げるメッセージ内容をカスタマイズできる．

### Slackの場合
インスタンス名とWebhookのURLを設定し，`sshrc`に以下の内容を設定すると，インスタンス名，ログイン日時，クライアントIP，クライアントポートが任意のSlackのチャンネルに投稿される．

送信する内容のカスタマイズに関しては[Slackのドキュメント](https://api.slack.com/messaging/webhooks)を見るとよい．

```sh
echo '{"username": "INSTANCE NAME", "text": "`'`date "+%Y-%m-%d %H:%M:%S"` '[login]:' $SSH_CLIENT'`"}' | curl -H "Content-Type: application/json" -X POST -d @- SLACK_WEBHOOK_URL
```
<img src="/img/tech/sshrc_slack.webp" />

### Discordの場合
インスタンス名とWebhookのURLを設定し，`sshrc`に以下の内容を設定すると，インスタンス名，ログイン日時，クライアントIP，クライアントポートが任意のDiscordのチャンネルに投稿される．

もちろんアイコンなども設定できる．詳しくは[Discordのドキュメント](https://discord.com/developers/docs/resources/webhook)を見るとよい．

```sh
echo '{"username": "INSTANCE_NAME", "content": "`'`date "+%Y-%m-%d %H:%M:%S"` '[login]:' $SSH_CLIENT'`"}' | curl -H "Content-Type: application/json" -X POST -d @- DISCORD_WEBHOOK_URL
```

<img src="/img/tech/sshrc_discord.webp" />
