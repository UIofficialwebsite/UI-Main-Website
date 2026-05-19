// Shared coupon validation + price computation.
// Used by validate-coupon, list-eligible-coupons, and create-cashfree-order.
// Single source of truth: never duplicate the rule order across functions.

// deno-lint-ignore-file no-explicit-any
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export type Coupon = {
  id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  max_total_uses: number | null;
  max_uses_per_user: number;
  current_uses: number;
  applicable_course_ids: string[] | null;
  applicable_batch_ids: string[] | null;
  applicable_user_ids: string[] | null;
  user_segment: "new" | "returning" | "prev_enrolled" | null;
  min_prev_enrollments: number | null;
  prev_enrolled_within_days: number | null;
  visibility: "public" | "private" | "auto_suggest";
  is_auto_applied: boolean;
  display_label: string | null;
  display_priority: number;
  is_active: boolean;
  is_first_purchase_only: boolean;
  stackable: boolean;
};

export type ValidationOk = {
  valid: true;
  coupon: Coupon;
  discountAmount: number;
  finalAmount: number;
};

export type ValidationFail = {
  valid: false;
  reason: string;
};

export type ValidationResult = ValidationOk | ValidationFail;

export function makeSupabaseClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Authoritative price for a course + selected add-ons.
// Never trust amounts coming from the client.
export async function computeServerCartTotal(
  supabase: SupabaseClient,
  courseId: string,
  selectedAddonIds: string[],
): Promise<{ basePrice: number; addons: { id: string; subject_name: string; price: number }[]; total: number }> {
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("price, discounted_price")
    .eq("id", courseId)
    .single();
  if (courseErr) throw new Error(`Course lookup failed: ${courseErr.message}`);

  const basePrice = Number(course?.discounted_price ?? course?.price ?? 0);

  const uniqueAddonIds = Array.from(new Set(selectedAddonIds ?? []));
  let addons: { id: string; subject_name: string; price: number }[] = [];
  if (uniqueAddonIds.length > 0) {
    const { data, error } = await supabase
      .from("course_addons")
      .select("id, subject_name, price")
      .eq("course_id", courseId)
      .in("id", uniqueAddonIds);
    if (error) throw new Error(`Addon lookup failed: ${error.message}`);
    addons = (data ?? []).map((a: any) => ({
      id: a.id,
      subject_name: a.subject_name,
      price: Number(a.price ?? 0),
    }));
  }

  const addonsTotal = addons.reduce((sum, a) => sum + a.price, 0);
  return { basePrice, addons, total: round2(basePrice + addonsTotal) };
}

export async function fetchCouponByCode(
  supabase: SupabaseClient,
  code: string,
): Promise<Coupon | null> {
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .ilike("code", code.trim())
    .maybeSingle();
  return (data as Coupon) ?? null;
}

// Run rules in the order documented in the plan.
// Returns finalAmount and discountAmount on success; a human reason on failure.
export async function evaluateCoupon(
  supabase: SupabaseClient,
  coupon: Coupon | null,
  ctx: { userId: string | null; courseId: string; cartAmount: number },
): Promise<ValidationResult> {
  if (!coupon) {
    return { valid: false, reason: "This code isn't valid." };
  }
  if (!coupon.is_active) {
    return { valid: false, reason: "This offer is no longer available." };
  }

  const now = new Date();
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return {
      valid: false,
      reason: `This offer starts on ${new Date(coupon.valid_from).toLocaleDateString()}.`,
    };
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return { valid: false, reason: "This offer has ended." };
  }

  if (ctx.cartAmount < (coupon.min_order_amount ?? 0)) {
    const diff = round2((coupon.min_order_amount ?? 0) - ctx.cartAmount);
    return { valid: false, reason: `Add ₹${diff} more to unlock this offer.` };
  }

  if (
    coupon.applicable_course_ids &&
    coupon.applicable_course_ids.length > 0 &&
    !coupon.applicable_course_ids.includes(ctx.courseId)
  ) {
    return { valid: false, reason: "This offer doesn't apply to this course." };
  }

  // User-targeted rules require an authenticated user.
  if (
    coupon.applicable_user_ids &&
    coupon.applicable_user_ids.length > 0
  ) {
    if (!ctx.userId || !coupon.applicable_user_ids.includes(ctx.userId)) {
      return { valid: false, reason: "This code isn't valid for this account." };
    }
  }

  if (coupon.is_first_purchase_only && ctx.userId) {
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId)
      .in("status", ["active", "paid", "success"]);
    if ((count ?? 0) > 0) {
      return { valid: false, reason: "This offer is for first-time students only." };
    }
  }

  if (coupon.user_segment === "prev_enrolled" && ctx.userId) {
    let q = supabase
      .from("enrollments")
      .select("id, created_at", { count: "exact" })
      .eq("user_id", ctx.userId)
      .in("status", ["active", "paid", "success"]);
    if (coupon.prev_enrolled_within_days) {
      const cutoff = new Date(Date.now() - coupon.prev_enrolled_within_days * 86400000).toISOString();
      q = q.gte("created_at", cutoff);
    }
    const { count } = await q;
    const need = coupon.min_prev_enrollments ?? 1;
    if ((count ?? 0) < need) {
      return {
        valid: false,
        reason: "This offer is for returning students. Enroll in any batch to unlock it next time!",
      };
    }
  } else if (coupon.user_segment === "prev_enrolled" && !ctx.userId) {
    return { valid: false, reason: "Sign in to check eligibility for this offer." };
  }

  if (coupon.user_segment === "new" && ctx.userId) {
    const { count } = await supabase
      .from("enrollments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.userId)
      .in("status", ["active", "paid", "success"]);
    if ((count ?? 0) > 0) {
      return { valid: false, reason: "This offer is for new students only." };
    }
  }

  if (ctx.userId) {
    const { count } = await supabase
      .from("coupon_redemptions")
      .select("id", { count: "exact", head: true })
      .eq("coupon_id", coupon.id)
      .eq("user_id", ctx.userId);
    if ((count ?? 0) >= (coupon.max_uses_per_user ?? 1)) {
      return { valid: false, reason: "You've already used this offer." };
    }
  }

  if (coupon.max_total_uses !== null && coupon.current_uses >= coupon.max_total_uses) {
    return { valid: false, reason: "This offer is fully claimed." };
  }

  // All rules passed — compute discount
  let discount = 0;
  if (coupon.discount_type === "percent") {
    discount = (ctx.cartAmount * coupon.discount_value) / 100;
    if (coupon.max_discount !== null) {
      discount = Math.min(discount, coupon.max_discount);
    }
  } else {
    discount = coupon.discount_value;
  }
  discount = round2(Math.min(discount, ctx.cartAmount));
  const finalAmount = round2(ctx.cartAmount - discount);

  return { valid: true, coupon, discountAmount: discount, finalAmount };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export async function getAuthedUserId(
  supabase: SupabaseClient,
  authHeader: string | null,
): Promise<string | null> {
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const { data } = await supabase.auth.getUser(token);
  return data.user?.id ?? null;
}
