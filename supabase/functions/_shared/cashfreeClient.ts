// Single source of truth for Cashfree API config across edge functions.

export function getCashfreeEnv(): "production" | "sandbox" {
  return (Deno.env.get("CASHFREE_ENVIRONMENT") ?? "sandbox") === "production"
    ? "production"
    : "sandbox";
}

export function getCashfreeApiBase(): string {
  return getCashfreeEnv() === "production"
    ? "https://api.cashfree.com/pg"
    : "https://sandbox.cashfree.com/pg";
}

export function getCashfreeHeaders(): Record<string, string> {
  const key = Deno.env.get("CASHFREE_KEY");
  const secret = Deno.env.get("CASHFREE_SECRET");
  if (!key || !secret) {
    throw new Error("Cashfree credentials missing (CASHFREE_KEY / CASHFREE_SECRET)");
  }
  return {
    "x-client-id": key,
    "x-client-secret": secret,
    "x-api-version": "2023-08-01",
    "Content-Type": "application/json",
  };
}

export function getCashfreeWebhookSecret(): string {
  // Cashfree PG webhooks (API version 2023-08-01) are signed with the
  // merchant's API secret_key (the same x-secret-key shown on the API Keys
  // page). There is no separate webhook signing key for this version.
  //
  // Resolution order:
  //   1. CASHFREE_WEBHOOK_SECRET_{ENV}   — explicit override per env
  //   2. CASHFREE_WEBHOOK_SECRET         — single override for any env
  //   3. CASHFREE_SECRET                 — fallback (the API secret, Cashfree's default)
  const env = getCashfreeEnv();
  const envKey =
    env === "production"
      ? "CASHFREE_WEBHOOK_SECRET_PRODUCTION"
      : "CASHFREE_WEBHOOK_SECRET_SANDBOX";
  const value =
    Deno.env.get(envKey) ??
    Deno.env.get("CASHFREE_WEBHOOK_SECRET") ??
    Deno.env.get("CASHFREE_SECRET");
  if (!value) {
    throw new Error(
      `Missing webhook secret (${envKey}, CASHFREE_WEBHOOK_SECRET, or CASHFREE_SECRET)`,
    );
  }
  return value;
}

export async function fetchCashfreeOrder(orderId: string) {
  const resp = await fetch(`${getCashfreeApiBase()}/orders/${orderId}`, {
    headers: getCashfreeHeaders(),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Cashfree order fetch failed (${resp.status}): ${text}`);
  }
  return await resp.json();
}

export async function fetchCashfreePayments(orderId: string) {
  const resp = await fetch(`${getCashfreeApiBase()}/orders/${orderId}/payments`, {
    headers: getCashfreeHeaders(),
  });
  if (!resp.ok) return null;
  const arr = await resp.json();
  if (!Array.isArray(arr)) return null;
  return arr.find((p: any) => p.payment_status === "SUCCESS") ?? arr[0] ?? null;
}
