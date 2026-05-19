// create-cashfree-order
// Security: amount is computed server-side from courses + course_addons.
// The client only sends courseId, selectedSubjects (addon ids), and an optional
// couponCode. The coupon is re-validated here — minutes can pass between
// "Apply" and "Pay", and the coupon may have hit its limit or expired.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  computeServerCartTotal,
  corsHeaders,
  evaluateCoupon,
  fetchCouponByCode,
  getUserEmailById,
  makeSupabaseClient,
} from "../_shared/coupon-engine.ts";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const envKey = Deno.env.get("CASHFREE_KEY");
    const envSecret = Deno.env.get("CASHFREE_SECRET");
    const cashfreeEnv = Deno.env.get("CASHFREE_ENVIRONMENT") ?? "sandbox";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";

    if (!envSecret || !envKey) throw new Error("Cashfree keys missing in Supabase Secrets");

    const origin = req.headers.get("origin") || "https://preview.lovable.app";

    const {
      courseId,
      selectedSubjects,
      userId,
      customerPhone,
      customerEmail,
      couponCode,
    } = await req.json();

    if (!courseId || !userId) {
      throw new Error("courseId and userId are required");
    }

    const orderId = `order_${Date.now()}_${userId}`;
    const verifyUrl = `${supabaseUrl}/functions/v1/verify-cashfree-payment?order_id=${orderId}&redirect_url=${encodeURIComponent(origin)}`;

    const supabase = makeSupabaseClient();

    // ---- Authoritative pricing (never trust the client) ----
    const addonIds: string[] = Array.isArray(selectedSubjects)
      ? Array.from(new Set(selectedSubjects))
      : [];
    const { basePrice, addons, total: cartAmount } = await computeServerCartTotal(
      supabase,
      courseId,
      addonIds,
    );

    // ---- Coupon re-validation ----
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    let discountAmount = 0;
    let finalAmount = cartAmount;

    if (couponCode && typeof couponCode === "string" && couponCode.trim().length > 0) {
      const coupon = await fetchCouponByCode(supabase, couponCode);
      // Email-targeted coupons (private/cohort codes) need the user's email.
      // Prefer customerEmail from the request, fall back to the auth lookup.
      const userEmail = (typeof customerEmail === "string" && customerEmail.includes("@"))
        ? customerEmail
        : await getUserEmailById(supabase, userId);
      const result = await evaluateCoupon(supabase, coupon, {
        userId,
        userEmail,
        courseId,
        cartAmount,
      });
      if (!result.valid) {
        return new Response(JSON.stringify({ error: `Coupon error: ${result.reason}` }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      appliedCouponId = result.coupon.id;
      appliedCouponCode = result.coupon.code;
      discountAmount = result.discountAmount;
      finalAmount = result.finalAmount;
    }

    if (finalAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "Order total is zero. Use the free-enrollment path instead." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ---- Customer + course names (display only) ----
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, student_name")
      .eq("id", userId)
      .single();
    const customerName = profile?.full_name || profile?.student_name || "Customer";

    const { data: course } = await supabase
      .from("courses")
      .select("title, subject")
      .eq("id", courseId)
      .single();
    const batchName = course?.title || "Unknown Batch";

    const mandatorySubjects: string[] = course?.subject
      ? course.subject.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];
    const addonNames = addons.map((a) => a.subject_name).filter(Boolean);
    const allSubjects = [...new Set([...mandatorySubjects, ...addonNames])];
    const coursesString = allSubjects.length > 0 ? allSubjects.join(", ") : "No subjects";

    // ---- Cashfree order ----
    const cashfreeResponse = await fetch(
      cashfreeEnv === "production"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-client-id": envKey,
          "x-client-secret": envSecret,
          "x-api-version": "2023-08-01",
        },
        body: JSON.stringify({
          order_id: orderId,
          order_amount: finalAmount,
          order_currency: "INR",
          customer_details: {
            customer_id: userId,
            customer_name: customerName,
            customer_phone: (() => {
              if (!customerPhone) return "";
              const cleaned = customerPhone.replace(/[\s\-\(\)]/g, "");
              if (cleaned.startsWith("+91") && cleaned.length === 13) return cleaned.slice(3);
              return cleaned.replace(/[^0-9+]/g, "");
            })(),
            customer_email: customerEmail || "",
          },
          order_meta: { return_url: verifyUrl },
          order_note: batchName,
          order_tags: {
            batch: batchName,
            courses: coursesString,
            user_id: userId,
            coupon_code: appliedCouponCode ?? "",
          },
        }),
      },
    );

    if (!cashfreeResponse.ok) {
      const errText = await cashfreeResponse.text();
      throw new Error(`Cashfree API Error: ${errText}`);
    }
    const orderData = await cashfreeResponse.json();

    // ---- Enrollment rows (upsert) ----
    // Split the coupon discount proportionally across base + addons so each
    // row's `amount` sums to finalAmount. Falls back to assigning everything
    // to the base row if cartAmount is zero (defensive).
    const discountRatio = cartAmount > 0 ? discountAmount / cartAmount : 0;
    const round2 = (n: number) => Math.round(n * 100) / 100;

    const upsertRows: any[] = [];

    upsertRows.push({
      user_id: userId,
      course_id: courseId,
      order_id: orderId,
      status: "pending",
      amount: round2(basePrice - basePrice * discountRatio),
      subject_name: null,
      coupon_id: appliedCouponId,
      coupon_code: appliedCouponCode,
      discount_amount: round2(basePrice * discountRatio),
    });

    addons.forEach((addon) => {
      upsertRows.push({
        user_id: userId,
        course_id: courseId,
        order_id: orderId,
        status: "pending",
        amount: round2(addon.price - addon.price * discountRatio),
        subject_name: addon.subject_name,
        coupon_id: appliedCouponId,
        coupon_code: appliedCouponCode,
        discount_amount: round2(addon.price * discountRatio),
      });
    });

    if (upsertRows.length > 0) {
      const { error: dbError } = await supabase
        .from("enrollments")
        .upsert(upsertRows, {
          onConflict: "user_id,course_id,subject_name",
          ignoreDuplicates: false,
        });
      if (dbError) throw new Error(`DB Error: ${dbError.message}`);
    }

    return new Response(
      JSON.stringify({
        ...orderData,
        environment: cashfreeEnv,
        verifyUrl,
        serverComputedAmount: finalAmount,
        discountAmount,
        couponCode: appliedCouponCode,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("FULL ERROR DETAILS:", error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
