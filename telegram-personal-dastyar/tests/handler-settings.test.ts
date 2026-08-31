import { describe, expect, it, vi } from "vitest";
import { handleUpdate } from "../src/bot/handler";
import type { Config } from "../src/config";
import type { Store } from "../src/storage/store";
import type { TelegramClient } from "../src/telegram/client";

describe("standard emoji settings", () => {
  it("stores an ordinary free emoji while an icon setting is active", async () => {
    const setSetting = vi.fn();
    const setPrompt = vi.fn();
    const sendMessage = vi.fn();
    const store = {
      acceptUpdate: vi.fn().mockResolvedValue(true),
      isBootstrapOwner: vi.fn().mockResolvedValue(true),
      settings: vi.fn().mockResolvedValue({}),
      prompt: vi.fn().mockResolvedValue("instagram_emoji_id"),
      setSetting,
      setPrompt
    } as unknown as Store;
    const telegram = { sendMessage } as unknown as TelegramClient;
    const config = {
      authorizedUserIds: new Set(["42"]),
      destinationChatId: "@bahrameghorbani",
      defaults: {}
    } as Config;

    await handleUpdate({
      update_id: 1,
      message: { message_id: 1, from: { id: 42 }, chat: { id: 42, type: "private" }, text: "📸" }
    }, store, telegram, config);

    expect(setSetting).toHaveBeenCalledWith("instagram_emoji_id", "📸");
    expect(setPrompt).toHaveBeenCalledWith("42", "");
    expect(sendMessage).toHaveBeenCalledWith(42, "آیکون ذخیره شد و از کارت بعدی نمایش داده می‌شود.");
  });
});
