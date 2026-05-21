import type { LocalUser } from "@/types";
import { isCloudConfigured } from "@/lib/sync/supabase";
import { getCurrentSession } from "@/lib/sync/engine";
import { syncLocalUserFromSession, setLocalUser } from "./queries";
import { useAppStore } from "@/store/useAppStore";

const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export function needsReSync(user: LocalUser): boolean {
  if (user.tier === "free") return false;
  if (!user.lastVerifiedAt) return true;
  const lastMs = new Date(user.lastVerifiedAt).getTime();
  return Date.now() - lastMs > SYNC_INTERVAL_MS;
}

export function isWithinGracePeriod(user: LocalUser): boolean {
  if (user.tier === "free") return true;
  if (user.tier === "lifetime") return true;
  if (!user.lastVerifiedAt) return false;
  const lastMs = new Date(user.lastVerifiedAt).getTime();
  return Date.now() - lastMs < GRACE_PERIOD_MS;
}

export async function forceReSync(): Promise<LocalUser | null> {
  if (!isCloudConfigured()) return null;
  try {
    const session = await getCurrentSession();
    if (!session) return null;
    const fresh = await syncLocalUserFromSession(session);
    if (fresh) {
      useAppStore.getState().setCurrentUser(fresh);
    }
    return fresh;
  } catch {
    return null;
  }
}

export async function maybeBackgroundSync(): Promise<void> {
  const user = useAppStore.getState().currentUser;
  if (!user) return;

  if (!isWithinGracePeriod(user)) {
    const downgraded: LocalUser = { ...user, tier: "free" };
    await setLocalUser(downgraded);
    useAppStore.getState().setCurrentUser(downgraded);
    return;
  }

  if (needsReSync(user)) {
    await forceReSync();
  }
}
