-- Local mirror of the currently logged-in user from Supabase.
-- Single-row table: at most ONE row exists, representing the user signed in
-- on this device. NULL/empty table = no user signed in (Solo Free mode).
--
-- license_valid_until + last_verified_at enable offline grace period: app
-- re-checks Supabase every ~24h when online, and tolerates up to 30 days
-- without network before downgrading Pro features to Free.
CREATE TABLE IF NOT EXISTS local_user (
  id TEXT PRIMARY KEY,                  -- matches Supabase auth.users.id (uuid)
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'solo',    -- 'solo' | 'admin' | 'member'
  org_id TEXT,                          -- nullable for solo
  tier TEXT NOT NULL DEFAULT 'free',    -- 'free' | 'pro_personal' | 'pro_team' | 'lifetime'
  license_valid_until TEXT,             -- ISO date (YYYY-MM-DD) for offline grace
  last_verified_at TEXT,                -- ISO timestamp of last Supabase verification
  created_at TEXT NOT NULL
);

-- Enforce single-row invariant via partial unique index on a constant.
CREATE UNIQUE INDEX IF NOT EXISTS idx_local_user_singleton ON local_user((1));
