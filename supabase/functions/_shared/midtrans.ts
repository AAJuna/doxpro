export { verifyMidtransSignature } from "../../../src/lib/payment/midtrans-signature.ts";
export type { MidtransWebhookSubset } from "../../../src/lib/payment/midtrans-signature.ts";

export function midtransApiBase(isProduction: boolean): string {
  return isProduction
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
}

export function snapApiBase(isProduction: boolean): string {
  return isProduction
    ? "https://app.midtrans.com/snap/v1"
    : "https://app.sandbox.midtrans.com/snap/v1";
}

export function basicAuthHeader(serverKey: string): string {
  const token = btoa(`${serverKey}:`);
  return `Basic ${token}`;
}
