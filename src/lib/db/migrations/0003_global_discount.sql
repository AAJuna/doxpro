-- Diskon level dokumen (terpisah dari diskon per-item).
-- Nullable: hanya terisi kalau user input.
ALTER TABLE documents ADD COLUMN global_discount_type TEXT;
ALTER TABLE documents ADD COLUMN global_discount_value REAL;
