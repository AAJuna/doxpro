import type { PricingPlan } from "./types";

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    description: "Solo UMKM, freelancer, warung",
    highlight: false,
    features: [
      "4 template basic",
      "Klien & produk unlimited",
      "Export PDF",
      "Local storage (1 device)",
      "Footer 'Dibuat dengan doxpro'",
    ],
  },
  {
    id: "pro_personal",
    name: "Pro Personal",
    priceMonthly: 39000,
    priceYearly: 349000,
    description: "Untuk solo entrepreneur yang growing",
    highlight: true,
    features: [
      "Semua fitur Free",
      "5 premium templates",
      "Cloud sync multi-device",
      "Recurring invoice auto",
      "AI WhatsApp → Invoice",
      "Hilangkan watermark footer",
      "Auto reminder pembayaran",
      "Cloud backup encrypted",
    ],
  },
  {
    id: "pro_team",
    name: "Pro Team",
    priceMonthly: 89000,
    description: "Tim kecil 3-20 orang, +Rp 25k/seat (3 seat included)",
    highlight: false,
    features: [
      "Semua fitur Pro Personal",
      "Multi-user team mode",
      "Role admin & member",
      "Email notif admin",
      "Audit log lengkap",
    ],
  },
];

export const LIFETIME_DEAL = {
  name: "Lifetime Deal (Launch)",
  price: 599000,
  description: "Pro Personal lifetime, no recurring. Cap 500 user.",
};
