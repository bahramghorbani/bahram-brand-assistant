import { describe, expect, it } from "vitest";
import { decorate } from "../src/domain/formatter";

const settings = { signature_text: "بهرام قربانی", signature_url: "https://t.me/bahrameghorbani", sponsor_text: "پی‌کار", sponsor_url: "https://t.me/paykaarcom", emojis: "🔥,🚀" };

describe("decorate", () => {
  it("adds rotating paragraph emojis and an HTML blockquote signature", () => {
    const value = decorate("پاراگراف اول\n\nپاراگراف دوم", settings);
    expect(value).toContain("🔥 پاراگراف اول\n\n🚀 پاراگراف دوم");
    expect(value).toContain("<blockquote><b>بهرام قربانی</b>\n\n───\n<a href=\"https://t.me/bahrameghorbani\">@bahrameghorbani</a>");
    expect(value).toContain("🤝 <b>Sponsor</b>\n\nپی‌کار\n<a href=\"https://t.me/paykaarcom\">@paykaarcom</a>");
  });
  it("removes an identifiable forwarded channel reference and trailing footer", () => {
    const value = decorate("خبر مهم\n\n@sourcechannel", settings, { type: "channel", chat: { id: 1, type: "channel", username: "sourcechannel" } });
    expect(value).not.toContain("sourcechannel");
    expect(value).toContain("🔥 خبر مهم");
  });
});
