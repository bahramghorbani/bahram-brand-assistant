import type { Media } from "../types";

export class TelegramClient {
  constructor(private readonly token: string, private readonly fetcher: typeof fetch = (...args) => fetch(...args)) {}
  async call<T>(method: string, body: Record<string, unknown>): Promise<T> {
    const response = await this.fetcher(`https://api.telegram.org/bot${this.token}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json() as { ok: boolean; result?: T; description?: string };
    if (!response.ok || !payload.ok) throw new Error(payload.description ?? `Telegram ${response.status}`);
    return payload.result as T;
  }
  sendMessage(chatId: string | number, text: string, replyMarkup?: unknown) { return this.call<{ message_id: number }>("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", link_preview_options: { is_disabled: true }, reply_markup: replyMarkup }); }
  sendRichMessage(chatId: string | number, html: string, media: Media[] = [], replyMarkup?: unknown) {
    const attachments = media.map((item, index) => ({ id: `media${index}`, media: { type: item.type, media: item.fileId } }));
    const mediaBlocks = media.map((item, index) => richMediaBlock(item, `media${index}`));
    const mediaHtml = mediaBlocks.length > 1 ? `<tg-collage>${mediaBlocks.join("")}</tg-collage>` : (mediaBlocks[0] ?? "");
    return this.call<{ message_id: number }>("sendRichMessage", {
      chat_id: chatId,
      rich_message: { html: `${mediaHtml}${html}`, ...(attachments.length ? { media: attachments } : {}) },
      reply_markup: replyMarkup
    });
  }
  sendMedia(chatId: string | number, media: Media, caption: string, replyMarkup?: unknown) {
    const method = media.type === "photo" ? "sendPhoto" : media.type === "video" ? "sendVideo" : media.type === "audio" ? "sendAudio" : "sendDocument";
    const field = media.type === "photo" ? "photo" : media.type === "video" ? "video" : media.type === "audio" ? "audio" : "document";
    return this.call<{ message_id: number }>(method, { chat_id: chatId, [field]: media.fileId, caption, parse_mode: "HTML", reply_markup: replyMarkup });
  }
  sendAlbum(chatId: string | number, media: Media[], caption: string) {
    return this.call<Array<{ message_id: number }>>("sendMediaGroup", { chat_id: chatId, media: media.map((item, index) => ({ type: item.type, media: item.fileId, ...(index === 0 ? { caption, parse_mode: "HTML" } : {}) })) });
  }
  answerCallbackQuery(id: string, text?: string, showAlert = false) { return this.call<boolean>("answerCallbackQuery", { callback_query_id: id, text, show_alert: showAlert }); }
  setWebhook(url: string, secretToken: string) { return this.call<boolean>("setWebhook", { url, secret_token: secretToken, allowed_updates: ["message", "callback_query"], drop_pending_updates: false }); }
  getMe() { return this.call<{ username?: string }>("getMe", {}); }
  getChat(chatId: string) { return this.call<{ id: number; type: string }>("getChat", { chat_id: chatId }); }
}

function richMediaBlock(media: Media, id: string): string {
  if (media.type === "photo") return `<img src="tg://photo?id=${id}"/>`;
  if (media.type === "video") return `<video src="tg://video?id=${id}"></video>`;
  if (media.type === "audio") return `<audio src="tg://audio?id=${id}"></audio>`;
  return `<tg-document src="tg://document?id=${id}"></tg-document>`;
}
