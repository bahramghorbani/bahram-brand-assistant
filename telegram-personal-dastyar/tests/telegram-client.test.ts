import { describe, expect, it, vi } from "vitest";
import { TelegramClient } from "../src/telegram/client";

describe("TelegramClient.sendRichMessage", () => {
  it("publishes one native rich message containing its media and bordered HTML", async () => {
    const requests: Array<{ url: RequestInfo | URL; request?: RequestInit }> = [];
    const fetcher = vi.fn(async (url: RequestInfo | URL, request?: RequestInit) => {
      requests.push({ url, request });
      return new Response(JSON.stringify({ ok: true, result: { message_id: 42 } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    const client = new TelegramClient("secret", fetcher as typeof fetch);

    await client.sendRichMessage("@channel", "<table bordered><tr><td>Telegram</td></tr></table>", [{ type: "photo", fileId: "photo-file-id" }]);

    const { url, request } = requests[0]!;
    const body = JSON.parse(String(request?.body));
    expect(url).toBe("https://api.telegram.org/botsecret/sendRichMessage");
    expect(body.chat_id).toBe("@channel");
    expect(body.rich_message.html).toContain('<img src="tg://photo?id=media0"/>');
    expect(body.rich_message.html).toContain("<table bordered>");
    expect(body.rich_message.media).toEqual([{ id: "media0", media: { type: "photo", media: "photo-file-id" } }]);
  });
});
