import { type Config, isCustomEmojiSetting, type SettingKey, validateSetting } from "../config";
import { decorate, telegramLimitError } from "../domain/formatter";
import { Store } from "../storage/store";
import { TelegramClient } from "../telegram/client";
import type { ContentType, Draft, Media, TelegramMessage, TelegramUpdate } from "../types";

const isAuthorized = async (store: Store, config: Config, id: number | undefined) => id !== undefined && (config.authorizedUserIds.has(String(id)) || await store.isBootstrapOwner(String(id)));
const content = (message: TelegramMessage) => message.text ?? message.caption ?? "";
const buttons = (id: string) => ({ inline_keyboard: [[{ text: "✅ تأیید و انتشار", callback_data: `publish:${id}` }], [{ text: "✏️ ویرایش متن", callback_data: `edit:${id}` }, { text: "❌ لغو", callback_data: `cancel:${id}` }]] });
const settingsButtons = { inline_keyboard: [[{ text: "✍️ متن امضا", callback_data: "setting:signature_text" }, { text: "🔗 لینک امضا", callback_data: "setting:signature_url" }], [{ text: "🤝 متن اسپانسر", callback_data: "setting:sponsor_text" }, { text: "🔗 لینک اسپانسر", callback_data: "setting:sponsor_url" }], [{ text: "🔥 ایموجی‌ها", callback_data: "setting:emojis" }], [{ text: "🧑 آواتار کارت", callback_data: "setting:avatar_emoji_id" }], [{ text: "⬛ آیکون X", callback_data: "setting:x_emoji_id" }, { text: "📸 آیکون Instagram", callback_data: "setting:instagram_emoji_id" }], [{ text: "🔵 آیکون Telegram", callback_data: "setting:telegram_emoji_id" }]] };

export async function handleUpdate(update: TelegramUpdate, store: Store, telegram: TelegramClient, config: Config): Promise<unknown> {
  if (!(await store.acceptUpdate(update.update_id))) return;
  if (update.callback_query) return handleCallback(update.callback_query, store, telegram, config);
  const message = update.message; if (!message) return;
  if (!(await isAuthorized(store, config, message.from?.id))) {
    if (message.from && message.chat.type === "private" && await tryBootstrap(message, store, config)) return telegram.sendMessage(message.chat.id, "مالک ربات با موفقیت ثبت شد. حالا می‌توانید پست بفرستید یا /settings را باز کنید.");
    if (message.from) await telegram.sendMessage(message.chat.id, "این ربات خصوصی است و دسترسی شما تأیید نشده است."); return;
  }
  if (message.chat.type !== "private") { await telegram.sendMessage(message.chat.id, "برای حفظ امنیت، پیام را فقط در گفت‌وگوی خصوصی با ربات بفرستید."); return; }
  const command = message.text?.trim().split(/\s+/u)[0]?.toLowerCase();
  if (command?.startsWith("/")) return handleCommand(command, message, store, telegram, config);
  const settings = await store.settings(config.defaults);
  const waitingSetting = await settingPrompt(store, String(message.from!.id));
  if (waitingSetting) return saveSetting(waitingSetting, message, store, telegram);
  const editing = await store.editing(String(message.from!.id));
  if (editing) {
    if (mediaOf(message)) return telegram.sendMessage(message.chat.id, "برای ویرایش، فقط متن ساده بفرستید یا /cancel را بزنید.");
    const formatted = decorate(content(message), settings); const issue = telegramLimitError(formatted);
    if (issue) return telegram.sendMessage(message.chat.id, issue);
    await store.updateContent(editing.id, formatted); const draft = await store.get(editing.id); if (draft) await preview(draft, store, telegram, message.chat.id); return;
  }
  const media = mediaOf(message);
  if (!media && !message.text) return telegram.sendMessage(message.chat.id, "متن، عکس، ویدئو، فایل صوتی یا یک پست فورواردی بفرستید.");
  const formatted = decorate(content(message), settings, message.forward_origin);
  const type: ContentType = media ? media.type : "text";
  const issue = telegramLimitError(formatted);
  if (issue) return telegram.sendMessage(message.chat.id, issue);
  const ownerId = String(message.from!.id); const expiresAt = new Date(Date.now() + 24 * 3600_000).toISOString();
  if (message.media_group_id && media) {
    const group = await store.collectingGroup(ownerId, message.media_group_id);
    if (group) { await store.appendGroupMedia(group.id, media, content(message), formatted); return telegram.sendMessage(message.chat.id, "یک فایل دیگر به آلبوم افزوده شد. پس از اتمام ارسال، /review را بزنید."); }
    const id = idOf(); await store.create({ id, ownerId, type: "album", original: content(message), cleaned: formatted, media: [media], groupId: message.media_group_id, status: "COLLECTING", expiresAt });
    return telegram.sendMessage(message.chat.id, "آلبوم دریافت شد. تلگرام پایان آلبوم را به ربات اعلام نمی‌کند؛ پس از رسیدن همهٔ فایل‌ها، /review را بزنید.");
  }
  const id = idOf(); await store.create({ id, ownerId, type, original: content(message), cleaned: formatted, media: media ? [media] : undefined, status: "READY_FOR_REVIEW", expiresAt });
  const draft = await store.get(id); if (draft) await preview(draft, store, telegram, message.chat.id);
}

async function handleCommand(command: string, message: TelegramMessage, store: Store, telegram: TelegramClient, config: Config): Promise<unknown> {
  const ownerId = String(message.from!.id);
  if (command === "/start" || command === "/help") return telegram.sendMessage(message.chat.id, "متن یا پست فورواردی (عکس، ویدئو، صوت، فایل و آلبوم) را بفرستید. ربات ارجاعات کانالِ مبدأ را پاک می‌کند، ابتدای هر پاراگراف ایموجی می‌گذارد و کارت امضای شما را اضافه می‌کند. انتشار فقط با تأیید شماست.\n\n/settings برای تنظیم امضا، اسپانسر، ایموجی‌ها و آواتار کارت\n/review برای آماده‌کردن آلبوم\n/status برای بررسی اتصال");
  if (command === "/settings") return telegram.sendMessage(message.chat.id, "تنظیمی را که می‌خواهید تغییر کند انتخاب کنید:", settingsButtons);
  if (command === "/review") { const draft = await store.activeGroup(ownerId); if (!draft) return telegram.sendMessage(message.chat.id, "آلبوم فعالی برای بررسی وجود ندارد."); if (!(await store.setStatus(draft.id, ownerId, "COLLECTING", "READY_FOR_REVIEW"))) return; const ready = await store.get(draft.id); if (ready) return preview(ready, store, telegram, message.chat.id); }
  if (command === "/cancel") { const draft = await store.editing(ownerId) ?? await store.activeGroup(ownerId); if (!draft || !(await store.setStatus(draft.id, ownerId, draft.status, "CANCELLED"))) return telegram.sendMessage(message.chat.id, "پیش‌نویس فعالی ندارید."); return telegram.sendMessage(message.chat.id, "لغو شد؛ چیزی منتشر نشد."); }
  if (command === "/status") { try { await telegram.getMe(); await telegram.getChat(config.destinationChatId); return telegram.sendMessage(message.chat.id, "وضعیت: توکن و دسترسی به کانال برقرار است. این بررسی هیچ پستی منتشر نکرد."); } catch { return telegram.sendMessage(message.chat.id, "بررسی کامل نشد. توکن و دسترسی ادمینِ ربات در کانال را بررسی کنید."); } }
  return telegram.sendMessage(message.chat.id, "دستور شناخته نشد. /help را بزنید.");
}

async function handleCallback(callback: NonNullable<TelegramUpdate["callback_query"]>, store: Store, telegram: TelegramClient, config: Config): Promise<unknown> {
  if (!(await isAuthorized(store, config, callback.from.id))) return telegram.answerCallbackQuery(callback.id, "دسترسی ندارید.");
  const [action, value] = callback.data?.split(":") ?? [];
  if (action === "setting" && isSettingKey(value)) { await store.setPrompt(String(callback.from.id), value); await telegram.answerCallbackQuery(callback.id); return telegram.sendMessage(callback.message?.chat.id ?? callback.from.id, promptFor(value)); }
  if (!value || !["publish", "edit", "cancel"].includes(action ?? "")) return telegram.answerCallbackQuery(callback.id, "دکمه نامعتبر است.");
  const draft = await store.get(value); if (!draft || draft.owner_id !== String(callback.from.id)) return telegram.answerCallbackQuery(callback.id, "این پیش‌نویس معتبر نیست.");
  if (action === "edit") { if (!(await store.setStatus(draft.id, draft.owner_id, "READY_FOR_REVIEW", "WAITING_FOR_EDIT"))) return telegram.answerCallbackQuery(callback.id, "این پیش‌نویس دیگر قابل‌ویرایش نیست."); await telegram.answerCallbackQuery(callback.id); return telegram.sendMessage(callback.message?.chat.id ?? callback.from.id, "متن سادهٔ بعدی جایگزین متن/کپشن می‌شود."); }
  if (action === "cancel") { const done = await store.setStatus(draft.id, draft.owner_id, "READY_FOR_REVIEW", "CANCELLED"); return telegram.answerCallbackQuery(callback.id, done ? "لغو شد." : "این پیش‌نویس دیگر فعال نیست."); }
  if (!(await store.setStatus(draft.id, draft.owner_id, "READY_FOR_REVIEW", "PUBLISHING"))) return telegram.answerCallbackQuery(callback.id, "این پیش‌نویس قبلاً پردازش شده است.");
  try {
    const media = store.media(draft); const sent = await telegram.sendRichMessage(config.destinationChatId, draft.cleaned_content, media);
    await store.complete(draft.id, sent.message_id); await telegram.answerCallbackQuery(callback.id, "منتشر شد."); const link = config.destinationUsername ? `\nhttps://t.me/${config.destinationUsername}/${sent.message_id}` : ""; return telegram.sendMessage(callback.message?.chat.id ?? callback.from.id, `پست یک‌بار منتشر شد.${link}`);
  } catch { await store.fail(draft.id, "Telegram publication failed"); return telegram.answerCallbackQuery(callback.id, "انتشار ناموفق بود؛ پیش‌نویس حفظ شد."); }
}

async function preview(draft: Draft, store: Store, telegram: TelegramClient, chatId: number) {
  const intro = "پیش‌نمایش خصوصی است و هنوز منتشر نشده است."; const media = store.media(draft);
  await telegram.sendMessage(chatId, intro);
  return telegram.sendRichMessage(chatId, draft.cleaned_content, media, buttons(draft.id));
}
function mediaOf(message: TelegramMessage): Media | undefined { if (message.photo?.at(-1)) return { type: "photo", fileId: message.photo.at(-1)!.file_id }; if (message.video) return { type: "video", fileId: message.video.file_id }; if (message.audio) return { type: "audio", fileId: message.audio.file_id }; if (message.document) return { type: "document", fileId: message.document.file_id }; }
function idOf() { return crypto.randomUUID().replaceAll("-", "").slice(0, 12); }
async function tryBootstrap(message: TelegramMessage, store: Store, config: Config): Promise<boolean> {
  const code = message.text?.trim().match(/^\/start\s+([A-Za-z0-9_-]{24,128})$/u)?.[1];
  return Boolean(code && config.bootstrapCode && code === config.bootstrapCode && await store.claimBootstrapOwner(String(message.from!.id)));
}
function isSettingKey(value: string | undefined): value is SettingKey { return value === "signature_text" || value === "signature_url" || value === "sponsor_text" || value === "sponsor_url" || value === "emojis" || value === "avatar_emoji_id" || value === "x_emoji_id" || value === "instagram_emoji_id" || value === "telegram_emoji_id"; }
function promptFor(key: SettingKey) { return ({ signature_text: "متن امضا را بفرستید؛ مثلا: بهرام قربانی", signature_url: "لینک امضا را بفرستید؛ مثلا: https://t.me/bahrameghorbani", sponsor_text: "متن اسپانسر را بفرستید؛ مثلا: رسانه فین‌تک | پی‌کار", sponsor_url: "لینک اسپانسر را بفرستید؛ مثلا: https://t.me/paykaarcom", emojis: "ایموجی‌ها را با کاما جدا کنید؛ مثلا: 🔥,🚀,⚡️,💻,🧠", avatar_emoji_id: "حالا فقط Custom Emoji آواتار را بفرستید؛ ایموجی معمولی یا متن به‌عنوان پست پردازش نمی‌شود.", x_emoji_id: "حالا Custom Emoji لوگوی X را بفرستید.", instagram_emoji_id: "حالا Custom Emoji لوگوی Instagram را بفرستید.", telegram_emoji_id: "حالا Custom Emoji لوگوی Telegram را بفرستید." })[key]; }
async function settingPrompt(store: Store, ownerId: string): Promise<SettingKey | undefined> { const value = await store.prompt(ownerId); return isSettingKey(value) ? value : undefined; }
async function saveSetting(key: SettingKey, message: TelegramMessage, store: Store, telegram: TelegramClient) {
  if (isCustomEmojiSetting(key)) {
    const value = customEmojiIdOf(message);
    if (!value) return telegram.sendMessage(message.chat.id, "فقط Custom Emoji را در همین گفت‌وگو بفرستید؛ ایموجی معمولی یا متن پذیرفته نمی‌شود.");
    await store.setSetting(key, value); await store.setPrompt(String(message.from!.id), "");
    return telegram.sendMessage(message.chat.id, "Custom Emoji ذخیره شد و از کارت بعدی نمایش داده می‌شود.");
  }
  const value = content(message).trim(); const error = validateSetting(key, value); if (error) return telegram.sendMessage(message.chat.id, error); await store.setSetting(key, value); await store.setPrompt(String(message.from!.id), ""); return telegram.sendMessage(message.chat.id, "تنظیم ذخیره شد و از پست بعدی اعمال می‌شود.");
}

export function customEmojiIdOf(message: TelegramMessage): string | undefined {
  const entity = [...(message.entities ?? []), ...(message.caption_entities ?? [])].find((item) => item.type === "custom_emoji" && /^\d+$/u.test(item.custom_emoji_id ?? ""));
  return entity?.custom_emoji_id;
}
