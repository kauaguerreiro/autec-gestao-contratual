-- Estrutura inicial do Autec
CREATE TABLE IF NOT EXISTS organizations (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  workspace_rev INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id        INTEGER NOT NULL REFERENCES organizations(id),
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  initials      TEXT    NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- Pastas (Unidade › Região › Fornecedor …)
CREATE TABLE IF NOT EXISTS folders (
  org_id     INTEGER NOT NULL REFERENCES organizations(id),
  id         TEXT    NOT NULL,
  parent_id  TEXT,
  name       TEXT    NOT NULL,
  icon       TEXT,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  PRIMARY KEY (org_id, id)
);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(org_id, parent_id);

-- Documentos (contratos, aditivos, distratos). "data" guarda o registro completo em JSON;
-- as colunas abaixo existem para consultas e relatórios no servidor.
CREATE TABLE IF NOT EXISTS documents (
  org_id        INTEGER NOT NULL REFERENCES organizations(id),
  id            TEXT    NOT NULL,
  folder_id     TEXT,
  name          TEXT    NOT NULL,
  contract_type TEXT,
  start_date    TEXT,
  end_date      TEXT,
  value_cents   INTEGER,
  parent_id     TEXT,
  processing    TEXT,
  updated_at    TEXT,
  data          TEXT    NOT NULL,
  PRIMARY KEY (org_id, id)
);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(org_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_end ON documents(org_id, end_date);

CREATE TABLE IF NOT EXISTS alerts (
  org_id    INTEGER NOT NULL REFERENCES organizations(id),
  folder_id TEXT    NOT NULL,
  days      INTEGER NOT NULL,
  PRIMARY KEY (org_id, folder_id)
);

-- Arquivos originais (PDF/DOC) guardados em disco
CREATE TABLE IF NOT EXISTS files (
  org_id        INTEGER NOT NULL REFERENCES organizations(id),
  document_id   TEXT    NOT NULL,
  mime          TEXT    NOT NULL,
  size          INTEGER NOT NULL,
  original_name TEXT,
  storage_path  TEXT    NOT NULL,
  uploaded_by   INTEGER REFERENCES users(id),
  uploaded_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (org_id, document_id)
);

-- Trilha de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id  INTEGER,
  user_id INTEGER,
  action  TEXT NOT NULL,
  detail  TEXT,
  at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_log(org_id, at);
