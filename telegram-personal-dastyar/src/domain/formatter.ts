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
  const bodyHtml = body
    .split(/\n{2,}/u)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
    .join("");
  const avatar = settings.avatar_emoji_id ? `${customEmoji(settings.avatar_emoji_id, "🧑", "")} ` : "";
  const xIcon = customEmoji(settings.x_emoji_id, "⬛", "⬛ 𝕏");
  const instagramIcon = customEmoji(settings.instagram_emoji_id, "📸", "📸");
  const telegramIcon = customEmoji(settings.telegram_emoji_id, "🔵", "🔵");
  const signature = `<hr/><p><b>${avatar}<a href="${escapeHtml(settings.signature_url)}">${escapeHtml(settings.signature_text)}</a></b></p><table bordered compact><tr><td align="center"><a href="https://x.com/bahr4m">${xIcon} X / Twitter</a></td><td align="center"><a href="https://instagram.com/bahrameghorbani">${instagramIcon} Instagram</a></td></tr><tr><td align="center"><a href="https://t.me/bahrameghorbani">${telegramIcon} Telegram</a></td><td align="center"><a href="${escapeHtml(settings.sponsor_url)}">🤝 Sponsor · ${escapeHtml(settings.sponsor_text)}</a></td></tr><tr><td colspan="2" align="center"><a href="https://paykaar.com">🌐 paykaar.com</a></td></tr></table>`;
  return `${bodyHtml}${signature}`;
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
function customEmoji(value: string, alt: string, fallback: string) {
  if (/^\d+$/u.test(value)) return `<tg-emoji emoji-id="${escapeHtml(value)}">${alt}</tg-emoji>`;
  return value ? escapeHtml(value) : fallback;
}
export function telegramLimitError(value: string): string | undefined {
  const limit = 32768;
  return [...value.replace(/<[^>]+>/g, "")].length > limit ? `متن نهایی از سقف ${limit} کاراکتر Rich Message بیشتر است.` : undefined;
}
