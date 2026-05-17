import type { UserRole, LicenseTier } from "@/types";

/**
 * Permission catalog. Keep these names dot-separated noun.action so callers
 * read naturally: can(role, "bank.edit"), can(role, "documents.delete.others").
 *
 * Solo is implicit admin — single-user mode has full access. Member is the
 * locked-down role inside a team; they create docs but can't touch financial
 * config or other people's data.
 */
export type Permission =
  | "bank.edit"                  // edit bank/rekening fields on Company
  | "settings.company.edit"      // edit company identity (name, NPWP, etc)
  | "settings.numbering.edit"    // change document numbering scheme
  | "settings.backup.manage"     // export/import backups
  | "members.invite"             // invite new team member
  | "members.remove"             // kick a member
  | "members.role.change"        // promote/demote roles
  | "billing.manage"             // view/change subscription, payment
  | "documents.create"
  | "documents.edit.own"
  | "documents.edit.any"         // edit docs created by others
  | "documents.delete.own"
  | "documents.delete.any"
  | "documents.view.others"      // see docs created by others in same org
  | "clients.manage"
  | "products.manage"
  | "templates.manage"
  | "signatures.manage"
  | "audit.view";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  solo: [
    "bank.edit",
    "settings.company.edit",
    "settings.numbering.edit",
    "settings.backup.manage",
    "billing.manage",
    "documents.create",
    "documents.edit.own",
    "documents.edit.any",
    "documents.delete.own",
    "documents.delete.any",
    "documents.view.others",
    "clients.manage",
    "products.manage",
    "templates.manage",
    "signatures.manage",
  ],
  admin: [
    "bank.edit",
    "settings.company.edit",
    "settings.numbering.edit",
    "settings.backup.manage",
    "members.invite",
    "members.remove",
    "members.role.change",
    "billing.manage",
    "documents.create",
    "documents.edit.own",
    "documents.edit.any",
    "documents.delete.own",
    "documents.delete.any",
    "documents.view.others",
    "clients.manage",
    "products.manage",
    "templates.manage",
    "signatures.manage",
    "audit.view",
  ],
  member: [
    "documents.create",
    "documents.edit.own",
    "documents.delete.own",
    "documents.view.others",
    "clients.manage",
    "products.manage",
    "templates.manage",
    "signatures.manage",
  ],
};

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Tier-gated features. These return false for Free tier regardless of role.
 * Use alongside can() for double-gate (UI element shown only when role allows
 * AND tier includes the feature).
 */
export type TierFeature =
  | "templates.premium"        // 5 premium PDF templates
  | "templates.maker"          // DIY template editor
  | "recurring.invoice"        // auto-generate recurring docs
  | "cloud.sync"               // multi-device Supabase sync
  | "ai.wa_import"             // cloud AI for WhatsApp chat parser
  | "watermark.remove"         // remove "Dibuat dengan doxpro" footer
  | "branding.custom_font"     // upload custom font
  | "branding.unlimited_color" // unrestricted color palette
  | "reminder.auto_email"      // scheduled email reminder for overdue
  | "backup.cloud_auto"        // automatic encrypted cloud backup
  | "team.mode"                // team workspace (Pro Team only)
  | "team.audit_log"           // view audit log (Pro Team only)
  | "support.priority";        // priority support channel

const TIER_FEATURES: Record<LicenseTier, TierFeature[]> = {
  free: [],
  pro_personal: [
    "templates.premium",
    "templates.maker",
    "recurring.invoice",
    "cloud.sync",
    "ai.wa_import",
    "watermark.remove",
    "branding.custom_font",
    "branding.unlimited_color",
    "reminder.auto_email",
    "backup.cloud_auto",
    "support.priority",
  ],
  pro_team: [
    "templates.premium",
    "templates.maker",
    "recurring.invoice",
    "cloud.sync",
    "ai.wa_import",
    "watermark.remove",
    "branding.custom_font",
    "branding.unlimited_color",
    "reminder.auto_email",
    "backup.cloud_auto",
    "team.mode",
    "team.audit_log",
    "support.priority",
  ],
  lifetime: [
    "templates.premium",
    "templates.maker",
    "recurring.invoice",
    "cloud.sync",
    "ai.wa_import",
    "watermark.remove",
    "branding.custom_font",
    "branding.unlimited_color",
    "reminder.auto_email",
    "backup.cloud_auto",
    "support.priority",
  ],
};

export function hasFeature(tier: LicenseTier, feature: TierFeature): boolean {
  return TIER_FEATURES[tier]?.includes(feature) ?? false;
}

export function isPro(tier: LicenseTier): boolean {
  return tier !== "free";
}

/**
 * Combined check: can the current role perform an action that also requires
 * a paid tier feature? Both must be true.
 */
export function canUseFeature(
  role: UserRole,
  tier: LicenseTier,
  permission: Permission,
  feature: TierFeature,
): boolean {
  return can(role, permission) && hasFeature(tier, feature);
}
