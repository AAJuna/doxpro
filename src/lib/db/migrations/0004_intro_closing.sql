-- Intro & closing text per dokumen (override default per template).
-- Nullable: kalau kosong, template render default hardcoded copy.
ALTER TABLE documents ADD COLUMN intro_text TEXT;
ALTER TABLE documents ADD COLUMN closing_text TEXT;
