import { describe, expect, it } from "vitest";
import { configFromEnv } from "../src/config";
import type { Env } from "../src/types";

const base = { TELEGRAM_BOT_TOKEN: "token", TELEGRAM_WEBHOOK_SECRET: "a-valid-webhook-secret-value", AUTHORIZED_USER_IDS: "bootstrap", BOOTSTRAP_CODE: "A23456789012345678901234", DESTINATION_CHAT_ID: "@bahrameghorbani" } as Env;

describe("bootstrap configuration", () => {
  it("allows a secure one-time owner bootstrap", () => {
    expect(configFromEnv(base).authorizedUserIds.size).toBe(0);
    expect(configFromEnv(base).bootstrapCode).toBe(base.BOOTSTRAP_CODE);
    expect(configFromEnv(base).defaults.avatar_emoji_id).toBe("");
    expect((configFromEnv(base).defaults as Record<string, string>).x_emoji_id).toBe("");
    expect((configFromEnv(base).defaults as Record<string, string>).instagram_emoji_id).toBe("");
    expect((configFromEnv(base).defaults as Record<string, string>).telegram_emoji_id).toBe("");
  });
  it("rejects a weak bootstrap code", () => {
    expect(() => configFromEnv({ ...base, BOOTSTRAP_CODE: "short" })).toThrow("BOOTSTRAP_CODE");
  });
  it("rejects a non-numeric social custom emoji id", () => {
    expect(() => configFromEnv({ ...base, DEFAULT_X_EMOJI_ID: "not-an-id" } as Env)).toThrow("DEFAULT_X_EMOJI_ID");
  });
});
