import { handleUpdate } from "./bot/handler";
import { configFromEnv } from "./config";
import { Store } from "./storage/store";
import { TelegramClient } from "./telegram/client";
import type { Env, TelegramUpdate } from "./types";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/setup") {
      if (!env.BOOTSTRAP_CODE || request.headers.get("X-Setup-Code") !== env.BOOTSTRAP_CODE) return new Response("Unauthorized", { status: 401 });
      try {
        await new TelegramClient(env.TELEGRAM_BOT_TOKEN).setWebhook(`${url.origin}/`, env.TELEGRAM_WEBHOOK_SECRET);
        return new Response("Webhook configured");
      } catch (error) { console.error("Webhook setup failed", error instanceof Error ? error.message : "unknown"); return new Response("Webhook setup failed", { status: 502 }); }
    }
    if (request.method !== "POST") return new Response("Not found", { status: 404 });
    if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== env.TELEGRAM_WEBHOOK_SECRET) return new Response("Unauthorized", { status: 401 });
    try {
      const update = await request.json() as TelegramUpdate;
      if (!Number.isInteger(update.update_id)) return new Response("Bad Request", { status: 400 });
      await handleUpdate(update, new Store(env.DB), new TelegramClient(env.TELEGRAM_BOT_TOKEN), configFromEnv(env));
    } catch (error) { console.error("Webhook processing failed", error instanceof Error ? error.message : "unknown"); }
    return new Response("OK");
  }
};
