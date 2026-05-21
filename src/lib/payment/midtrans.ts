import { getSupabase } from "@/lib/sync/supabase";
import type {
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  SnapResult,
} from "./types";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: SnapCallbacks) => void;
    };
  }
}

interface SnapCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

let snapScriptPromise: Promise<void> | null = null;

export function isPaymentConfigured(): boolean {
  return !!import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
}

/**
 * Lazy-load Snap.js. Only fetched when a paid flow starts, so free users
 * never download it.
 */
function loadSnapScript(): Promise<void> {
  if (snapScriptPromise) return snapScriptPromise;
  const url = import.meta.env.VITE_MIDTRANS_SNAP_URL;
  const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
  if (!url || !clientKey) {
    return Promise.reject(new Error("Midtrans Snap belum dikonfigurasi"));
  }

  snapScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.setAttribute("data-client-key", clientKey);
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      snapScriptPromise = null;
      reject(new Error("Gagal load Snap.js"));
    };
    document.head.appendChild(script);
  });
  return snapScriptPromise;
}

export async function createSubscription(
  req: CreateSubscriptionRequest,
): Promise<CreateSubscriptionResponse> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, error: "Cloud belum dikonfigurasi" };
  }
  const { data, error } = await supabase.functions.invoke<CreateSubscriptionResponse>(
    "create-subscription",
    { body: req },
  );
  if (error) return { ok: false, error: error.message };
  return data ?? { ok: false, error: "Empty response" };
}

export async function startUpgradeFlow(
  req: CreateSubscriptionRequest,
): Promise<SnapResult> {
  if (!isPaymentConfigured()) {
    return { status: "error", message: "Payment belum dikonfigurasi" };
  }

  const created = await createSubscription(req);
  if (!created.ok || !created.snapToken) {
    return { status: "error", message: created.error ?? "Gagal create transaction" };
  }

  await loadSnapScript();
  if (!window.snap) {
    return { status: "error", message: "Snap.js tidak ter-load" };
  }

  return new Promise<SnapResult>((resolve) => {
    window.snap!.pay(created.snapToken!, {
      onSuccess: (r) =>
        resolve({
          status: "success",
          orderId: created.orderId,
          transactionStatus: (r as { transaction_status?: string })?.transaction_status as never,
        }),
      onPending: (r) =>
        resolve({
          status: "pending",
          orderId: created.orderId,
          transactionStatus: (r as { transaction_status?: string })?.transaction_status as never,
        }),
      onError: (r) =>
        resolve({
          status: "error",
          orderId: created.orderId,
          message: (r as { status_message?: string })?.status_message ?? "Payment error",
        }),
      onClose: () =>
        resolve({
          status: "closed",
          orderId: created.orderId,
          message: "Dialog ditutup tanpa selesai bayar",
        }),
    });
  });
}
