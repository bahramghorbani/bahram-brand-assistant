import { describe, expect, it } from "vitest";
import { decorate } from "../src/domain/formatter";

const settings = { signature_text: "بهرام قربانی", signature_url: "https://t.me/bahrameghorbani", sponsor_text: "پی‌کار", sponsor_url: "https://t.me/paykaarcom", emojis: "🔥,🚀", avatar_emoji_id: "5368324170671202286" };

describe("decorate", () => {
  it("adds rotating paragraph emojis and a native rich-message table", () => {
    const value = decorate("پاراگراف اول\n\nپاراگراف دوم", settings);
    expect(value).toContain("<p>🔥 پاراگراف اول</p><p>🚀 پاراگراف دوم</p>");
    expect(value).toContain('<p><b><tg-emoji emoji-id="5368324170671202286">🧑</tg-emoji> Join the Bahram Community</b></p>');
    expect(value).toContain("<table bordered compact>");
    expect(value).toContain('<a href="https://t.me/paykaarcom">🤝 Sponsor · پی‌کار</a>');
  });
  it("removes an identifiable forwarded channel reference and trailing footer", () => {
    const value = decorate("خبر مهم\n\n@sourcechannel", settings, { type: "channel", chat: { id: 1, type: "channel", username: "sourcechannel" } });
    expect(value).not.toContain("sourcechannel");
    expect(value).toContain("🔥 خبر مهم");
  });

  it("renders the custom emoji and bordered community links in the native signature card", () => {
    const value = decorate("خبر", settings);
    expect(value).toContain('<b><tg-emoji emoji-id="5368324170671202286">🧑</tg-emoji> Join the Bahram Community</b>');
    expect(value).toContain('<a href="https://x.com/bahr4m">𝕏 @bahr4m</a>');
    expect(value).toContain('<a href="https://t.me/bahrameghorbani">✈️ @bahrameghorbani</a>');
    expect(value).toContain('<a href="https://instagram.com/bahrameghorbani">◎ @bahrameghorbani</a>');
    expect(value).toContain('<a href="https://paykaar.com">🌐 paykaar.com</a>');
    expect(value).toContain("<table bordered compact>");
    expect(value).not.toContain("╭");
  });
});
