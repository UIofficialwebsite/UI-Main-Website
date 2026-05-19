// ============================================================
// processPaymentEvent — single source of truth for paid orders
// ============================================================
// Called by: cashfree-webhook (primary), verify-cashfree-payment (UX return),
//            reconcile-payments (cron safety net).
//
// Contract:
//   - Idempotent. Safe to call any number of times for the same orderId.
//   - Never downgrades a 'success' payment. Once success, always success.
//   - Never touches free enrollments (those have payment_id = 'free_enrollment'
//     and use a 'free_*' order_id that does not exist in Cashfree).
//   - Returns a discriminated union describing what happened.
//   - Email send failure does NOT throw — payment is already recorded.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { fetchCashfreeOrder, fetchCashfreePayments } from "./cashfreeClient.ts";

export type ProcessResult =
  | { result: "already_processed"; finalStatus: "success" | "failed" }
  | { result: "still_pending"; cashfreeStatus: string }
  | { result: "processed"; finalStatus: "success" | "failed"; emailSent: boolean }
  | { result: "skipped"; reason: string };

type Source = "webhook" | "return_url" | "cron";

function getSupabase(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("Supabase credentials missing");
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function processPaymentEvent(
  orderId: string,
  source: Source,
): Promise<ProcessResult> {
  if (!orderId) return { result: "skipped", reason: "missing_order_id" };

  // Free enrollments use a synthetic order_id like 'free_<ts>_<uid>' — never query Cashfree.
  if (orderId.startsWith("free_")) {
    return { result: "skipped", reason: "free_enrollment" };
  }

  const supabase = getSupabase();

  // 1. Short-circuit if already terminally processed.
  const { data: existing } = await supabase
    .from("payments")
    .select("status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing && existing.status === "success") {
    return { result: "already_processed", finalStatus: "success" };
  }

  // 2. Fetch authoritative state from Cashfree.
  let orderData: any;
  let paymentDetails: any = null;
  try {
    orderData = await fetchCashfreeOrder(orderId);
    paymentDetails = await fetchCashfreePayments(orderId);
  } catch (err: any) {
    console.error(`[processPaymentEvent:${source}] cashfree fetch failed for ${orderId}:`, err.message);
    throw err;
  }

  // 3. Map Cashfree status. Only act on terminal states.
  const cashfreeStatus: string = orderData?.order_status ?? "UNKNOWN";
  let finalStatus: "success" | "failed";
  if (cashfreeStatus === "PAID") {
    finalStatus = "success";
  } else if (cashfreeStatus === "EXPIRED") {
    finalStatus = "failed";
  } else {
    // ACTIVE or anything else — payment in flight. Do not modify DB.
    return { result: "still_pending", cashfreeStatus };
  }

  // 4. Build payment row (mirrors current verify-cashfree-payment output exactly).
  const userId = orderData?.customer_details?.customer_id ?? null;

  // Load enrollment + course info for batch/courses denormalization.
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("subject_name, course_id, courses ( title, subject )")
    .eq("order_id", orderId);

  let mainBatchName = "Unknown Batch";
  let mandatorySubjects: string[] = [];
  let addonSubjectNames: string[] = [];

  if (enrollments && enrollments.length > 0) {
    const courseData = enrollments[0]?.courses as unknown as
      | { title?: string; subject?: string }
      | null;
    mainBatchName = courseData?.title || "Unknown Batch";
    if (courseData?.subject) {
      mandatorySubjects = courseData.subject
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    }
    addonSubjectNames = enrollments
      .map((e) => e.subject_name)
      .filter(Boolean) as string[];
  }

  // Resolve UUID-form addon names to display names.
  let resolvedAddonNames: string[] = [];
  if (addonSubjectNames.length > 0) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const addonIds = addonSubjectNames.filter((s) => uuidPattern.test(s));
    if (addonIds.length > 0) {
      const { data: addons } = await supabase
        .from("course_addons")
        .select("id, subject_name")
        .in("id", addonIds);
      const addonMap = new Map(addons?.map((a) => [a.id, a.subject_name]) || []);
      resolvedAddonNames = addonSubjectNames.map((s) => addonMap.get(s) || s);
    } else {
      resolvedAddonNames = addonSubjectNames;
    }
  }

  const uniqueSubjects = [
    ...new Set([...mandatorySubjects, ...resolvedAddonNames]),
  ].filter(Boolean);
  const coursesString =
    uniqueSubjects.length > 0 ? uniqueSubjects.join(", ") : "No subjects";

  // UTR extraction (same logic as before).
  let utr: string | null = null;
  if (paymentDetails?.payment_method) {
    const pm = paymentDetails.payment_method;
    utr =
      pm.upi?.utr ||
      pm.netbanking?.bank_reference ||
      pm.card?.bank_reference ||
      paymentDetails.bank_reference ||
      null;
  }

  // Discount detection (same logic as before).
  let discountApplied = false;
  let discountType: string | null = null;
  let discountValue: number | null = null;
  let couponCode: string | null = null;
  let netAmount: number = orderData.order_amount;

  const offers = paymentDetails?.payment_offers || paymentDetails?.offers || [];
  if (Array.isArray(offers) && offers.length > 0) {
    const o = offers[0];
    discountApplied = true;
    discountType = o.offer_type || o.discount_type || "flat";
    discountValue =
      o.discount_amount || o.cashback_amount || o.offer_amount || 0;
    couponCode = o.offer_id || o.promo_code || o.offer_code || null;
    netAmount = paymentDetails?.payment_amount || orderData.order_amount;
  }

  if (!discountApplied && orderData.order_splits) {
    const ds = orderData.order_splits.find(
      (s: any) => s.split_type === "discount",
    );
    if (ds) {
      discountApplied = true;
      discountType = "flat";
      discountValue = ds.amount || 0;
      netAmount = orderData.order_amount - (discountValue || 0);
    }
  }

  if (
    !discountApplied &&
    paymentDetails?.payment_amount &&
    paymentDetails.payment_amount < orderData.order_amount
  ) {
    discountApplied = true;
    discountType = "flat";
    discountValue = orderData.order_amount - paymentDetails.payment_amount;
    netAmount = paymentDetails.payment_amount;
  }

  if (!discountApplied) netAmount = orderData.order_amount;

  // 5. Upsert payments row (idempotent thanks to unique index on order_id).
  //    Only insert payments row when finalStatus is 'success' — preserves
  //    current behavior where failed payments do not create a payments row.
  let emailSent = false;
  let didCreatePaymentRow = false;

  if (finalStatus === "success") {
    const paymentRow = {
      order_id: orderId,
      payment_id:
        paymentDetails?.cf_payment_id?.toString() ||
        orderData.cf_order_id ||
        null,
      user_id: userId,
      amount: orderData.order_amount,
      status: "success",
      payment_mode:
        paymentDetails?.payment_group ||
        paymentDetails?.payment_method?.type ||
        "unknown",
      payment_time:
        paymentDetails?.payment_time ||
        paymentDetails?.payment_completion_time ||
        null,
      payment_group: paymentDetails?.payment_group || null,
      utr,
      customer_email: orderData.customer_details?.customer_email || null,
      customer_phone: orderData.customer_details?.customer_phone || null,
      raw_response: { order: orderData, payment: paymentDetails, source },
      batch: mainBatchName,
      courses: coursesString,
      discount_applied: discountApplied,
      discount_type: discountApplied ? discountType : null,
      discount_value: discountApplied ? discountValue : null,
      coupon_code: couponCode,
      net_amount: netAmount,
    };

    const { error: upsertErr, data: upsertData } = await supabase
      .from("payments")
      .upsert(paymentRow, { onConflict: "order_id", ignoreDuplicates: false })
      .select("id, created_at");

    if (upsertErr) {
      console.error(`[processPaymentEvent:${source}] payment upsert error:`, upsertErr.message);
      throw upsertErr;
    }

    // Email sent only on FIRST success — detect by comparing row age to now.
    // (If created_at is within last 60s, treat as new — covers the upsert-as-insert case.)
    if (upsertData?.[0]?.created_at) {
      const createdAt = new Date(upsertData[0].created_at).getTime();
      didCreatePaymentRow = Date.now() - createdAt < 60_000;
    }

    if (didCreatePaymentRow && paymentRow.customer_email) {
      emailSent = await sendConfirmationEmail({
        to: paymentRow.customer_email,
        batchName: mainBatchName,
        courses: coursesString,
        netAmount,
      });
    }
  }

  // 6. Update enrollments rows for this order (status + payment_id).
  const enrollmentPaymentId =
    paymentDetails?.cf_payment_id?.toString() || orderData.cf_order_id || null;
  const { error: enrollUpdateErr } = await supabase
    .from("enrollments")
    .update({ status: finalStatus, payment_id: enrollmentPaymentId })
    .eq("order_id", orderId);

  if (enrollUpdateErr) {
    console.error(`[processPaymentEvent:${source}] enrollments update error:`, enrollUpdateErr.message);
    // Do not throw — payment row is already correct. Cron will catch any drift.
  }

  return { result: "processed", finalStatus, emailSent };
}

async function sendConfirmationEmail(args: {
  to: string;
  batchName: string;
  courses: string;
  netAmount: number;
}): Promise<boolean> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set, skipping");
    return false;
  }
  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "Unknown IITians <desk@unknowniitians.com>",
      to: [args.to],
      subject: `Enrollment Confirmed: ${args.batchName}`,
      html: enrollmentEmailHtml(args),
    });
    if (error) {
      console.error("[email] resend error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] send failed:", err);
    return false;
  }
}

function enrollmentEmailHtml(args: {
  to: string;
  batchName: string;
  courses: string;
  netAmount: number;
}): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #1E3A8A;">Welcome to ${args.batchName}!</h1>
      <p>Hello,</p>
      <p><strong>Congratulations!</strong> Your enrollment has been confirmed.</p>
      <h2 style="color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Enrollment Details</h2>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr><td style="padding: 8px 0; font-weight: bold;">Batch:</td><td style="padding: 8px 0;">${args.batchName}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Subjects:</td><td style="padding: 8px 0;">${args.courses}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td><td style="padding: 8px 0;">₹${args.netAmount}</td></tr>
        <tr><td style="padding: 8px 0; font-weight: bold;">Registered Email:</td><td style="padding: 8px 0;">${args.to}</td></tr>
      </table>
      <h2 style="color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">How to Access Your Classes</h2>
      <p>You can join your classes through the <strong>Student Service Portal</strong>. Get recordings, notes, and connect with teachers and admin through the portal. Your class batch group is also available there.</p>
      <p style="background-color: #FEF3C7; padding: 12px; border-radius: 6px;">
        <strong>⚠️ Important:</strong> Only login through your registered email mentioned above.
      </p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="https://ssp.unknowniitians.com" style="background-color: #1E3A8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Portal</a>
      </p>
      <p>If you have any questions, please contact our support team.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="color: #6B7280; font-size: 12px; text-align: center;">This is a computer generated email</p>
    </div>
  `;
}
