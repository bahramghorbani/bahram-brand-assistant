CREATE TABLE IF NOT EXISTS processed_updates (
  update_id INTEGER PRIMARY KEY,
  processed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  media_group_id TEXT,
  content_type TEXT NOT NULL CHECK(content_type IN ('text', 'photo', 'video', 'audio', 'document', 'album')),
  original_content TEXT NOT NULL,
  cleaned_content TEXT NOT NULL,
  media_json TEXT,
  status TEXT NOT NULL CHECK(status IN ('COLLECTING', 'READY_FOR_REVIEW', 'WAITING_FOR_EDIT', 'PUBLISHING', 'PUBLISHED', 'CANCELLED', 'FAILED')),
  destination_message_id INTEGER,
  last_error TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS drafts_owner_status ON drafts(owner_id, status);
CREATE INDEX IF NOT EXISTS drafts_owner_group ON drafts(owner_id, media_group_id);
