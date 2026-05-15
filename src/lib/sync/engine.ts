import { getSupabase, isCloudConfigured } from "./supabase";
import { listClients, listProducts, listDocuments, getCompany } from "@/lib/db/queries";

export type SyncResult = {
  ok: boolean;
  pushed: number;
  pulled: number;
  conflicts: number;
  error?: string;
};

/**
 * Stub sync engine. Real implementation should:
 * 1. Pull remote state with last_synced_at > local watermark
 * 2. Push local changes with local_ts > last_remote_sync
 * 3. Resolve conflicts by last-write-wins, surface for documents with status=sent/paid
 * 4. Use sync_log table to track operations idempotently
 */
export async function runSync(): Promise<SyncResult> {
  if (!isCloudConfigured()) {
    return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: "Cloud belum dikonfigurasi" };
  }
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: "Supabase client gagal init" };
  }

  const { data: session } = await supabase.auth.getSession();
  if (!session?.session) {
    return { ok: false, pushed: 0, pulled: 0, conflicts: 0, error: "Belum login" };
  }

  // TODO: implement real two-way sync. Placeholder counts current state for visibility.
  const [clients, products, docs, company] = await Promise.all([
    listClients(),
    listProducts(),
    listDocuments(),
    getCompany(),
  ]);

  return {
    ok: true,
    pushed: clients.length + products.length + docs.length + (company ? 1 : 0),
    pulled: 0,
    conflicts: 0,
  };
}

export async function loginMagicLink(email: string) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Cloud belum dikonfigurasi");
  return supabase.auth.signInWithOtp({ email });
}

export async function logout() {
  const supabase = getSupabase();
  if (!supabase) return;
  return supabase.auth.signOut();
}
