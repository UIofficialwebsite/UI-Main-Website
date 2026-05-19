// Cashfree webhook signature verification.
// Algorithm: base64(HMAC_SHA256(timestamp + rawBody, secret))
// Compared in constant time against the x-webhook-signature header.

async function hmacSha256Base64(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyCashfreeSignature(
  rawBody: string,
  timestamp: string,
  receivedSignature: string,
  secret: string,
): Promise<boolean> {
  if (!rawBody || !timestamp || !receivedSignature || !secret) return false;
  try {
    const expected = await hmacSha256Base64(secret, timestamp + rawBody);
    return timingSafeEqual(expected, receivedSignature);
  } catch {
    return false;
  }
}
