import { describe, expect, it } from "vitest";
import { customEmojiIdOf } from "../src/bot/handler";
import type { TelegramMessage } from "../src/types";

describe("custom emoji avatar setup", () => {
  it("extracts only a custom emoji entity from the owner's message", () => {
    const message = {
      message_id: 1,
      chat: { id: 10, type: "private" },
      text: "🧑",
      entities: [{ type: "custom_emoji", offset: 0, length: 2, custom_emoji_id: "5368324170671202286" }]
    } satisfies TelegramMessage;

    expect(customEmojiIdOf(message)).toBe("5368324170671202286");
  });

  it("does not treat an ordinary emoji or missing entity as an avatar", () => {
    expect(customEmojiIdOf({ message_id: 1, chat: { id: 10, type: "private" }, text: "🧑" })).toBeUndefined();
  });
});
