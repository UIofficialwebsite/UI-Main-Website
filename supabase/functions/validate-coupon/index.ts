// validate-coupon
// Returns { valid, discountAmount, finalAmount, reason } for a given code.
// Never returns the coupon row itself — that's privileged data.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  computeServerCartTotal,
  corsHeaders,
  evaluateCoupon,
  fetchCouponByCode,
  getAuthedUser,
  jsonResponse,
  makeSupabaseClient,
} from "../_shared/coupon-engine.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = makeSupabaseClient();
    const authed = await getAuthedUser(supabase, req.headers.get("authorization"));
    const userId = authed?.id ?? null;
    const userEmail = authed?.email ?? null;

    const { code, courseId, selectedAddonIds } = await req.json();

    if (!code || typeof code !== "string") {
      return jsonResponse({ valid: false, reason: "Please enter a coupon code." });
    }
    if (!courseId) {
      return jsonResponse({ valid: false, reason: "Missing course context." });
    }

    const { total } = await computeServerCartTotal(
      supabase,
      courseId,
      Array.isArray(selectedAddonIds) ? selectedAddonIds : [],
    );

    const coupon = await fetchCouponByCode(supabase, code);
    const result = await evaluateCoupon(supabase, coupon, {
      userId,
      userEmail,
      courseId,
      cartAmount: total,
    });

    if (!result.valid) {
      return jsonResponse({ valid: false, reason: result.reason });
    }

    return jsonResponse({
      valid: true,
      code: result.coupon.code,
      label: result.coupon.display_label,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      cartAmount: total,
    });
  } catch (err: any) {
    console.error("validate-coupon error:", err);
    return jsonResponse({ valid: false, reason: "Couldn't validate that code right now." }, 200);
  }
});
