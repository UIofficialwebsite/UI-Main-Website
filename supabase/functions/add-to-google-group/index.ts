import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GOOGLE_GROUP_EMAIL = "alldatastudents@unknowniitians.com";

// Base64url encode
function base64url(input: Uint8Array): string {
  let str = "";
  for (const byte of input) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlEncodeString(str: string): string {
  return base64url(new TextEncoder().encode(str));
}

// Import PEM private key for signing
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// Create a signed JWT for Google OAuth2
async function createSignedJWT(
  serviceAccountEmail: string,
  privateKey: string,
  adminEmail: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccountEmail,
    sub: adminEmail,
    scope: "https://www.googleapis.com/auth/admin.directory.group.member",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64urlEncodeString(JSON.stringify(header));
  const encodedPayload = base64urlEncodeString(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );

  const encodedSignature = base64url(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

// Exchange JWT for Google access token
async function getAccessToken(
  serviceAccountEmail: string,
  privateKey: string,
  adminEmail: string
): Promise<string> {
  const jwt = await createSignedJWT(serviceAccountEmail, privateKey, adminEmail);

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Token exchange failed:", JSON.stringify(data));
    throw new Error(`Token exchange failed: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

// Add member to Google Group
async function addMemberToGroup(
  accessToken: string,
  groupEmail: string,
  memberEmail: string
): Promise<{ success: boolean; message: string }> {
  const url = `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(groupEmail)}/members`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: memberEmail,
      role: "MEMBER",
    }),
  });

  const data = await response.json();

  if (response.ok) {
    return { success: true, message: `Added ${memberEmail} to ${groupEmail}` };
  }

  // Already a member - not an error
  if (response.status === 409) {
    return { success: true, message: `${memberEmail} is already a member of ${groupEmail}` };
  }

  console.error("Failed to add member:", JSON.stringify(data));
  return {
    success: false,
    message: `Failed to add ${memberEmail}: ${data.error?.message || "Unknown error"}`,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SERVICE_ACCOUNT_EMAIL = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_EMAIL");
    const PRIVATE_KEY = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
    const ADMIN_EMAIL = Deno.env.get("GOOGLE_ADMIN_EMAIL");

    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !ADMIN_EMAIL) {
      throw new Error("Missing Google service account secrets");
    }

    // Parse webhook payload from Supabase database webhook
    const body = await req.json();
    console.log("Webhook payload type:", body.type);

    // The webhook sends { type: "INSERT", table: "profiles", record: {...}, ... }
    const record = body.record;
    if (!record?.email) {
      console.log("No email in record, skipping. Record:", JSON.stringify(record));
      return new Response(
        JSON.stringify({ success: false, message: "No email found in profile record" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userEmail = record.email;
    console.log(`Adding ${userEmail} to Google Group ${GOOGLE_GROUP_EMAIL}`);

    // Get Google access token
    const accessToken = await getAccessToken(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY, ADMIN_EMAIL);

    // Add member to group
    const result = await addMemberToGroup(accessToken, GOOGLE_GROUP_EMAIL, userEmail);
    console.log("Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Edge function error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
