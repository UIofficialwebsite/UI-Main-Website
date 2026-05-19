// list-eligible-coupons
// Returns the "Available Offers" list for the enrollment card.
// - public coupons: always returned. Eligible ones get { eligible: true }, others
//   get a reason so the UI can grey them out.
// - auto_suggest coupons: only returned when fully eligible.
// - private coupons: never returned.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  computeServerCartTotal,
  corsHeaders,
  Coupon,
  evaluateCoupon,
  getAuthedUserId,
  jsonResponse,
  makeSupabaseClient,
} from "../_shared/coupon-engine.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = makeSupabaseClient();
    const userId = await getAuthedUserId(supabase, req.headers.get("authorization"));
    const { courseId, selectedAddonIds } = await req.json();

    if (!courseId) {
      return jsonResponse({ offers: [] });
    }

    const { total } = await computeServerCartTotal(
      supabase,
      courseId,
      Array.isArray(selectedAddonIds) ? selectedAddonIds : [],
    );

    const { data: rows, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .in("visibility", ["public", "auto_suggest"])
      .order("display_priority", { ascending: false });

    if (error) {
      console.error("list-eligible-coupons fetch error:", error);
      return jsonResponse({ offers: [] });
    }

    const coupons = (rows ?? []) as Coupon[];
    const offers = [];
    for (const c of coupons) {
      const result = await evaluateCoupon(supabase, c, {
        userId,
        courseId,
        cartAmount: total,
      });

      if (result.valid) {
        offers.push({
          code: c.code,
          label: c.display_label,
          eligible: true,
          discountAmount: result.discountAmount,
          finalAmount: result.finalAmount,
          isAutoApplied: c.is_auto_applied,
          priority: c.display_priority,
        });
      } else if (c.visibility === "public") {
        // Show greyed-out so the user knows the offer exists.
        offers.push({
          code: c.code,
          label: c.display_label,
          eligible: false,
          ineligibilityReason: result.reason,
          priority: c.display_priority,
        });
      }
      // auto_suggest + ineligible: hidden entirely
    }

    // Eligible first, then ordered by saving size.
    offers.sort((a: any, b: any) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      const aSave = a.discountAmount ?? 0;
      const bSave = b.discountAmount ?? 0;
      return bSave - aSave;
    });

    return jsonResponse({ offers, cartAmount: total });
  } catch (err: any) {
    console.error("list-eligible-coupons error:", err);
    return jsonResponse({ offers: [] });
  }
});
