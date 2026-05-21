import type { LicenseTier } from "@/types";

export interface PricingPlan {
  id: LicenseTier;
  name: string;
  priceMonthly: number;
  priceYearly?: number;
  description: string;
  features: string[];
  highlight: boolean;
}

export interface CreateSubscriptionRequest {
  tier: Extract<LicenseTier, "pro_personal" | "pro_team">;
  billing: "monthly" | "yearly";
}

export interface CreateSubscriptionResponse {
  ok: boolean;
  snapToken?: string;
  redirectUrl?: string;
  orderId?: string;
  error?: string;
}

export type TransactionStatus =
  | "pending"
  | "settlement"
  | "capture"
  | "deny"
  | "cancel"
  | "expire"
  | "failure";

export interface SnapResult {
  status: "success" | "pending" | "error" | "closed";
  orderId?: string;
  transactionStatus?: TransactionStatus;
  message?: string;
}
