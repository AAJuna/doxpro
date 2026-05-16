-- Template dokumen reusable (save items + customization untuk paket berulang)
CREATE TABLE IF NOT EXISTS document_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- DocumentType: penawaran / invoice / kwitansi / proposal
  items_json TEXT NOT NULL DEFAULT '[]',
  customizations_json TEXT NOT NULL,
  notes TEXT,
  terms_text TEXT,
  intro_text TEXT,
  closing_text TEXT,
  global_discount_type TEXT,
  global_discount_value REAL,
  payment_method TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(type);
CREATE INDEX IF NOT EXISTS idx_document_templates_name ON document_templates(name);
