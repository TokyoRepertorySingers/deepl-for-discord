import { reactionToLang } from "./languages";

// Unicode flag emoji are two regional indicator symbols (U+1F1E6..U+1F1FF),
// one per letter of the country's ISO 3166-1 alpha-2 code.
const REGIONAL_INDICATOR_A = 0x1f1e6;
const REGIONAL_INDICATOR_Z = 0x1f1ff;
const LETTER_A = "a".charCodeAt(0);

// Decode a flag emoji (e.g. "🇯🇵") to its country code (e.g. "jp"),
// or null if the string is not a country flag.
export function flagEmojiToCountry(emoji: string): string | null {
  const codePoints = Array.from(emoji, (c) => c.codePointAt(0) ?? 0);
  if (codePoints.length !== 2) return null;
  let country = "";
  for (const cp of codePoints) {
    if (cp < REGIONAL_INDICATOR_A || cp > REGIONAL_INDICATOR_Z) return null;
    country += String.fromCharCode(cp - REGIONAL_INDICATOR_A + LETTER_A);
  }
  return country;
}

// Map a reaction emoji to a DeepL target language, or null when the emoji is
// not a flag we translate for.
export function reactionToLanguage(emoji: string): string | null {
  const country = flagEmojiToCountry(emoji);
  if (country === null) return null;
  return reactionToLang[country] ?? null;
}