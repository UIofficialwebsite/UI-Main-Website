import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Phase = "checking" | "pending" | "success" | "failed" | "timeout";

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 60_000;

const PaymentProcessing = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("order_id");

  const [phase, setPhase] = useState<Phase>("checking");
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    if (!orderId) {
      navigate("/dashboard?payment=error", { replace: true });
      return;
    }

    let pollTimer: number | undefined;
    let cancelled = false;

    const checkStatus = async () => {
      if (cancelled) return;

      const { data, error } = await supabase
        .from("enrollments")
        .select("status")
        .eq("order_id", orderId)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn("[PaymentProcessing] poll error:", error.message);
      }

      const status = data?.status?.toLowerCase() ?? null;

      if (status === "success" || status === "active" || status === "paid") {
        setPhase("success");
        setTimeout(() => navigate("/redirect-to-portal", { replace: true }), 1500);
        return;
      }
      if (status === "failed") {
        setPhase("failed");
        setTimeout(
          () => navigate("/dashboard?payment=failed", { replace: true }),
          2500,
        );
        return;
      }

      if (Date.now() - startedAt.current > TIMEOUT_MS) {
        setPhase("timeout");
        return;
      }

      setPhase("pending");
      pollTimer = window.setTimeout(checkStatus, POLL_INTERVAL_MS);
    };

    // Realtime: react instantly the moment the webhook flips the row.
    const channel = supabase
      .channel(`enrollment-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "enrollments",
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          checkStatus();
        },
      )
      .subscribe();

    checkStatus();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center px-4 font-['Inter',sans-serif]">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
        {phase === "checking" || phase === "pending" ? (
          <>
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Confirming your payment
            </h1>
            <p className="text-sm text-slate-600">
              Usually takes a few seconds. Please don't refresh or close this
              page.
            </p>
          </>
        ) : phase === "success" ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Payment confirmed!
            </h1>
            <p className="text-sm text-slate-600">
              Taking you to the Student Portal…
            </p>
          </>
        ) : phase === "failed" ? (
          <>
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Payment did not complete
            </h1>
            <p className="text-sm text-slate-600">
              Returning you to your dashboard…
            </p>
          </>
        ) : (
          <>
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-slate-900 mb-2">
              Still confirming with your bank
            </h1>
            <p className="text-sm text-slate-600 mb-4">
              This is taking longer than usual. Your payment is safe — we'll
              email you the moment it's confirmed. You can safely close this
              page.
            </p>
            <button
              onClick={() => navigate("/dashboard", { replace: true })}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessing;
