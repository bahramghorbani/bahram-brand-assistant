export type ContentType = "text" | "photo" | "video" | "audio" | "document" | "album";
export type DraftStatus = "COLLECTING" | "READY_FOR_REVIEW" | "WAITING_FOR_EDIT" | "PUBLISHING" | "PUBLISHED" | "CANCELLED" | "FAILED";

export interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_WEBHOOK_SECRET: string;
  AUTHORIZED_USER_IDS: string;
  BOOTSTRAP_CODE?: string;
  DESTINATION_CHAT_ID: string;
  DESTINATION_CHANNEL_USERNAME?: string;
  DEFAULT_SIGNATURE_TEXT?: string;
  DEFAULT_SIGNATURE_URL?: string;
  DEFAULT_SPONSOR_TEXT?: string;
  DEFAULT_SPONSOR_URL?: string;
  DEFAULT_EMOJIS?: string;
}

export interface Media { type: Exclude<ContentType, "text" | "album">; fileId: string; }
export interface Draft {
  id: string; owner_id: string; media_group_id: string | null; content_type: ContentType;
  original_content: string; cleaned_content: string; media_json: string | null;
  status: DraftStatus; destination_message_id: number | null; expires_at: string;
}

export interface TelegramChat { id: number; type: string; username?: string; }
export interface TelegramMessage {
  message_id: number; text?: string; caption?: string; media_group_id?: string;
  from?: { id: number }; chat: TelegramChat;
  photo?: Array<{ file_id: string; width: number; height: number }>;
  video?: { file_id: string }; audio?: { file_id: string }; document?: { file_id: string };
  forward_origin?: { type: string; chat?: TelegramChat; message_id?: number };
}
export interface TelegramUpdate {
  update_id: number; message?: TelegramMessage;
  callback_query?: { id: string; from: { id: number }; data?: string; message?: TelegramMessage };
}
