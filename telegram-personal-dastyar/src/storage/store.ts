import type { SettingKey } from "../config";
import type { ContentType, Draft, DraftStatus, Media } from "../types";

export class Store {
  constructor(private readonly db: D1Database) {}
  async acceptUpdate(updateId: number): Promise<boolean> {
    const result = await this.db.prepare("INSERT OR IGNORE INTO processed_updates(update_id) VALUES (?)").bind(updateId).run();
    return (result.meta.changes ?? 0) === 1;
  }
  async settings(defaults: Record<SettingKey, string>): Promise<Record<SettingKey, string>> {
    const rows = await this.db.prepare("SELECT key, value FROM settings").all<{ key: SettingKey; value: string }>();
    return Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [key, rows.results.find((row) => row.key === key)?.value ?? fallback])) as Record<SettingKey, string>;
  }
  setSetting(key: SettingKey, value: string) { return this.db.prepare("INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP").bind(key, value).run(); }
  setPrompt(ownerId: string, key: string) { return this.db.prepare("INSERT INTO settings(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP").bind(`prompt:${ownerId}`, key).run(); }
  async prompt(ownerId: string): Promise<string | undefined> { return (await this.db.prepare("SELECT value FROM settings WHERE key=?").bind(`prompt:${ownerId}`).first<{ value: string }>())?.value; }
  async isBootstrapOwner(ownerId: string): Promise<boolean> { return (await this.db.prepare("SELECT value FROM settings WHERE key='authorized_owner_id'").first<{ value: string }>())?.value === ownerId; }
  async claimBootstrapOwner(ownerId: string): Promise<boolean> {
    const result = await this.db.prepare("INSERT OR IGNORE INTO settings(key, value) VALUES ('authorized_owner_id', ?)").bind(ownerId).run();
    return (result.meta.changes ?? 0) === 1 || await this.isBootstrapOwner(ownerId);
  }
  async create(input: { id: string; ownerId: string; type: ContentType; original: string; cleaned: string; media?: Media[]; groupId?: string; status: DraftStatus; expiresAt: string }) {
    await this.db.prepare("INSERT INTO drafts(id,owner_id,media_group_id,content_type,original_content,cleaned_content,media_json,status,expires_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(input.id, input.ownerId, input.groupId ?? null, input.type, input.original, input.cleaned, input.media ? JSON.stringify(input.media) : null, input.status, input.expiresAt).run();
  }
  get(id: string) { return this.db.prepare("SELECT * FROM drafts WHERE id=?").bind(id).first<Draft>(); }
  async collectingGroup(ownerId: string, groupId: string) { return this.db.prepare("SELECT * FROM drafts WHERE owner_id=? AND media_group_id=? AND status='COLLECTING' ORDER BY created_at DESC LIMIT 1").bind(ownerId, groupId).first<Draft>(); }
  async appendGroupMedia(id: string, media: Media, original: string, cleaned: string) {
    const draft = await this.get(id); if (!draft) return;
    const all = [...this.media(draft), media];
    await this.db.prepare("UPDATE drafts SET media_json=?, original_content=?, cleaned_content=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='COLLECTING'").bind(JSON.stringify(all), original, cleaned, id).run();
  }
  media(draft: Draft): Media[] { try { return draft.media_json ? JSON.parse(draft.media_json) as Media[] : []; } catch { return []; } }
  async setStatus(id: string, ownerId: string, from: DraftStatus, to: DraftStatus) {
    const result = await this.db.prepare("UPDATE drafts SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND owner_id=? AND status=? AND expires_at>CURRENT_TIMESTAMP").bind(to, id, ownerId, from).run();
    return (result.meta.changes ?? 0) === 1;
  }
  async activeGroup(ownerId: string) { return this.db.prepare("SELECT * FROM drafts WHERE owner_id=? AND status='COLLECTING' ORDER BY updated_at DESC LIMIT 1").bind(ownerId).first<Draft>(); }
  async editing(ownerId: string) { return this.db.prepare("SELECT * FROM drafts WHERE owner_id=? AND status='WAITING_FOR_EDIT' ORDER BY updated_at DESC LIMIT 1").bind(ownerId).first<Draft>(); }
  updateContent(id: string, content: string) { return this.db.prepare("UPDATE drafts SET cleaned_content=?,status='READY_FOR_REVIEW',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='WAITING_FOR_EDIT'").bind(content, id).run(); }
  complete(id: string, messageId: number) { return this.db.prepare("UPDATE drafts SET status='PUBLISHED',destination_message_id=?,published_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PUBLISHING'").bind(messageId, id).run(); }
  fail(id: string, reason: string) { return this.db.prepare("UPDATE drafts SET status='FAILED',last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PUBLISHING'").bind(reason.slice(0, 180), id).run(); }
}
