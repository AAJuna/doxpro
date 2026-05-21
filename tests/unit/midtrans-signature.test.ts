import { describe, it, expect } from "vitest";
import { verifyMidtransSignature } from "@/lib/payment/midtrans-signature";

const serverKey = "SB-Mid-server-EXAMPLE_KEY_12345";

async function computeExpected(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-512", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

describe("verifyMidtransSignature", () => {
  it("returns true for valid signature", async () => {
    const orderId = "order-001";
    const statusCode = "200";
    const grossAmount = "39000.00";
    const sigKey = await computeExpected(orderId + statusCode + grossAmount + serverKey);
    const ok = await verifyMidtransSignature(
      {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: sigKey,
      },
      serverKey,
    );
    expect(ok).toBe(true);
  });

  it("returns false for tampered amount", async () => {
    const orderId = "order-002";
    const statusCode = "200";
    const grossAmount = "39000.00";
    const sigKey = await computeExpected(orderId + statusCode + grossAmount + serverKey);
    const ok = await verifyMidtransSignature(
      {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: "1.00",
        signature_key: sigKey,
      },
      serverKey,
    );
    expect(ok).toBe(false);
  });

  it("returns false for missing signature", async () => {
    const ok = await verifyMidtransSignature(
      {
        order_id: "x",
        status_code: "200",
        gross_amount: "1",
        signature_key: "",
      },
      serverKey,
    );
    expect(ok).toBe(false);
  });

  it("returns false for wrong server key", async () => {
    const orderId = "order-003";
    const statusCode = "200";
    const grossAmount = "39000.00";
    const sigKey = await computeExpected(orderId + statusCode + grossAmount + serverKey);
    const ok = await verifyMidtransSignature(
      {
        order_id: orderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: sigKey,
      },
      "DIFFERENT-server-key",
    );
    expect(ok).toBe(false);
  });
});
