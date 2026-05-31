import { useEffect, useState, useCallback } from "react";
import { X, Download, Share, Plus } from "lucide-react";

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
    title: "Ace Your IITM BS Journey",
    subtitle: "Live classes for Qualifier, Foundation & Diploma",
  },
  {
    title: "Crack JEE & NEET 2026",
    subtitle: "Mock tests, PYQs & real-time doubt solving",
  },
  {
    title: "Learn Live from IITians",
    subtitle: "Expert-led classes, anytime, anywhere",
  },
  {
    title: "Free Notes, PYQs & Tools",
    subtitle: "Complete study material for JEE, NEET & IITM BS",
  },
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
      {/* Square top edge (no rounded upper border), full-width sheet rising from below */}
      <div className="relative w-full overflow-hidden bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.18)] animate-in slide-in-from-bottom-6 duration-300">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-3 top-3 z-10 rounded-full bg-white/80 p-1.5 text-slate-500 backdrop-blur transition-colors hover:bg-white hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero image */}
        <div className="h-36 w-full bg-gradient-to-b from-sky-50 to-white">
          <img
            src="/web-uploads/uibanner.png"
            alt="Unknown IITians app"
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="px-5 pb-5 pt-3 text-center">
          <p className="text-xs font-medium text-slate-400">
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
              <h2 className="mt-1 text-2xl font-extrabold leading-tight text-slate-900">
                {msg.title}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500">{msg.subtitle}</p>
            </div>
          )}

          <button
            onClick={handleInstall}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-violet-600/25 transition-transform active:scale-[0.98]"
          >
            <Download className="h-5 w-5" />
            Install App
          </button>

          <button
            onClick={dismiss}
            className="mt-2.5 text-sm font-medium text-indigo-600 hover:underline"
          >
            Continue in Web
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallAppPrompt;
