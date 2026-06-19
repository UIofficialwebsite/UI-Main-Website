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
        description: "You'll hear about new batches, classes and offers.",
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
    <div className="fixed z-[1000] inset-x-4 bottom-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[360px] font-['Inter',sans-serif] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <button
          onClick={snooze}
          aria-label="Dismiss"
          className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="shrink-0 rounded-xl bg-royal/10 p-2.5">
            <Bell className="h-5 w-5 text-royal" />
          </div>
          <div className="min-w-0 pr-4">
            <h3 className="text-[15px] font-bold text-slate-900">
              Never miss an update
            </h3>
            <p className="mt-1 text-[13px] leading-snug text-slate-500">
              Get notified about new batches, live classes and limited-time
              offers.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={handleEnable}
            disabled={working}
            className="flex-1 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-royal-dark disabled:opacity-60"
          >
            {working ? "Enabling…" : "Enable notifications"}
          </button>
          <button
            onClick={snooze}
            className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PushOptInPrompt;
