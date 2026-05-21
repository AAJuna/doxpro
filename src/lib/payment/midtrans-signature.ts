export interface MidtransWebhookSubset {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}

export async function verifyMidtransSignature(
  payload: MidtransWebhookSubset,
  serverKey: string,
): Promise<boolean> {
  if (!payload.signature_key) return false;
  const input = payload.order_id + payload.status_code + payload.gross_amount + serverKey;
  const data = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-512", data);
  const expected = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return timingSafeEqual(expected, payload.signature_key.toLowerCase());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
