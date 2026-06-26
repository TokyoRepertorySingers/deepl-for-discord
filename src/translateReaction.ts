import {
  Client,
  Events,
  MessageReaction,
  PartialMessageReaction,
  User,
  PartialUser,
} from "discord.js";
import { DeepLApi } from "./deepl";
import { Logger } from "./logger";
import { reactionToLanguage } from "./reactions";

// Register the flag-reaction translation flow:
// flag emoji → country → DeepL target language → translate → reply.
export function registerReactionTranslation(
  client: Client,
  deepL: DeepLApi,
  logger: Logger
): void {
  client.on(
    Events.MessageReactionAdd,
    async (
      reaction: MessageReaction | PartialMessageReaction,
      user: User | PartialUser
    ) => {
      try {
        if (user.bot) return;

        // Partials arrive for reactions on uncached (e.g. older) messages.
        const fullReaction = reaction.partial ? await reaction.fetch() : reaction;

        const language = reactionToLanguage(fullReaction.emoji.name ?? "");
        if (!language) return;

        // A count above one means someone already reacted with this flag, so a
        // translation for this language was already posted.
        if ((fullReaction.count ?? 0) > 1) return;

        const message = fullReaction.message.partial
          ? await fullReaction.message.fetch()
          : fullReaction.message;

        const text = message.content?.trim();
        if (!text) return;

        const translated = await deepL.translate(text, language);
        if (!translated) {
          await message.react("❌").catch(() => {});
          return;
        }

        await message.reply({
          content: translated,
          allowedMentions: { repliedUser: false },
        });
      } catch (e) {
        logger.error("reaction translation failed:", e);
      }
    }
  );
}
