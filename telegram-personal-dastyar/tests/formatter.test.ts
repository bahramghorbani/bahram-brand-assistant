import { describe, expect, it } from "vitest";
import { decorate } from "../src/domain/formatter";

const settings = {
  signature_text: "Join the Bahram Community",
  signature_url: "https://t.me/bahrameghorbani",
  sponsor_text: "رسانه فین‌تک | پی‌کار",
  sponsor_url: "https://t.me/paykaarcom",
  emojis: "🔥,🚀",
  avatar_emoji_id: "5368324170671202286",
  x_emoji_id: "1000000000000000001",
  instagram_emoji_id: "1000000000000000002",
  telegram_emoji_id: "1000000000000000003"
};

describe("decorate", () => {
  it("adds rotating paragraph emojis and a native rich-message table", () => {
    const value = decorate("پاراگراف اول\n\nپاراگراف دوم", settings);
    expect(value).toContain("<p>🔥 پاراگراف اول</p><p>🚀 پاراگراف دوم</p>");
    expect(value).toContain('<p><b><tg-emoji emoji-id="5368324170671202286">🧑</tg-emoji> <a href="https://t.me/bahrameghorbani">Join the Bahram Community</a></b></p>');
    expect(value).toContain("<table bordered compact>");
    expect(value).toContain('<a href="https://t.me/paykaarcom">🤝 Sponsor · رسانه فین‌تک | پی‌کار</a>');
  });
  it("removes an identifiable forwarded channel reference and trailing footer", () => {
    const value = decorate("خبر مهم\n\n@sourcechannel", settings, { type: "channel", chat: { id: 1, type: "channel", username: "sourcechannel" } });
    expect(value).not.toContain("sourcechannel");
    expect(value).toContain("🔥 خبر مهم");
  });

  it("renders the custom emoji and bordered community links in the native signature card", () => {
    const value = decorate("خبر", settings);
    expect(value).toContain('<b><tg-emoji emoji-id="5368324170671202286">🧑</tg-emoji> <a href="https://t.me/bahrameghorbani">Join the Bahram Community</a></b>');
    expect(value).toContain('<a href="https://x.com/bahr4m"><tg-emoji emoji-id="1000000000000000001">⬛</tg-emoji> @bahr4m</a>');
    expect(value).toContain('<a href="https://t.me/bahrameghorbani"><tg-emoji emoji-id="1000000000000000003">🔵</tg-emoji> @bahrameghorbani</a>');
    expect(value).toContain('<a href="https://instagram.com/bahrameghorbani"><tg-emoji emoji-id="1000000000000000002">📸</tg-emoji> @bahrameghorbani</a>');
    expect(value).toContain('<a href="https://paykaar.com">🌐 paykaar.com</a>');
    expect(value).toContain("<table bordered compact>");
    expect(value).not.toContain("╭");
  });

  it("uses the editable signature title and link in the card heading", () => {
    const value = decorate("خبر", { ...settings, signature_text: "Community Test", signature_url: "https://t.me/communitytest" });
    expect(value).toContain('<a href="https://t.me/communitytest">Community Test</a>');
    expect(value).not.toContain("Join the Bahram Community");
  });

  it("uses recognizable standard icons until social custom emojis are configured", () => {
    const value = decorate("خبر", { ...settings, x_emoji_id: "", instagram_emoji_id: "", telegram_emoji_id: "" });
    expect(value).toContain('<a href="https://x.com/bahr4m">⬛ 𝕏 @bahr4m</a>');
    expect(value).toContain('<a href="https://instagram.com/bahrameghorbani">📸 @bahrameghorbani</a>');
    expect(value).toContain('<a href="https://t.me/bahrameghorbani">🔵 @bahrameghorbani</a>');
  });
});
