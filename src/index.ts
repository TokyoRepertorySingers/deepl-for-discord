import { loadEnv } from "./dotenv";
loadEnv();

import { Client, GatewayIntentBits, Partials, Events } from "discord.js";
import { createLogger } from "./logger";
import { startHealthServer } from "./health";

const logger = createLogger();

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  logger.error("DISCORD_BOT_TOKEN is not set. Copy .env.sample to .env and fill it in.");
  process.exit(1);
}

// MessageContent is privileged; Partials let reaction events fire on
// uncached (e.g. older) messages.
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.Channel],
});

client.once(Events.ClientReady, (c) => {
  logger.info(`logged in as ${c.user.tag} (id: ${c.user.id})`);
});

client.on(Events.Error, (e) => {
  logger.error("client error:", e);
});

client.on(Events.Warn, (w) => {
  logger.warn("client warning:", w);
});

// Feature handlers (reaction translation, manual UI) are registered in later tasks.

// Health HTTP server for Render free tier + GAS keep-alive.
startHealthServer(logger);

client.login(token).catch((e) => {
  logger.error("failed to log in to Discord:", e);
  process.exit(1);
});

const shutdown = (signal: string) => {
  logger.info(`received ${signal}, shutting down...`);
  client.destroy();
  process.exit(0);
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
