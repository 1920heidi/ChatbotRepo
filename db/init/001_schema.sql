CREATE TABLE documents (
  id                 UUID PRIMARY KEY,
  filename           TEXT NOT NULL,
  file_path          TEXT NOT NULL,
  source             TEXT NOT NULL,
  approved           BOOLEAN NOT NULL DEFAULT TRUE,
  embedding_version  INTEGER,
  status             TEXT NOT NULL DEFAULT 'queued'
                       CHECK (status IN ('queued', 'processing', 'indexed', 'failed')),
  chunks_indexed     INTEGER,
  error_message      TEXT,
  uploaded_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  indexed_at         TIMESTAMPTZ
);

CREATE TABLE conversation_sessions (
  id           UUID PRIMARY KEY,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conversation_sessions_last_seen_at_idx ON conversation_sessions (last_seen_at DESC);

CREATE TABLE conversation_messages (
  id           BIGSERIAL PRIMARY KEY,
  session_id   UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  sender       TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
  text         TEXT NOT NULL,
  sources      JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX conversation_messages_session_id_created_at_idx
  ON conversation_messages (session_id, created_at);

CREATE TABLE admin_users (
  id            UUID PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
