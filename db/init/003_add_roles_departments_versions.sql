CREATE TABLE departments (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'reviewer'
  CHECK (role IN ('super_admin', 'reviewer', 'uploader'));
ALTER TABLE admin_users ADD COLUMN department_id UUID REFERENCES departments(id);

ALTER TABLE documents ADD COLUMN uploaded_by UUID REFERENCES admin_users(id);
ALTER TABLE documents ADD COLUMN department_id UUID REFERENCES departments(id);
ALTER TABLE documents ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN current_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE document_versions (
  id              UUID PRIMARY KEY,
  document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  filename        TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  source          TEXT NOT NULL,
  chunks_indexed  INTEGER,
  uploaded_by     UUID REFERENCES admin_users(id),
  uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

-- The already-seeded admin becomes the first super admin (no-op on a fresh
-- install where admin_users is still empty at init time).
UPDATE admin_users SET role = 'super_admin' WHERE email = 'admin@psc.go.ke';
