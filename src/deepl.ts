import axios, { AxiosInstance } from "axios";
import { Logger } from "./logger";

export class DeepLApi {
  private authKey: string;
  private logger: Logger;
  private axiosInstance: AxiosInstance;

  constructor(authKey: string, logger: Logger) {
    this.authKey = authKey;
    this.logger = logger;
    const usingFreePlan = process.env.DEEPL_FREE_API_PLAN === "1";
    const apiSubdomain = usingFreePlan ? "api-free" : "api";
    this.axiosInstance = axios.create({
      baseURL: `https://${apiSubdomain}.deepl.com/v2`,
      timeout: 30000,
    });
  }

  async translate(text: string, targetLanguage: string): Promise<string | null> {
    const { encoded, tokens } = this.protectDiscordSyntax(text);
    try {
      const response = await this.axiosInstance({
        method: "POST",
        url: "/translate",
        data: {
          text: [encoded],
          target_lang: targetLanguage.toUpperCase(),
          tag_handling: "xml",
          outline_detection: false,
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `DeepL-Auth-Key ${this.authKey}`,
        },
      });
      const translations = response.data?.translations;
      if (translations && translations.length > 0) {
        return this.restoreDiscordSyntax(translations[0].text as string, tokens);
      }
      this.logger.error("unexpected DeepL response:", response.data);
      return null;
    } catch (error) {
      this.logger.error(`failed to translate (target: ${targetLanguage}):`, error);
      return null;
    }
  }

  // Discord entities that must survive translation untouched: custom emoji,
  // user/role/channel mentions, and bare URLs.
  private static readonly ENTITY_PATTERN =
    /<a?:\w+:\d+>|<@[!&]?\d+>|<#\d+>|https?:\/\/\S+/g;
  // Markdown links: the label is translatable, only the URL is preserved.
  private static readonly LINK_PATTERN = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  // Private-use sentinels isolate a stashed index from surrounding text until it
  // becomes a placeholder tag, so digits in the user's text are never mistaken
  // for an index.
  private static readonly SENTINEL_OPEN = String.fromCharCode(0xe000);
  private static readonly SENTINEL_CLOSE = String.fromCharCode(0xe001);

  // Replace non-translatable tokens with numbered XML placeholders so DeepL's
  // xml tag handling keeps them in place, and escape stray XML characters in the
  // remaining text so the payload stays well-formed.
  private protectDiscordSyntax(text: string): {
    encoded: string;
    tokens: string[];
  } {
    const tokens: string[] = [];
    const stash = (raw: string): string => {
      tokens.push(raw);
      return `${DeepLApi.SENTINEL_OPEN}${tokens.length - 1}${DeepLApi.SENTINEL_CLOSE}`;
    };

    let out = text.replace(
      DeepLApi.LINK_PATTERN,
      (_m, label: string, url: string) => `[${label}](${stash(url)})`
    );
    out = out.replace(DeepLApi.ENTITY_PATTERN, stash);
    out = out.replace(/[&<>]/g, (c) =>
      c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;"
    );
    const sentinel = new RegExp(
      `${DeepLApi.SENTINEL_OPEN}(\\d+)${DeepLApi.SENTINEL_CLOSE}`,
      "g"
    );
    out = out.replace(sentinel, (_m, i: string) => `<x${i}/>`);
    return { encoded: out, tokens };
  }

  private restoreDiscordSyntax(text: string, tokens: string[]): string {
    const out = text.replace(
      /<x(\d+)\s*\/>|<x(\d+)\s*><\/x\d*>/g,
      (_m, a?: string, b?: string) => tokens[Number(a ?? b)] ?? ""
    );
    return out
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&");
  }
}
