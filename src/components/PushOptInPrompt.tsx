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
    <div className="fixed z-[1000] inset-x-4 bottom-4 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[384px] font-['Inter',sans-serif] animate-in slide-in-from-bottom-6 fade-in zoom-in-95 duration-500">
      <style>{PROMPT_STYLES}</style>

      <div className="relative overflow-hidden rounded-[22px] bg-white shadow-[0_24px_60px_-15px_rgba(26,86,219,0.4)] ring-1 ring-slate-900/[0.06]">
        {/* Top gradient hairline — royal sweeping into the brand gold */}
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-royal via-royal-light to-golden" />

        {/* Atmospheric glow behind the icon for depth */}
        <div className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full bg-gradient-to-br from-royal/25 via-royal/10 to-golden/10 blur-3xl" />

        <button
          onClick={snooze}
          aria-label="Dismiss"
          className="absolute right-3.5 top-3.5 z-10 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative p-5 pt-[22px]">
          <div className="flex items-start gap-4">
            {/* Dimensional icon medallion with gloss, ring, glow + live gold ping */}
            <div className="relative shrink-0">
              <div className="relative grid h-[52px] w-[52px] place-items-center rounded-[16px] bg-gradient-to-br from-royal-light via-royal to-royal-dark shadow-[0_10px_22px_-6px_rgba(26,86,219,0.65)] ring-1 ring-white/25">
                {/* glossy top sheen */}
                <div className="pointer-events-none absolute inset-0 rounded-[16px] bg-gradient-to-b from-white/30 to-transparent" />
                <Bell
                  className="pn-bell relative h-[23px] w-[23px] text-white drop-shadow-sm"
                  strokeWidth={2.2}
                />
              </div>
              {/* live notification dot */}
              <span className="absolute -right-1 -top-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-golden opacity-75" />
                <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-golden-light to-golden ring-[2.5px] ring-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                </span>
              </span>
            </div>

            <div className="min-w-0 pr-4">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-royal">
                Stay updated
              </p>
              <h3 className="mt-1 text-[16.5px] font-bold leading-[1.2] tracking-tight text-slate-900">
                Never miss a new batch
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
                Live class alerts, fresh batches and limited-time offers —
                delivered straight to your device.
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <button
              onClick={handleEnable}
              disabled={working}
              className="group relative flex-1 overflow-hidden rounded-[13px] bg-gradient-to-b from-royal to-royal-dark px-4 py-[11px] text-sm font-semibold text-white shadow-[0_8px_18px_-5px_rgba(26,86,219,0.6)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-5px_rgba(26,86,219,0.7)] active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {/* sheen swipe on hover */}
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {working ? "Enabling…" : "Enable notifications"}
              </span>
            </button>
            <button
              onClick={snooze}
              className="rounded-[13px] px-3.5 py-[11px] text-sm font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Scoped keyframes (unique names so they never collide with global styles).
const PROMPT_STYLES = `
  @keyframes pnBellRing {
    0%, 55%, 100% { transform: rotate(0deg); }
    60% { transform: rotate(15deg); }
    66% { transform: rotate(-13deg); }
    72% { transform: rotate(9deg); }
    78% { transform: rotate(-6deg); }
    84% { transform: rotate(3deg); }
    90% { transform: rotate(0deg); }
  }
  .pn-bell { transform-origin: 50% 18%; animation: pnBellRing 4s ease-in-out 0.6s infinite; }
  @media (prefers-reduced-motion: reduce) {
    .pn-bell { animation: none; }
  }
`;

export default PushOptInPrompt;
