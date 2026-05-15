CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  npwp TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  logo_path TEXT,
  default_color TEXT NOT NULL DEFAULT '#0f172a',
  default_font TEXT NOT NULL DEFAULT 'Inter',
  bank_name TEXT,
  bank_account TEXT,
  bank_holder TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  npwp TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'pcs',
  tax_rate REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  number TEXT NOT NULL,
  date TEXT NOT NULL,
  valid_until TEXT,
  due_date TEXT,
  client_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  totals_json TEXT NOT NULL,
  customizations_json TEXT NOT NULL,
  signature_id TEXT,
  notes TEXT,
  terms_text TEXT,
  payment_method TEXT,
  received_from TEXT,
  proposal_content TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(date);
CREATE INDEX IF NOT EXISTS idx_documents_client ON documents(client_id);

CREATE TABLE IF NOT EXISTS document_items (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  product_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  qty REAL NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  price REAL NOT NULL DEFAULT 0,
  tax_rate REAL NOT NULL DEFAULT 0,
  discount_pct REAL NOT NULL DEFAULT 0,
  subtotal REAL NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_document_items_doc ON document_items(document_id);

CREATE TABLE IF NOT EXISTS signatures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_path TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  doc_type TEXT NOT NULL,
  name TEXT NOT NULL,
  style_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_log (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  local_ts TEXT NOT NULL,
  synced_at TEXT
);
