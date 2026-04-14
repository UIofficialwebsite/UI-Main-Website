import { supabase } from "@/integrations/supabase/client";

interface LogToolUsageParams {
  toolName: "CGPA Calculator" | "Grade Calculator" | "Marks Predictor" | "Foundation Marks Predictor";
  branch?: string;
  level?: string;
  inputDetails: any;
  resultDetails?: any;
}

export const logToolUsage = async ({
  toolName,
  branch,
  level,
  inputDetails,
  resultDetails
}: LogToolUsageParams) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    let email = user?.email || "Anonymous";
    let phone = "N/A";

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .single();
      
      if (profile?.phone) {
        phone = profile.phone;
      }
    }

    // Fire and forget insert
    await (supabase.from as any)("tool_usage_logs").insert([{
      user_id: user?.id || null,
      email: email,
      phone: phone,
      tool_name: toolName,
      branch: branch || "N/A",
      level: level || "N/A",
      input_details: inputDetails,
      result_details: resultDetails
    }]);

  } catch (error) {
    console.error("Failed to log tool usage:", error);
  }
};
