import { useEffect, useState, useCallback } from "react";
import { Share, Plus } from "lucide-react";

/**
 * Auto-showing "Install this app" invitation.
 *
 * Mobile (< lg): a full-width bottom sheet styled like a native app promo —
 * square top edge, hero image, and a headline/description pair that auto-rotates
 * through four messages.
 *
 * - Android / desktop Chrome: captures the `beforeinstallprompt` event. Tapping
 *   "Install App" fires Chrome's native install dialog.
 * - iOS Safari: no install API exists, so we show "Add to Home Screen" steps.
 * - `?install=1` (e.g. from a scanned QR) forces the sheet to show immediately,
 *   ignoring any earlier dismissal.
 * - Never shows if the app is already running installed (standalone mode).
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "ui-install-dismissed-v1";

// Rotating headline + one-line description pairs.
const MESSAGES: { title: string; subtitle: string }[] = [
  {
    title: "Your Entire Prep in One App",
    subtitle: "Live classes, tests & instant doubt-solving",
  },
  {
    title: "Learn Live from Top Educators",
    subtitle: "Expert-led classes, anytime, anywhere",
  },
  {
    title: "Practice, Test & Improve",
    subtitle: "Mock tests, previous papers & detailed solutions",
  },
  {
    title: "Free Study Material for All",
    subtitle: "Notes, question banks & smart prep tools",
  },
];

// Rotating hero gradients (full class literals so Tailwind keeps them).
const GRADIENTS = [
  "bg-gradient-to-br from-rose-600 via-red-500 to-orange-500",
  "bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500",
  "bg-gradient-to-br from-indigo-700 via-blue-600 to-cyan-500",
];

function isStandalone(): boolean {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

const InstallAppPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [showIosSteps, setShowIosSteps] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [gradIndex, setGradIndex] = useState(0);

  // Did the QR / link explicitly ask us to show the install prompt?
  const forced =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("install") === "1";

  const dismiss = useCallback(() => {
    setVisible(false);
    setShowIosSteps(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore storage errors (private mode etc.) */
    }
  }, []);

  useEffect(() => {
    if (isStandalone()) return; // already installed — nothing to do

    const dismissedBefore = (() => {
      try {
        return localStorage.getItem(DISMISS_KEY) === "1";
      } catch {
        return false;
      }
    })();

    // Android / Chromium: wait for the installability signal.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (forced || !dismissedBefore) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // Hide everything once installed.
    const onInstalled = () => dismiss();
    window.addEventListener("appinstalled", onInstalled);

    // iOS has no event — decide up front.
    if (isIos() && (forced || !dismissedBefore)) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [forced, dismiss]);

  // Rotate the headline/description while the sheet is visible.
  useEffect(() => {
    if (!visible || showIosSteps) return;
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
      setGradIndex((g) => (g + 1) % GRADIENTS.length);
    }, 3000);
    return () => clearInterval(id);
  }, [visible, showIosSteps]);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === "accepted") dismiss();
      else setVisible(false);
      return;
    }
    // No native prompt available (e.g. iOS) — show manual steps.
    setShowIosSteps(true);
  }, [deferredPrompt, dismiss]);

  if (!visible) return null;

  const msg = MESSAGES[msgIndex];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[1000] flex justify-center lg:hidden font-['Inter',sans-serif]">
      {/* Square top edge (no rounded upper border), full-width sheet rising from below. No shadow. */}
      <div className="relative w-full overflow-hidden border-t border-slate-200 bg-white animate-in slide-in-from-bottom-6 duration-300">
        {/* Hero — rotating gradient (crossfades through 3 looks) */}
        <div className="relative h-56 w-full overflow-hidden">
          {GRADIENTS.map((g, i) => (
            <div
              key={i}
              className={`absolute inset-0 ${g} transition-opacity duration-700 ${
                i === gradIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        <div className="px-6 pb-7 pt-6 text-center">
          <p className="text-[13px] font-medium text-slate-400">
            Get the Unknown IITians App for
          </p>

          {showIosSteps ? (
            <div className="mx-auto mt-3 max-w-sm text-left">
              <p className="mb-2 text-center text-sm font-bold text-slate-800">
                Install on iPhone / iPad
              </p>
              <ol className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    1
                  </span>
                  Tap the <Share className="mx-0.5 inline h-4 w-4" /> Share
                  button in Safari.
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    2
                  </span>
                  Choose <Plus className="mx-0.5 inline h-4 w-4" /> "Add to Home
                  Screen".
                </li>
              </ol>
            </div>
          ) : (
            // Rotating headline + description (re-mounts each cycle for a fade-in)
            <div key={msgIndex} className="animate-in fade-in duration-500">
              <h2 className="mt-2 text-[26px] font-extrabold leading-tight tracking-tight text-slate-900">
                {msg.title}
              </h2>
              <p className="mt-2 text-[15px] text-slate-500">{msg.subtitle}</p>
            </div>
          )}

          <button
            onClick={handleInstall}
            className="mt-6 w-full rounded-xl bg-blue-800 px-4 py-4 font-['Inter',sans-serif] text-base font-bold text-white transition-colors active:bg-blue-900"
          >
            Install App
          </button>

          <button
            onClick={dismiss}
            className="mt-1.5 w-full rounded-xl py-4 font-['Inter',sans-serif] text-[15px] font-semibold text-blue-800 transition-colors active:bg-slate-50"
          >
            Continue in Web
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppPrompt;
