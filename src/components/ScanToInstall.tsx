import { useState } from "react";
import { Smartphone, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Desktop-only, left-edge collapsible "Scan Me" widget.
 *
 * Shows a QR code that points at the install deep-link so a desktop visitor can
 * scan it with their phone and get the install prompt on their device. Hidden on
 * mobile (where the on-page InstallAppPrompt handles installation instead).
 */

// Where the phone lands after scanning — `?install=1` forces the install prompt.
const INSTALL_URL = "https://unknowniitians.com/?install=1";
const QR_SRC =
  "https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=" +
  encodeURIComponent(INSTALL_URL);

const ScanToInstall = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="fixed left-0 top-1/2 z-[900] hidden -translate-y-1/2 lg:block">
      <div className="flex items-center">
        {/* Sliding QR panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            open ? "w-[200px] opacity-100" : "w-0 opacity-0"
          }`}
        >
          <div className="m-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-3 shadow-2xl shadow-violet-900/30">
            <div className="rounded-xl bg-white p-2.5">
              <img
                src={QR_SRC}
                alt="Scan to install the Unknown IITians app"
                width={180}
                height={180}
                loading="lazy"
                className="h-[150px] w-[150px]"
              />
            </div>
            <p className="mt-2 text-center text-sm font-bold tracking-wide text-white font-['Inter',sans-serif]">
              Scan Me
            </p>
          </div>
        </div>

        {/* Toggle tab on the very edge */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Hide QR code" : "Scan to install app"}
          className="flex h-16 w-9 items-center justify-center rounded-r-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-violet-900/30 transition-transform hover:scale-105"
        >
          {open ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <span className="flex flex-col items-center gap-1">
              <Smartphone className="h-5 w-5" />
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ScanToInstall;
