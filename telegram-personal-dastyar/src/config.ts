import type { Env } from "./types";

export interface Config {
  authorizedUserIds: Set<string>; destinationChatId: string; destinationUsername?: string;
  bootstrapCode?: string; defaults: Record<SettingKey, string>;
}
export type SettingKey = "signature_text" | "signature_url" | "sponsor_text" | "sponsor_url" | "emojis";

const normalize = (value: string) => value.replace(/\r\n?/g, "\n").trim();
const validUrl = (value: string) => /^https:\/\/(?:t\.me\/|telegram\.me\/|[a-z0-9.-]+\/)/iu.test(value);

export function configFromEnv(env: Env): Config {
  for (const key of ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "AUTHORIZED_USER_IDS", "DESTINATION_CHAT_ID"] as const) if (!env[key]?.trim()) throw new Error(`Missing ${key}`);
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(env.TELEGRAM_WEBHOOK_SECRET)) throw new Error("Invalid TELEGRAM_WEBHOOK_SECRET");
  const ids = env.AUTHORIZED_USER_IDS.split(",").map((value) => value.trim()).filter(Boolean);
  const bootstrapCode = env.BOOTSTRAP_CODE?.trim();
  const bootstrapMode = ids.length === 1 && ids[0] === "bootstrap";
  if ((!ids.length || ids.some((id) => !/^\d+$/u.test(id))) && !bootstrapMode) throw new Error("AUTHORIZED_USER_IDS must contain numeric IDs or bootstrap");
  if (bootstrapMode && !/^[A-Za-z0-9_-]{24,128}$/.test(bootstrapCode ?? "")) throw new Error("BOOTSTRAP_CODE must be a secure URL-safe value");
  const defaults: Record<SettingKey, string> = {
    signature_text: normalize(env.DEFAULT_SIGNATURE_TEXT ?? "آخرین اخبار فناوری | هوش مصنوعی | کسب و کار"),
    signature_url: normalize(env.DEFAULT_SIGNATURE_URL ?? "https://t.me/bahrameghorbani"),
    sponsor_text: normalize(env.DEFAULT_SPONSOR_TEXT ?? "رسانه فینتک ایران | پی کار"),
    sponsor_url: normalize(env.DEFAULT_SPONSOR_URL ?? "https://t.me/paykaarcom"),
    emojis: normalize(env.DEFAULT_EMOJIS ?? "🔥,🚀,⚡️,💻,🧠")
  };
  if (!validUrl(defaults.signature_url) || !validUrl(defaults.sponsor_url)) throw new Error("Default signature and sponsor URLs must be HTTPS");
  return { authorizedUserIds: new Set(bootstrapMode ? [] : ids), destinationChatId: env.DESTINATION_CHAT_ID, destinationUsername: env.DESTINATION_CHANNEL_USERNAME?.replace(/^@/u, ""), bootstrapCode, defaults };
}

export function validateSetting(key: SettingKey, value: string): string | undefined {
  if (!value.trim() || value.length > 200) return "مقدار باید بین ۱ تا ۲۰۰ کاراکتر باشد.";
  if ((key === "signature_url" || key === "sponsor_url") && !validUrl(value.trim())) return "آدرس باید HTTPS باشد؛ مانند https://t.me/paykaarcom";
  if (key === "emojis" && value.split(",").filter(Boolean).length > 12) return "حداکثر ۱۲ ایموجی، با کاما از هم جدا شوند.";
  return undefined;
}
