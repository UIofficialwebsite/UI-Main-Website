import { useState } from "react";
import { ChevronRight } from "lucide-react";

/**
 * Desktop-only, right-edge collapsible "Scan Me" widget.
 *
 * A small arrow tab sits at the top-left corner of the QR block. Clicking it
 * reveals / hides the QR with a horizontal "curtain" slide; the chevron rotates
 * to point the way it will go. Points at the install deep-link so a desktop
 * visitor can scan it and get the install prompt on their phone. Hidden on
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
      <div className="flex items-start">
        {/* Arrow tab — anchored to the top-left corner of the QR block */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Hide QR code" : "Scan to install app"}
          className="flex h-7 w-6 shrink-0 items-center justify-center rounded-l-md bg-slate-900 text-white transition-transform duration-200 active:scale-95"
        >
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-300 ${
              open ? "rotate-0" : "rotate-180"
            }`}
          />
        </button>

        {/* QR panel — curtain slide */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            open ? "w-[116px] opacity-100" : "w-0 opacity-0"
          }`}
        >
          <div className="rounded-b-lg rounded-tr-lg bg-slate-900 p-2 shadow-md">
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
      </div>
    </div>
  );
};

export default ScanToInstall;
