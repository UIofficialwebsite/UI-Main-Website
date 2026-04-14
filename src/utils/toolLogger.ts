import { supabase } from "@/integrations/supabase/client";

interface LogToolUsageParams {
  toolName: "CGPA Calculator" | "Grade Calculator" | "Marks Predictor";
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
        .select("phone_number")
        .eq("id", user.id)
        .single();
      
      if (profile?.phone_number) {
        phone = profile.phone_number;
      }
    }

    // Fire and forget insert
    await supabase.from("tool_usage_logs").insert([{
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
