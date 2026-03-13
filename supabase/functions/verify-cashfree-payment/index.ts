import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const orderId = url.searchParams.get("order_id");
  const passedRedirectUrl = url.searchParams.get("redirect_url");
  const frontendUrl = passedRedirectUrl ? decodeURIComponent(passedRedirectUrl) : "https://preview.lovable.app";

  try {
    // 1. Validate Secrets & Setup Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const cashfreeKey = Deno.env.get("CASHFREE_KEY");
    const cashfreeSecret = Deno.env.get("CASHFREE_SECRET");

    if (!supabaseUrl || !supabaseKey || !cashfreeKey || !cashfreeSecret) {
      console.error("❌ Critical: Missing API Keys in Secrets");
      return new Response(null, { status: 302, headers: { Location: `${frontendUrl}/dashboard?payment=error` } });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    if (!orderId) {
      console.error("❌ Missing Order ID");
      return new Response(null, { status: 302, headers: { Location: `${frontendUrl}/dashboard?payment=error` } });
    }

    // 2. Get Cashfree API URL based on environment
    const cashfreeEnv = Deno.env.get("CASHFREE_ENVIRONMENT") ?? "sandbox";
    const cashfreeApiUrl = cashfreeEnv === "production" 
      ? "https://api.cashfree.com/pg/orders" 
      : "https://sandbox.cashfree.com/pg/orders";

    const cashfreeHeaders = {
      "x-client-id": cashfreeKey,
      "x-client-secret": cashfreeSecret,
      "x-api-version": "2023-08-01"
    };

    // 3. Fetch Order Status from Cashfree
    const orderResp = await fetch(`${cashfreeApiUrl}/${orderId}`, { headers: cashfreeHeaders });
    if (!orderResp.ok) {
      console.error("❌ Cashfree Order Fetch Failed:", orderResp.status);
      return new Response(null, { status: 302, headers: { Location: `${frontendUrl}/dashboard?payment=error` } });
    }
    const orderData = await orderResp.json();
    console.log("📦 Order Data:", JSON.stringify(orderData));

    // 4. Fetch Payment Details from Cashfree (for UTR, payment_mode, payment_time)
    let paymentDetails: any = null;
    try {
      const paymentsResp = await fetch(`${cashfreeApiUrl}/${orderId}/payments`, { headers: cashfreeHeaders });
      if (paymentsResp.ok) {
        const paymentsArray = await paymentsResp.json();
        // Get the successful payment or the latest one
        paymentDetails = paymentsArray?.find((p: any) => p.payment_status === "SUCCESS") || paymentsArray?.[0];
        console.log("💳 Payment Details:", JSON.stringify(paymentDetails));
      }
    } catch (err) {
      console.warn("⚠️ Could not fetch payment details:", err);
    }

    // 5. Determine final status
    const finalStatus = orderData.order_status === "PAID" ? "success" : "failed";
    const userId = orderData.customer_details?.customer_id;

    // 6. Fetch Enrollment Details
    const { data: enrollments, error: fetchError } = await supabase
      .from("enrollments")
      .select(`
        subject_name,
        course_id,
        courses ( title, subject )
      `)
      .eq("order_id", orderId);

    if (fetchError) console.error("⚠️ Enrollment Fetch Error:", fetchError);

    // 7. Process Course and Addon Names + Mandatory Subjects
    let mainBatchName = "Unknown Batch";
    let mandatorySubjects: string[] = [];
    let addonSubjectNames: string[] = [];

    if (enrollments && enrollments.length > 0) {
      // Get the first enrollment's course data - handle Supabase join type
      const firstEnrollment = enrollments[0];
      const courseData = firstEnrollment?.courses as unknown as { title?: string; subject?: string } | null;
      
      // Extract batch name from course title
      mainBatchName = courseData?.title || "Unknown Batch";
      
      // Extract mandatory subjects from course.subject column (comma-separated)
      if (courseData?.subject) {
        mandatorySubjects = courseData.subject
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      // Collect all subject_name values from enrollments (these could be addon names or IDs)
      addonSubjectNames = enrollments
        .map(e => e.subject_name)
        .filter(Boolean) as string[];
    }

    // Resolve addon names if they are UUIDs
    let resolvedAddonNames: string[] = [];
    if (addonSubjectNames.length > 0) {
      const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const addonIds = addonSubjectNames.filter(s => uuidPattern.test(s));
      
      if (addonIds.length > 0) {
        // Fetch addon names from course_addons table
        const { data: addons } = await supabase
          .from("course_addons")
          .select("id, subject_name")
          .in("id", addonIds);

        const addonMap = new Map(addons?.map(a => [a.id, a.subject_name]) || []);
        
        // Map IDs to names, keep original if not found
        resolvedAddonNames = addonSubjectNames.map(s => addonMap.get(s) || s);
      } else {
        // They're already names
        resolvedAddonNames = addonSubjectNames;
      }
    }

    // Combine mandatory subjects + addon subjects (unique values only)
    const allSubjects = [...mandatorySubjects, ...resolvedAddonNames];
    const uniqueSubjects = [...new Set(allSubjects)].filter(Boolean);
    const coursesString = uniqueSubjects.length > 0 ? uniqueSubjects.join(", ") : "No subjects";

    // 8. Extract UTR from payment details
    let utr: string | null = null;
    if (paymentDetails?.payment_method) {
      const pm = paymentDetails.payment_method;
      utr = pm.upi?.utr 
        || pm.netbanking?.bank_reference 
        || pm.card?.bank_reference 
        || paymentDetails.bank_reference 
        || null;
    }

    // 9. Extract discount/offer info from Cashfree response
    // Cashfree returns offer details in payment_offers or offer_details
    let discountApplied = false;
    let discountType: string | null = null;
    let discountValue: number | null = null;
    let couponCode: string | null = null;
    let netAmount: number = orderData.order_amount;

    // Check for offers in payment details (Cashfree Offers feature)
    const offers = paymentDetails?.payment_offers || paymentDetails?.offers || [];
    if (offers && offers.length > 0) {
      const appliedOffer = offers[0]; // Get the first applied offer
      discountApplied = true;
      discountType = appliedOffer.offer_type || appliedOffer.discount_type || 'flat';
      discountValue = appliedOffer.discount_amount || appliedOffer.cashback_amount || appliedOffer.offer_amount || 0;
      couponCode = appliedOffer.offer_id || appliedOffer.promo_code || appliedOffer.offer_code || null;
      
      // Net amount is the actual amount charged after discount
      netAmount = paymentDetails?.payment_amount || orderData.order_amount;
      
      console.log("🎫 Offer Applied:", JSON.stringify(appliedOffer));
    }

    // Also check order-level discount info (order_splits or discount fields)
    if (!discountApplied && orderData.order_splits) {
      const discountSplit = orderData.order_splits.find((s: any) => s.split_type === 'discount');
      if (discountSplit) {
        discountApplied = true;
        discountType = 'flat';
        discountValue = discountSplit.amount || 0;
        netAmount = orderData.order_amount - (discountValue || 0);
      }
    }

    // Check if payment amount differs from order amount (indicates discount)
    if (!discountApplied && paymentDetails?.payment_amount && paymentDetails.payment_amount < orderData.order_amount) {
      discountApplied = true;
      discountType = 'flat';
      discountValue = orderData.order_amount - paymentDetails.payment_amount;
      netAmount = paymentDetails.payment_amount;
      console.log("💰 Discount detected from amount difference:", discountValue);
    }

    // If no discount, net_amount equals order_amount
    if (!discountApplied) {
      netAmount = orderData.order_amount;
    }

    // 10. Insert Payment Record with ALL data including Cashfree discount info
    // Only insert into payments table if the final status is success
    if (finalStatus === "success") {
      const paymentInsertData = {
        order_id: orderId,
        payment_id: paymentDetails?.cf_payment_id?.toString() || orderData.cf_order_id || null,
        user_id: userId || null,
        amount: orderData.order_amount, // Original order amount
        status: finalStatus,
        payment_mode: paymentDetails?.payment_group || paymentDetails?.payment_method?.type || "unknown",
        payment_time: paymentDetails?.payment_time || paymentDetails?.payment_completion_time || null,
        payment_group: paymentDetails?.payment_group || null,
        utr: utr,
        customer_email: orderData.customer_details?.customer_email || null,
        customer_phone: orderData.customer_details?.customer_phone || null,
        raw_response: { order: orderData, payment: paymentDetails },
        batch: mainBatchName,
        courses: coursesString,
        // Discount tracking fields from Cashfree
        discount_applied: discountApplied,
        discount_type: discountApplied ? discountType : null,
        discount_value: discountApplied ? discountValue : null,
        coupon_code: couponCode,
        net_amount: netAmount // Final amount actually received
      };

      console.log("📝 Inserting Payment:", JSON.stringify(paymentInsertData));

      const { error: insertError } = await supabase
        .from("payments")
        .insert(paymentInsertData);

      if (insertError) {
        console.error("❌ DB INSERT ERROR:", insertError.message);
      } else {
        console.log(`✅ Payment Saved: Batch=[${mainBatchName}], Courses=[${coursesString}], UTR=[${utr}]`);
        
        // Send Enrollment Confirmation Email
        if (paymentInsertData.customer_email) {
          try {
            const resendApiKey = Deno.env.get("RESEND_API_KEY");
            if (resendApiKey) {
              const resend = new Resend(resendApiKey);
              const { error: emailError } = await resend.emails.send({
                from: "Unknown IITians <desk@unknowniitians.com>",
                to: [paymentInsertData.customer_email],
                subject: `Enrollment Confirmed: ${mainBatchName}`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #1E3A8A;">Welcome to ${mainBatchName}!</h1>
                    
                    <p>Hello,</p>
                    
                    <p><strong>Congratulations!</strong> Your enrollment has been confirmed.</p>
                    
                    <h2 style="color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">Enrollment Details</h2>
                    
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Batch:</td>
                        <td style="padding: 8px 0;">${mainBatchName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Subjects:</td>
                        <td style="padding: 8px 0;">${coursesString}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Amount Paid:</td>
                        <td style="padding: 8px 0;">₹${netAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-weight: bold;">Registered Email:</td>
                        <td style="padding: 8px 0;">${paymentInsertData.customer_email}</td>
                      </tr>
                    </table>
                    
                    <h2 style="color: #1E3A8A; border-bottom: 2px solid #1E3A8A; padding-bottom: 8px;">How to Access Your Classes</h2>
                    
                    <p>You can join your classes through the <strong>Student Service Portal</strong>. You can get recordings of the classes, access notes, and connect with your teachers and admin through the portal. Your class batch group is also available there.</p>
                    
                    <p style="background-color: #FEF3C7; padding: 12px; border-radius: 6px;">
                      <strong>⚠️ Important:</strong> Only login through your registered email mentioned above.
                    </p>
                    
                    <p style="text-align: center; margin: 24px 0;">
                      <a href="https://ssp.unknowniitians.com" 
                         style="background-color: #1E3A8A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Access Portal
                      </a>
                    </p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                    
                    <p style="color: #6B7280; font-size: 12px; text-align: center;">
                      This is a computer generated email
                    </p>
                  </div>
                `,
              });

              if (emailError) {
                console.error("📧 Email Error:", emailError);
              } else {
                console.log("📧 Confirmation email sent to:", paymentInsertData.customer_email);
              }
            } else {
              console.warn("📧 RESEND_API_KEY not configured, skipping email");
            }
          } catch (emailErr) {
            console.error("📧 Email sending failed:", emailErr);
            // Don't fail the whole flow if email fails
          }
        }
      }
    } else {
      console.log(`ℹ️ Skipping payment table insert: Status is ${finalStatus}`);
    }

    // 10. Update Enrollment Status
    const { error: updateError } = await supabase
      .from("enrollments")
      .update({ 
        status: finalStatus, 
        payment_id: paymentDetails?.cf_payment_id?.toString() || orderData.cf_order_id 
      })
      .eq("order_id", orderId);

    if (updateError) {
      console.error("⚠️ Enrollment Update Error:", updateError.message);
    }

    // 11. Redirect
    const redirectUrl = finalStatus === "success" 
      ? `${frontendUrl}/redirect-to-portal`
      : `${frontendUrl}/dashboard?payment=${finalStatus}`;
    console.log(`🔄 Redirecting to: ${redirectUrl}`);
    return new Response(null, { status: 302, headers: { Location: redirectUrl } });

  } catch (err: any) {
    console.error("❌ Unhandled Error:", err.message);
    return new Response(null, { status: 302, headers: { Location: `${frontendUrl}/dashboard?payment=error` } });
  }
});
