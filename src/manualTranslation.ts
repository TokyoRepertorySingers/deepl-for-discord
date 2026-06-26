import {
  ActionRowBuilder,
  ApplicationCommandType,
  Client,
  ContextMenuCommandBuilder,
  Events,
  Interaction,
  MessageContextMenuCommandInteraction,
  MessageFlags,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { DeepLApi } from "./deepl";
import { Logger } from "./logger";
import { langToName } from "./languages";

const COMMAND_NAME = "Translate";
// Select customId carries the source message so the chosen language can be
// applied without stashing the text server-side (survives Render spin-down).
const SELECT_PREFIX = "manual-translate";
const DEFAULT_LANGUAGES = "en,ja,zh,de,fr,it,es,nl,pl,pt,ru";
// Discord allows at most 25 options in a single select menu.
const MAX_SELECT_OPTIONS = 25;

// Register the manual translation flow: a message context-menu command opens an
// ephemeral language picker, and picking a language translates that message and
// shows the result only to the requester.
export function registerManualTranslation(
  client: Client,
  deepL: DeepLApi,
  logger: Logger
): void {
  client.once(Events.ClientReady, async () => {
    try {
      const command = new ContextMenuCommandBuilder()
        .setName(COMMAND_NAME)
        .setType(ApplicationCommandType.Message)
        .toJSON();
      const guildId = process.env.DISCORD_GUILD_ID;
      // Guild-scoped commands update instantly; global commands take ~1h to
      // propagate but need no guild id, so we prefer a guild when configured.
      if (guildId) {
        await client.application?.commands.set([command], guildId);
        logger.info(`registered "${COMMAND_NAME}" command to guild ${guildId}`);
      } else {
        await client.application?.commands.set([command]);
        logger.info(`registered "${COMMAND_NAME}" command globally`);
      }
    } catch (e) {
      logger.error("failed to register manual translation command:", e);
    }
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    try {
      if (
        interaction.isMessageContextMenuCommand() &&
        interaction.commandName === COMMAND_NAME
      ) {
        await handleCommand(interaction);
        return;
      }
      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith(`${SELECT_PREFIX}:`)
      ) {
        await handleLanguageSelect(interaction, deepL);
      }
    } catch (e) {
      logger.error("manual translation failed:", e);
    }
  });
}

async function handleCommand(
  interaction: MessageContextMenuCommandInteraction
): Promise<void> {
  const text = interaction.targetMessage.content?.trim();
  if (!text) {
    await interaction.reply({
      content: "No translatable text in this message.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(
      `${SELECT_PREFIX}:${interaction.channelId}:${interaction.targetMessage.id}`
    )
    .setPlaceholder("Select a target language")
    .addOptions(languageOptions());
  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);

  await interaction.reply({
    content: "Choose a target language.",
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleLanguageSelect(
  interaction: StringSelectMenuInteraction,
  deepL: DeepLApi
): Promise<void> {
  await interaction.deferUpdate();

  const [, channelId, messageId] = interaction.customId.split(":");
  const targetLanguage = interaction.values[0];

  const channel = await interaction.client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    await interaction.editReply({
      content: "Could not find the original message.",
      components: [],
    });
    return;
  }

  const message = await channel.messages.fetch(messageId);
  const text = message.content?.trim();
  if (!text) {
    await interaction.editReply({
      content: "No translatable text in this message.",
      components: [],
    });
    return;
  }

  const translated = await deepL.translate(text, targetLanguage);
  await interaction.editReply({
    content: translated ?? "Translation failed.",
    components: [],
  });
}

function languageOptions(): { label: string; value: string }[] {
  const configured = process.env.DEEPL_RUNNER_LANGUAGES || DEFAULT_LANGUAGES;
  return configured
    .split(",")
    .map((code) => code.trim().toLowerCase())
    .filter((code) => code.length > 0)
    .slice(0, MAX_SELECT_OPTIONS)
    .map((code) => ({ label: langToName[code] ?? code, value: code }));
}
