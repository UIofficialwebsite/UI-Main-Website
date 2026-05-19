import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const envKey = Deno.env.get("CASHFREE_KEY");
    const envSecret = Deno.env.get("CASHFREE_SECRET");
    const cashfreeEnv = Deno.env.get("CASHFREE_ENVIRONMENT") ?? "sandbox";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!envSecret || !envKey) throw new Error("Cashfree keys missing in Supabase Secrets");

    const origin = req.headers.get("origin") || "https://preview.lovable.app";

    const { 
      courseId, 
      selectedSubjects, 
      amount, 
      userId, 
      customerPhone, 
      customerEmail 
    } = await req.json();

    const orderId = `order_${Date.now()}_${userId}`;
    const verifyUrl = `${supabaseUrl}/functions/v1/verify-cashfree-payment?order_id=${orderId}&redirect_url=${encodeURIComponent(origin)}`;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, student_name')
      .eq('id', userId)
      .single();

    const customerName = profile?.full_name || profile?.student_name || "Customer";

    // Fetch course details
    const { data: course } = await supabase
      .from('courses')
      .select('title, subject')
      .eq('id', courseId)
      .single();

    const batchName = course?.title || "Unknown Batch";

    const mandatorySubjects: string[] = course?.subject
      ? course.subject.split(',').map((s: string) => s.trim()).filter(Boolean)
      : [];

    let addonNames: string[] = [];
    let addonsData: any[] = [];
    
    if (selectedSubjects && selectedSubjects.length > 0) {
      // FIX: Use a Set to ensure the IDs we query for are unique
      const uniqueSelectedIds = [...new Set(selectedSubjects)];
      const { data: addons, error: addonsError } = await supabase
        .from('course_addons')
        .select('id, subject_name, price')
        .in('id', uniqueSelectedIds);
      
      if (addonsError) throw new Error(`Failed to fetch addons: ${addonsError.message}`);
      addonsData = addons || [];
      addonNames = addonsData.map(a => a.subject_name).filter(Boolean);
    }

    const allSubjects = [...new Set([...mandatorySubjects, ...addonNames])];
    const coursesString = allSubjects.length > 0 ? allSubjects.join(", ") : "No subjects";

    // 1. Create Order with Cashfree
    const cashfreeResponse = await fetch(
      cashfreeEnv === "production" ? "https://api.cashfree.com/pg/orders" : "https://sandbox.cashfree.com/pg/orders", 
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
          order_amount: amount,
          order_currency: "INR",
          customer_details: {
            customer_id: userId,
            customer_name: customerName,
            customer_phone: (() => {
              if (!customerPhone) return "";
              
              // Remove spaces, dashes, parentheses - but keep + and digits
              const cleaned = customerPhone.replace(/[\s\-\(\)]/g, '');
              
              // For Indian numbers (+91), Cashfree accepts just 10 digits
              if (cleaned.startsWith('+91') && cleaned.length === 13) {
                return cleaned.slice(3); // Return just the 10 digits
              }
              
              // For all other international numbers, keep the + prefix
              return cleaned.replace(/[^0-9+]/g, '');
            })(),
            customer_email: customerEmail || "",
          },
          order_meta: {
            return_url: verifyUrl,
          },
          order_note: batchName,
          order_tags: {
            batch: batchName,
            courses: coursesString,
            user_id: userId
          },
        }),
      }
    );

    if (!cashfreeResponse.ok) {
      const errText = await cashfreeResponse.text();
      throw new Error(`Cashfree API Error: ${errText}`);
    }

    const orderData = await cashfreeResponse.json();

    // 2. Database Logic - UPSERT STRATEGY
    const upsertRows = [];

    // A. Handle Main Course Logic
    // If the amount > 0 and the main course isn't already owned, we prep the main row
    // Note: We use .upsert with 'onConflict' to prevent duplicate key errors
    upsertRows.push({
      user_id: userId,
      course_id: courseId,
      order_id: orderId,
      status: 'pending',
      amount: amount, 
      subject_name: null, // null represents the main batch
    });

    // B. Handle Add-ons
    addonsData.forEach((addon) => {
      upsertRows.push({
        user_id: userId,
        course_id: courseId,
        order_id: orderId,
        status: 'pending',
        amount: addon.price,
        subject_name: addon.subject_name,
      });
    });

    // C. Perform Bulk Upsert
    // This will update the order_id and status if the user_id/course_id/subject_name combo exists
    if (upsertRows.length > 0) {
      const { error: dbError } = await supabase
        .from('enrollments')
        .upsert(upsertRows, { 
          onConflict: 'user_id,course_id,subject_name',
          ignoreDuplicates: false 
        });

      if (dbError) throw new Error(`DB Error: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ 
      ...orderData, 
      environment: cashfreeEnv,
      verifyUrl: verifyUrl 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
