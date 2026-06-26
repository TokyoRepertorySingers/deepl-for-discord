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

  // Discord-syntax pre/post processing (mentions, channels, custom emoji,
  // links) is added in T3; for now the text is sent through verbatim.
  async translate(text: string, targetLanguage: string): Promise<string | null> {
    try {
      const response = await this.axiosInstance({
        method: "POST",
        url: "/translate",
        data: {
          text: [text],
          target_lang: targetLanguage.toUpperCase(),
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `DeepL-Auth-Key ${this.authKey}`,
        },
      });
      const translations = response.data?.translations;
      if (translations && translations.length > 0) {
        return translations[0].text as string;
      }
      this.logger.error("unexpected DeepL response:", response.data);
      return null;
    } catch (error) {
      this.logger.error(`failed to translate (target: ${targetLanguage}):`, error);
      return null;
    }
  }
}
