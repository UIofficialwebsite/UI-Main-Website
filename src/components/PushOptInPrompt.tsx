import { useEffect, useState, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useToast } from "@/hooks/use-toast";

/**
 * Soft opt-in invitation for browser notifications.
 *
 * Appears as a compact card (bottom-right on desktop, bottom sheet on mobile)
 * a few seconds after load — but only when:
 *  - the browser supports Web Push,
 *  - the user hasn't already granted/blocked permission (permission "default"),
 *  - they aren't already subscribed, and
 *  - they haven't dismissed it within the re-ask window.
 *
 * "Not now" snoozes the prompt; it won't reappear until RE_ASK_DAYS later, so
 * we nudge without nagging. The always-available toggle lives in the profile
 * menu (PushNotificationToggle) for anyone who dismisses this.
 */

const DISMISS_KEY = "ui-push-optin-dismissed-at";
const RE_ASK_DAYS = 14;
const SHOW_DELAY_MS = 5000;

function recentlyDismissed(): boolean {
  try {
    const ts = localStorage.getItem(DISMISS_KEY);
    if (!ts) return false;
    const ageMs = Date.now() - Number(ts);
    return ageMs < RE_ASK_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

const PushOptInPrompt = () => {
  const { supported, subscribed, loading, permission, subscribe } =
    usePushNotifications();
  const { toast } = useToast();
  const [visible, setVisible] = useState(false);
  const [working, setWorking] = useState(false);

  const eligible =
    supported &&
    !loading &&
    !subscribed &&
    permission === "default" &&
    !recentlyDismissed() &&
    !window.location.pathname.startsWith("/admin");

  useEffect(() => {
    if (!eligible) {
      setVisible(false);
      return;
    }
    const id = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(id);
  }, [eligible]);

  const snooze = useCallback(() => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore storage errors (private mode etc.) */
    }
  }, []);

  const handleEnable = useCallback(async () => {
    setWorking(true);
    const ok = await subscribe();
    setWorking(false);
    setVisible(false);
    if (ok) {
      toast({
        title: "Notifications enabled",
        description:
          "You'll hear about offers, new batches, resources and job openings.",
      });
    } else {
      // Permission denied / dismissed — don't keep pestering.
      try {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
  }, [subscribe, toast]);

  if (!visible) return null;

  return (
    <div className="fixed z-[1000] inset-x-4 bottom-4 sm:inset-x-auto sm:left-5 sm:bottom-5 sm:w-[356px] font-['Inter',sans-serif] animate-in slide-in-from-bottom-3 fade-in duration-300">
      <style>{BELL_STYLE}</style>
      <div className="relative rounded-[8px] border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)]">
        <button
          onClick={snooze}
          aria-label="Dismiss"
          className="absolute right-3 top-3 rounded-md p-1 text-slate-300 transition-colors hover:text-slate-500"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <Bell
            className="pn-bell mt-0.5 h-5 w-5 shrink-0 text-golden-dark"
            fill="#fbbf24"
            strokeWidth={1.8}
          />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">
              Turn on notifications
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
              Get notified about offers, new batches, study resources and career
              &amp; job openings.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <button
            onClick={handleEnable}
            disabled={working}
            className="rounded-[6px] bg-royal px-4 py-2 font-['Inter',sans-serif] text-[13px] font-semibold text-white shadow-none transition-colors hover:bg-royal-dark disabled:opacity-60"
          >
            {working ? "Turning on…" : "Turn on"}
          </button>
          <button
            onClick={snooze}
            className="rounded-[6px] border border-slate-200 bg-white px-4 py-2 font-['Inter',sans-serif] text-[13px] font-semibold text-slate-600 shadow-none transition-colors hover:bg-slate-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

// Subtle periodic "ring" — the bell tilts gently every few seconds.
const BELL_STYLE = `
  @keyframes pnBellTilt {
    0%, 70%, 100% { transform: rotate(0deg); }
    76% { transform: rotate(9deg); }
    82% { transform: rotate(-7deg); }
    88% { transform: rotate(4deg); }
    94% { transform: rotate(-2deg); }
  }
  .pn-bell { transform-origin: 50% 16%; animation: pnBellTilt 3.6s ease-in-out 1s infinite; }
  @media (prefers-reduced-motion: reduce) { .pn-bell { animation: none; } }
`;

export default PushOptInPrompt;
