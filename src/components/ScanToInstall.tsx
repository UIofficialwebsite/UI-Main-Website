import { useState } from "react";
import { Smartphone, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Desktop-only, right-edge collapsible "Scan Me" widget.
 *
 * Shows a QR code that points at the install deep-link so a desktop visitor can
 * scan it with their phone and get the install prompt on their device. Hidden on
 * mobile (where the on-page InstallAppPrompt handles installation instead).
 */

// Where the phone lands after scanning — `?install=1` forces the install prompt.
const INSTALL_URL = "https://unknowniitians.com/?install=1";
const QR_SRC =
  "https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=" +
  encodeURIComponent(INSTALL_URL);

const ScanToInstall = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="fixed right-0 top-1/2 z-[900] hidden -translate-y-1/2 lg:block font-['Inter',sans-serif]">
      <div className="flex items-center">
        {/* Sliding QR panel (slides out to the left) */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            open ? "w-[124px] opacity-100" : "w-0 opacity-0"
          }`}
        >
          <div className="my-1.5 ml-1.5 rounded-lg bg-slate-900 p-2 shadow-md">
            <div className="rounded-md bg-white p-1.5">
              <img
                src={QR_SRC}
                alt="Scan to install the Unknown IITians app"
                width={120}
                height={120}
                loading="lazy"
                className="h-[92px] w-[92px]"
              />
            </div>
            <p className="mt-1.5 text-center text-[11px] font-semibold tracking-wide text-white">
              Scan Me
            </p>
          </div>
        </div>

        {/* Toggle tab on the right edge */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Hide QR code" : "Scan to install app"}
          className="flex h-14 w-6 items-center justify-center rounded-l-lg bg-slate-900 text-white shadow-md transition-transform hover:scale-105"
        >
          {open ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <span className="flex flex-col items-center gap-0.5">
              <Smartphone className="h-4 w-4" />
              <ChevronLeft className="h-3.5 w-3.5" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScanToInstall;
