# deepl-for-discord

A DeepL translation bot for Discord. Translate any message either by reacting
with a country-flag emoji or by using the **翻訳** message command.

A Discord port of [seratch/deepl-for-slack](https://github.com/seratch/deepl-for-slack),
reproducing the same workflow on Discord. Built for Tokyo Repertory Singers.

## Features

- **Flag-reaction translation** — react to a message with a country-flag emoji
  (🇬🇧 🇯🇵 🇫🇷 …) and the bot replies in the channel with the translation.
- **Manual translation** — right-click a message → Apps → **翻訳**, then pick a
  target language. The result is shown only to you (ephemeral).
- Discord markup (mentions, channels, custom emoji, links) is preserved across
  translation.

## Requirements

- Node.js 20 or newer
- A [DeepL API](https://www.deepl.com/pro-api) key (Free or Pro plan)
- A Discord application / bot

## Discord application setup

1. Open the [Discord Developer Portal](https://discord.com/developers/applications)
   and create an application.
2. **Bot** tab → add a bot, copy the **token** (`DISCORD_BOT_TOKEN`).
   Under *Privileged Gateway Intents*, enable **Message Content Intent**.
3. **General Information** tab → copy the **Application ID** (`DISCORD_CLIENT_ID`).
4. Invite the bot to your server with the `bot` and `applications.commands`
   scopes and these permissions: **View Channels**, **Send Messages**,
   **Read Message History**, **Add Reactions**. You can generate the invite URL
   from **OAuth2 → URL Generator**.

To make the **翻訳** command appear instantly while developing, set
`DISCORD_GUILD_ID` to your server id (guild commands update immediately; global
commands take up to ~1 hour to propagate).

## Configuration

Copy `.env.sample` to `.env` and fill it in:

| Variable | Required | Description |
| --- | --- | --- |
| `DISCORD_BOT_TOKEN` | yes | Bot token from the Developer Portal. |
| `DISCORD_CLIENT_ID` | yes | Application (client) ID. |
| `DISCORD_GUILD_ID` | no | Register the command to one guild for instant updates; leave empty for global. |
| `DEEPL_AUTH_KEY` | yes | DeepL API key. |
| `DEEPL_FREE_API_PLAN` | yes | Set to `1` on the DeepL **Free** plan (different endpoint; otherwise 401). |
| `DEEPL_RUNNER_LANGUAGES` | no | Comma-separated target languages offered by the 翻訳 picker (max 25). Default: `en,ja,zh,de,fr,it,es,nl,pl,pt,ru`. |
| `PORT` | no | Port for the HTTP health server. Defaults to `3000`; Render sets this automatically. |
| `LOG_LEVEL` | no | `debug` \| `info` \| `warn` \| `error`. Default `info`. |

## Local development

```bash
cp .env.sample .env   # fill in tokens and keys
npm install
npm run dev           # ts-node + watch
```

For a production-style run:

```bash
npm run build         # compile TypeScript to lib/
npm run start         # node lib/index.js
```

## Deployment (Render free tier)

The bot only holds a Discord Gateway WebSocket, but Render's free tier offers a
**Web Service** (Background Workers are paid). So it also exposes a dummy HTTP
health endpoint on `PORT`, which doubles as the keep-alive target.

A [`render.yaml`](./render.yaml) Blueprint is included:

1. Push this repo to GitHub.
2. In Render, **New → Blueprint** and point it at the repo (or create a Web
   Service manually with build `npm install && npm run build` and start
   `npm run start`).
3. Set the secret env vars (`DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`,
   `DEEPL_AUTH_KEY`, and `DISCORD_GUILD_ID` if used). The rest have defaults in
   the Blueprint. Render injects `PORT` automatically.
4. Deploy.

### Keep-alive

Render's free instance spins down after ~15 minutes of inactivity. To keep the
bot online, ping its public URL on a schedule — e.g. a Google Apps Script
(GAS) `UrlFetchApp` trigger hitting the health endpoint every few minutes.
The free plan allows 750 instance-hours/month, enough for one always-on service.

## License

MIT
