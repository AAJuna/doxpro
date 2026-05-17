import type { Session } from "@supabase/supabase-js";
import { getSupabase, isCloudConfigured } from "@/lib/sync/supabase";
import { execute, select } from "@/lib/db/client";
import { nowIso } from "@/lib/utils";
import type { LocalUser, UserRole, LicenseTier } from "@/types";

// ============================================================================
// Supabase auth (cloud) — only works when VITE_SUPABASE_* env vars are set
// ============================================================================

export interface AuthResult {
  ok: boolean;
  session?: Session;
  error?: string;
  needsConfirmation?: boolean;
}

/**
 * Register a new user with email + password. Supabase sends a confirmation
 * email by default; the user must click the link before they can login.
 * If the project has email confirmation disabled, the session is returned
 * immediately and the local mirror is populated.
 */
export async function registerWithPassword(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthResult> {
  if (!isCloudConfigured()) {
    return { ok: false, error: "Cloud auth belum dikonfigurasi. Cek Settings → Cloud Sync." };
  }
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Supabase client gagal init" };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: fullName ? { full_name: fullName } : undefined },
  });
  if (error) return { ok: false, error: error.message };

  // Email confirmation required → no session yet, user must check inbox
  if (!data.session) {
    return { ok: true, needsConfirmation: true };
  }

  await syncLocalUserFromSession(data.session);
  return { ok: true, session: data.session };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!isCloudConfigured()) {
    return { ok: false, error: "Cloud auth belum dikonfigurasi" };
  }
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Supabase client gagal init" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  if (!data.session) return { ok: false, error: "Login gagal: tidak ada session" };

  await syncLocalUserFromSession(data.session);
  return { ok: true, session: data.session };
}

export async function logoutCurrent(): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: error.message };
  }
  await clearLocalUser();
  return { ok: true };
}

export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isCloudConfigured()) return { ok: false, error: "Cloud auth belum dikonfigurasi" };
  const supabase = getSupabase();
  if (!supabase) return { ok: false, error: "Supabase client gagal init" };

  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ============================================================================
// Local user mirror (SQLite singleton row)
// ============================================================================

interface LocalUserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  org_id: string | null;
  tier: string;
  license_valid_until: string | null;
  last_verified_at: string | null;
  created_at: string;
}

function rowToUser(r: LocalUserRow): LocalUser {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? undefined,
    role: r.role as UserRole,
    orgId: r.org_id ?? undefined,
    tier: r.tier as LicenseTier,
    licenseValidUntil: r.license_valid_until ?? undefined,
    lastVerifiedAt: r.last_verified_at ?? undefined,
    createdAt: r.created_at,
  };
}

export async function getLocalUser(): Promise<LocalUser | null> {
  const rows = await select<LocalUserRow>("SELECT * FROM local_user LIMIT 1");
  if (rows.length === 0) return null;
  return rowToUser(rows[0]);
}

export async function setLocalUser(user: LocalUser): Promise<void> {
  // Singleton: clear then insert. Cheaper than UPSERT with conflict resolution.
  await execute("DELETE FROM local_user");
  await execute(
    `INSERT INTO local_user
      (id, email, full_name, role, org_id, tier, license_valid_until, last_verified_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      user.email,
      user.fullName ?? null,
      user.role,
      user.orgId ?? null,
      user.tier,
      user.licenseValidUntil ?? null,
      user.lastVerifiedAt ?? null,
      user.createdAt,
    ],
  );
}

export async function clearLocalUser(): Promise<void> {
  await execute("DELETE FROM local_user");
}

/**
 * Sync the local mirror from a fresh Supabase session. Reads profile + active
 * subscription, then materializes the row. Falls back to sensible defaults
 * (role=solo, tier=free) when the cloud rows aren't there yet — the auth
 * triggers should create them, but the network call might race.
 */
export async function syncLocalUserFromSession(session: Session): Promise<LocalUser | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const userId = session.user.id;
  const email = session.user.email ?? "";

  // Fetch profile (auto-created by Supabase trigger)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  // Look for active subscription. Try user-scoped first (Solo), then
  // membership → org-scoped (Team).
  let tier: LicenseTier = "free";
  let role: UserRole = "solo";
  let orgId: string | undefined;
  let licenseValidUntil: string | undefined;

  const { data: userSub } = await supabase
    .from("subscriptions")
    .select("tier, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (userSub) {
    tier = userSub.tier as LicenseTier;
    licenseValidUntil = userSub.current_period_end
      ? new Date(userSub.current_period_end).toISOString().slice(0, 10)
      : undefined;
  }

  const { data: membership } = await supabase
    .from("memberships")
    .select("org_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (membership) {
    role = membership.role as UserRole;
    orgId = membership.org_id;
    // Org subscription overrides user subscription
    const { data: orgSub } = await supabase
      .from("subscriptions")
      .select("tier, current_period_end")
      .eq("org_id", orgId)
      .eq("status", "active")
      .maybeSingle();
    if (orgSub) {
      tier = orgSub.tier as LicenseTier;
      licenseValidUntil = orgSub.current_period_end
        ? new Date(orgSub.current_period_end).toISOString().slice(0, 10)
        : undefined;
    }
  }

  const localUser: LocalUser = {
    id: userId,
    email,
    fullName: profile?.full_name ?? undefined,
    role,
    orgId,
    tier,
    licenseValidUntil,
    lastVerifiedAt: nowIso(),
    createdAt: nowIso(),
  };

  await setLocalUser(localUser);
  return localUser;
}

/**
 * Determine whether the cached license is still valid offline. Pro features
 * unlock for up to 30 days after the last successful Supabase verification,
 * even without network access — accommodates UMKM with spotty connectivity.
 */
export function isLicenseGracePeriodValid(user: LocalUser): boolean {
  if (user.tier === "free") return true; // free is always valid
  if (user.tier === "lifetime") return true; // lifetime never expires

  if (!user.lastVerifiedAt) return false;
  const lastVerified = new Date(user.lastVerifiedAt).getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const withinGrace = Date.now() - lastVerified < thirtyDaysMs;

  // Also respect the explicit license_valid_until from Supabase if set
  if (user.licenseValidUntil) {
    const validUntil = new Date(user.licenseValidUntil).getTime();
    return withinGrace && Date.now() < validUntil;
  }
  return withinGrace;
}
