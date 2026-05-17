import { useAppStore } from "@/store/useAppStore";
import { can, hasFeature, type Permission, type TierFeature } from "./permissions";
import type { UserRole, LicenseTier, LocalUser } from "@/types";

/**
 * Default identity when no user is signed in. doxpro runs in Solo Free mode
 * out of the box — Onboarding sets up company identity but never requires
 * an account. Implicit solo role + free tier is the baseline.
 */
const SOLO_FREE: { role: UserRole; tier: LicenseTier } = {
  role: "solo",
  tier: "free",
};

export function useCurrentUser(): LocalUser | null {
  return useAppStore((s) => s.currentUser);
}

export function useCurrentRole(): UserRole {
  return useAppStore((s) => s.currentUser?.role ?? SOLO_FREE.role);
}

export function useCurrentTier(): LicenseTier {
  return useAppStore((s) => s.currentUser?.tier ?? SOLO_FREE.tier);
}

export function useIsSignedIn(): boolean {
  return useAppStore((s) => s.currentUser !== null);
}

/**
 * Convenience hook for component-level permission checks. Returns true when
 * the current user's role grants the permission.
 *
 * @example
 *   const canEditBank = usePermission("bank.edit");
 *   <Input disabled={!canEditBank} />
 */
export function usePermission(permission: Permission): boolean {
  const role = useCurrentRole();
  return can(role, permission);
}

/**
 * Convenience hook for tier-feature checks. Returns true when the current
 * subscription tier includes the feature.
 *
 * @example
 *   const hasPremiumTemplates = useFeature("templates.premium");
 *   {hasPremiumTemplates ? <PremiumPicker/> : <UpgradePrompt/>}
 */
export function useFeature(feature: TierFeature): boolean {
  const tier = useCurrentTier();
  return hasFeature(tier, feature);
}
