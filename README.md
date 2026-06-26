# deepl-for-discord

A DeepL translation bot for Discord. Translates messages via flag-emoji reactions and commands.

> **Status:** in development. Migrating from the Slack version.

## Overview

A Discord port of [seratch/deepl-for-slack](https://github.com/seratch/deepl-for-slack), reproducing the same workflow on Discord. Built for Tokyo Repertory Singers.

- discord.js v14 / TypeScript
- DeepL API (set `DEEPL_FREE_API_PLAN=1` when using the Free plan)
- Deployable on Render's free Web Service (ships an HTTP health endpoint)

## Setup

```bash
cp .env.sample .env   # fill in tokens and keys
npm install
npm run dev           # local run (ts-node + watch)
```

Detailed setup, Discord app configuration, and deployment steps will follow at release.