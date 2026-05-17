-- Recurring document support: jadiin dokumen sebagai source template recurring.
-- Saat next_date <= hari ini dan recurring_active = 1, app generate copy baru
-- dan advance next_date sesuai schedule. Source doc tetap di list (tagged
-- via badge), copy adalah dokumen normal tanpa flag recurring.
ALTER TABLE documents ADD COLUMN recurring_schedule TEXT; -- 'weekly'|'monthly'|'yearly'|NULL
ALTER TABLE documents ADD COLUMN recurring_next_date TEXT; -- YYYY-MM-DD
ALTER TABLE documents ADD COLUMN recurring_active INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_documents_recurring_active
  ON documents(recurring_active, recurring_next_date);
