CREATE TABLE IF NOT EXISTS document_sequences (
  type TEXT NOT NULL,
  year_month TEXT NOT NULL,
  next_seq INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (type, year_month)
);

-- Backfill from existing documents. Only count rows whose date matches
-- the expected YYYY-MM-DD prefix so a corrupt row doesn't poison the seq.
INSERT INTO document_sequences (type, year_month, next_seq)
SELECT type, substr(date, 1, 7) AS year_month, COUNT(*) AS next_seq
FROM documents
WHERE date IS NOT NULL
  AND length(date) >= 10
  AND substr(date, 5, 1) = '-'
  AND substr(date, 8, 1) = '-'
GROUP BY type, substr(date, 1, 7)
ON CONFLICT(type, year_month) DO NOTHING;
