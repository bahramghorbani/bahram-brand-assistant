import type { SettingKey } from "../config";
import type { TelegramMessage } from "../types";

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
const normalize = (value: string) => value.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim()).join("\n").trim();

export function decorate(input: string, settings: Record<SettingKey, string>, source?: TelegramMessage["forward_origin"]): string {
  let body = normalize(input);
  const username = source?.chat?.username?.replace(/^@/u, "");
  if (username) {
    const sourceRef = new RegExp(`(?:@${escapeRegExp(username)}\\b|https?:\\/\\/(?:t\\.me|telegram\\.me)\\/${escapeRegExp(username)}(?:\\/\\S*)?)`, "giu");
    body = body.replace(sourceRef, "");
  }
  body = removeTrailingSourceFooter(body);
  body = addParagraphEmojis(body, settings.emojis);
  const avatar = settings.avatar_emoji_id ? `<tg-emoji emoji-id="${escapeHtml(settings.avatar_emoji_id)}">🧑</tg-emoji> ` : "";
  const signature = `<blockquote><b>${avatar}Join the Bahram Community</b>\n\n╭────────────────────╮\n│ <a href="https://x.com/bahr4m">𝕏 @bahr4m</a>\n│ <a href="https://t.me/bahrameghorbani">✈️ @bahrameghorbani</a>\n│ <a href="https://instagram.com/bahrameghorbani">◎ @bahrameghorbani</a>\n├────────────────────┤\n│ 🤝 <b>Sponsor</b>\n│ ${escapeHtml(settings.sponsor_text)}\n│ <a href="${escapeHtml(settings.sponsor_url)}">${escapeHtml(linkLabel(settings.sponsor_url))}</a>\n│ <a href="https://paykaar.com">🌐 paykaar.com</a>\n╰────────────────────╯</blockquote>`;
  return `${escapeHtml(body).replace(/\n/g, "\n")}\n\n${signature}`;
}

function addParagraphEmojis(body: string, emojiText: string): string {
  const emojis = emojiText.split(",").map((item) => item.trim()).filter(Boolean);
  if (!emojis.length) return body;
  return body.split(/\n{2,}/u).map((paragraph, index) => {
    const trimmed = paragraph.trim();
    if (!trimmed || /^(?:🔥|🚀|⚡️|💻|🧠|-|•|▪︎)\s/u.test(trimmed)) return trimmed;
    return `${emojis[index % emojis.length]} ${trimmed}`;
  }).join("\n\n");
}

function removeTrailingSourceFooter(body: string): string {
  const lines = body.split("\n");
  while (lines.length && !lines.at(-1)?.trim()) lines.pop();
  while (lines.length) {
    const line = lines.at(-1)?.trim() ?? "";
    if (/^(?:@\w{3,}|https?:\/\/(?:t\.me|telegram\.me)\/\S+|(?:عضویت|دنبال|کانال|follow|join).{0,90})$/iu.test(line) || /^[—–_-]{3,}$/u.test(line)) lines.pop();
    else break;
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
function escapeRegExp(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function linkLabel(url: string) { const match = url.match(/^https:\/\/(?:t\.me|telegram\.me)\/([A-Za-z0-9_]{3,})\/?$/u); return match ? `@${match[1]}` : url; }

export function telegramLimitError(value: string, type: "text" | "caption"): string | undefined {
  const limit = type === "text" ? 4096 : 1024;
  return [...value.replace(/<[^>]+>/g, "")].length > limit ? `متن نهایی از سقف ${limit} کاراکتر بیشتر است.` : undefined;
}
