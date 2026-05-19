import React, { useEffect, useState } from "react";
import { Check, ChevronRight, FileSearch, Loader2, Tag, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Party-popper celebration. canvas-confetti's default appends a canvas at a
// modest z-index that can get hidden behind the Sheet overlay or other
// stacking contexts. We bypass that by creating our own full-screen canvas
// pinned at the max safe z-index (2,147,483,647 — 2^31-1) and scoping a
// confetti instance to it. The canvas is removed when the effect finishes.
const celebrateCoupon = () => {
  const colors = [
    "#22c55e", "#16a34a", "#10b981", "#84cc16", "#4ade80", // greens
    "#facc15", "#f97316", "#ec4899", "#6957f1", "#3b82f6", // accent
  ];

  const canvas = document.createElement("canvas");
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: "100vw",
    height: "100vh",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.appendChild(canvas);

  const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });

  // Phase 1 — central explosion
  myConfetti({
    particleCount: 160,
    spread: 130,
    startVelocity: 55,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 1.1,
    disableForReducedMotion: false,
  });
  myConfetti({
    particleCount: 100,
    spread: 160,
    startVelocity: 35,
    origin: { x: 0.5, y: 0.55 },
    colors,
    scalar: 0.85,
    disableForReducedMotion: false,
  });

  // Phase 2 — twin side cannons
  setTimeout(() => {
    myConfetti({
      particleCount: 150,
      angle: 60,
      spread: 85,
      startVelocity: 70,
      origin: { x: 0, y: 0.75 },
      colors,
      scalar: 1,
    });
    myConfetti({
      particleCount: 150,
      angle: 120,
      spread: 85,
      startVelocity: 70,
      origin: { x: 1, y: 0.75 },
      colors,
      scalar: 1,
    });
  }, 200);

  // Phase 3 — sustained streamer rain
  const end = Date.now() + 1100;
  const rain = () => {
    myConfetti({
      particleCount: 12,
      angle: 60,
      spread: 95,
      startVelocity: 55,
      origin: { x: 0, y: 0.9 },
      colors,
      scalar: 0.95,
    });
    myConfetti({
      particleCount: 12,
      angle: 120,
      spread: 95,
      startVelocity: 55,
      origin: { x: 1, y: 0.9 },
      colors,
      scalar: 0.95,
    });
    if (Date.now() < end) requestAnimationFrame(rain);
  };
  setTimeout(rain, 350);

  // Clean up the canvas after particles have finished falling.
  setTimeout(() => {
    try { myConfetti.reset(); } catch (_) { /* noop */ }
    canvas.remove();
  }, 4500);
};

export type AppliedCoupon = {
  code: string;
  label?: string | null;
  discountAmount: number;
  finalAmount: number;
};

type CouponOffer = {
  code: string;
  label: string | null;
  eligible: boolean;
  discountAmount?: number;
  finalAmount?: number;
  isAutoApplied?: boolean;
  ineligibilityReason?: string;
};

interface CouponSectionProps {
  courseId: string;
  courseTitle: string;
  selectedAddonIds: string[];
  cartTotal: number;
  appliedCoupon: AppliedCoupon | null;
  onApply: (c: AppliedCoupon) => void;
  onRemove: () => void;
  // Auto-apply the first is_auto_applied eligible coupon when no user choice yet.
  enableAutoApply?: boolean;
  className?: string;
}

// One-off keyframes for the empty-state magnifying-glass wobble.
// Scoped via a unique class so it doesn't collide with anything global.
const searchWobbleCss = `
@keyframes coupon-search-wobble {
  0%, 100% { transform: translate(0, 0) rotate(-12deg); }
  35%      { transform: translate(6px, -2px) rotate(10deg); }
  60%      { transform: translate(-4px, 2px) rotate(-6deg); }
  85%      { transform: translate(3px, 0) rotate(8deg); }
}
.coupon-search-wobble {
  animation: coupon-search-wobble 1.8s ease-in-out infinite;
  transform-origin: center;
}
`;

const CouponSection: React.FC<CouponSectionProps> = ({
  courseId,
  courseTitle,
  selectedAddonIds,
  cartTotal,
  appliedCoupon,
  onApply,
  onRemove,
  enableAutoApply = true,
  className,
}) => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [couponInput, setCouponInput] = useState(appliedCoupon?.code ?? "");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState<CouponOffer[]>([]);
  const [offersLoading, setOffersLoading] = useState(false);
  const [autoAppliedOnce, setAutoAppliedOnce] = useState(false);

  // Keep input visually in sync if the parent applies a coupon externally.
  useEffect(() => {
    if (appliedCoupon?.code) setCouponInput(appliedCoupon.code);
  }, [appliedCoupon?.code]);

  // Fetch eligible offers whenever the cart shape changes. If a coupon is
  // currently applied, re-validate it against the new cart — keep it (with
  // updated discount/final) when still valid; drop it with a toast otherwise.
  // Adding/removing addons must not silently strip a user's coupon.
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    const fetchOffersAndRevalidate = async () => {
      setOffersLoading(true);
      try {
        const offersPromise = supabase.functions.invoke("list-eligible-coupons", {
          body: { courseId, selectedAddonIds },
        });
        // Re-validate currently-applied coupon in parallel.
        const revalidatePromise = appliedCoupon
          ? supabase.functions.invoke("validate-coupon", {
              body: { code: appliedCoupon.code, courseId, selectedAddonIds },
            })
          : Promise.resolve(null);

        const [offersRes, revalRes] = await Promise.all([offersPromise, revalidatePromise]);
        if (cancelled) return;

        const list = (offersRes.data?.offers ?? []) as CouponOffer[];
        setOffers(offersRes.error ? [] : list);

        if (revalRes && revalRes.data) {
          if (revalRes.data.valid) {
            // Cart changed — push the new discount + final back up.
            onApply({
              code: revalRes.data.code,
              label: revalRes.data.label ?? null,
              discountAmount: revalRes.data.discountAmount,
              finalAmount: revalRes.data.finalAmount,
            });
          } else if (appliedCoupon) {
            onRemove();
            toast.info(
              revalRes.data.reason
                ? `${appliedCoupon.code} removed: ${revalRes.data.reason}`
                : `${appliedCoupon.code} no longer applies to your cart.`,
            );
          }
        }

        if (enableAutoApply && !autoAppliedOnce && !appliedCoupon) {
          const best = list.find((o) => o.eligible && o.isAutoApplied);
          if (best && best.discountAmount !== undefined && best.finalAmount !== undefined) {
            onApply({
              code: best.code,
              label: best.label ?? null,
              discountAmount: best.discountAmount,
              finalAmount: best.finalAmount,
            });
            setAutoAppliedOnce(true);
            // Confetti only — no toast. The teaser card subtitle already
            // shows "You save ₹X" so a popup would be noise.
            celebrateCoupon();
          }
        }
      } catch {
        if (!cancelled) setOffers([]);
      } finally {
        if (!cancelled) setOffersLoading(false);
      }
    };
    fetchOffersAndRevalidate();
    return () => { cancelled = true; };
    // intentionally limited deps — we only refire when the cart shape changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, selectedAddonIds.join(","), enableAutoApply]);

  const eligibleCount = offers.filter((o) => o.eligible).length;
  const hasOffers = offers.length > 0;

  const applyCode = async (codeArg?: string) => {
    const code = (codeArg ?? couponInput).trim();
    if (!code) { setCouponError("Please enter a coupon code."); return; }
    setLoading(true);
    setCouponError(null);
    try {
      const { data, error } = await supabase.functions.invoke("validate-coupon", {
        body: { code, courseId, selectedAddonIds },
      });
      if (error) throw error;
      if (!data?.valid) {
        setCouponError(data?.reason ?? "Couldn't apply this code.");
        return;
      }
      onApply({
        code: data.code,
        label: data.label ?? null,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
      });
      setCouponInput(data.code);
      celebrateCoupon();
      setSheetOpen(false);
    } catch (e: any) {
      setCouponError(e?.message ?? "Couldn't apply this code.");
    } finally {
      setLoading(false);
    }
  };

  const removeApplied = () => {
    onRemove();
    setCouponInput("");
    setCouponError(null);
  };

  const teaserSubtitle = appliedCoupon
    ? `You save ₹${appliedCoupon.discountAmount}`
    : eligibleCount > 0
      ? `${eligibleCount} coupon${eligibleCount === 1 ? "" : "s"} available`
      : "no coupons available";

  return (
    <div className={cn("w-full", className)}>
      <style dangerouslySetInnerHTML={{ __html: searchWobbleCss }} />

      {/* --- Teaser card --- */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Solid-purple BadgePercent: the badge shape fills the full silhouette
              (no outline ring), only the % slash + dots are white. */}
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"
              fill="#6957f1"
            />
            <line
              x1="15" y1="9" x2="9" y2="15"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="9.5" cy="9.5" r="1" fill="white" />
            <circle cx="14.5" cy="14.5" r="1" fill="white" />
          </svg>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-gray-900 leading-tight">
              {appliedCoupon ? `${appliedCoupon.code} applied` : "Apply Code/Coupon"}
            </div>
            <div className={cn(
              "text-[12px] leading-tight mt-0.5",
              appliedCoupon ? "text-green-700" : "text-gray-500"
            )}>
              {teaserSubtitle}
            </div>
          </div>
          {appliedCoupon ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); removeApplied(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); removeApplied(); } }}
              className="text-[13px] font-bold text-gray-500 hover:text-gray-800 tracking-wider shrink-0 cursor-pointer"
            >
              REMOVE
            </span>
          ) : (
            <span className="text-[13px] font-bold text-[#6957f1]/70 tracking-wider shrink-0">
              APPLY
            </span>
          )}
        </div>
        <div className="border-t border-gray-100" />
        <div className="px-4 py-2.5 flex items-center justify-center gap-1 text-[13px] font-medium text-gray-700 hover:text-gray-900">
          Apply Coupon Code
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>

      {/* --- Sheet (slides from right on all viewports) --- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md p-0 flex flex-col rounded-none"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 truncate pr-3">{courseTitle}</h2>
            <SheetClose className="rounded-sm opacity-70 hover:opacity-100 transition-opacity">
              <X className="w-5 h-5" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>

          <div className="px-5 py-4 border-b border-gray-100">
            <div className="text-sm text-gray-700">
              Your cart total is: <span className="font-semibold">₹{cartTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="px-5 py-4">
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Check className="w-4 h-4 text-green-700 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-green-800 truncate">{appliedCoupon.code} applied</div>
                    <div className="text-xs text-green-700">You save ₹{appliedCoupon.discountAmount}</div>
                  </div>
                </div>
                <button
                  onClick={removeApplied}
                  className="text-xs font-bold tracking-wider text-green-700 hover:text-green-900 underline shrink-0 ml-2"
                >
                  REMOVE
                </button>
              </div>
            ) : (
              <div className="flex items-center border border-gray-200 rounded-md focus-within:border-gray-400">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") applyCode(); }}
                  placeholder="Write Coupon Code"
                  className="flex-1 px-3 py-3 text-sm outline-none bg-transparent uppercase tracking-wide min-w-0"
                />
                <button
                  onClick={() => applyCode()}
                  disabled={loading || !couponInput.trim()}
                  className="px-4 py-3 text-sm font-semibold text-[#6957f1] disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                </button>
              </div>
            )}
            {couponError && <p className="text-xs text-red-600 mt-2">{couponError}</p>}
          </div>

          {/* Offers list / empty state */}
          <div className="flex-1 overflow-y-auto px-5 pb-6">
            {offersLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : hasOffers ? (
              <div className="space-y-2 mt-1">
                {offers.map((offer) => (
                  <OfferRow
                    key={`s-offer-${offer.code}`}
                    offer={offer}
                    isApplied={appliedCoupon?.code === offer.code}
                    onApplyOffer={() => applyCode(offer.code)}
                  />
                ))}
              </div>
            ) : (
              <EmptyOffersState />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

const OfferRow: React.FC<{
  offer: CouponOffer;
  isApplied: boolean;
  onApplyOffer: () => void;
}> = ({ offer, isApplied, onApplyOffer }) => (
  <div
    className={cn(
      "flex items-start justify-between gap-2 border rounded-md px-3 py-2.5 text-xs",
      offer.eligible
        ? "border-gray-200 bg-white"
        : "border-gray-100 bg-gray-50 opacity-60"
    )}
  >
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5 text-gray-900 font-semibold text-[13px]">
        <Tag className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{offer.code}</span>
        {offer.eligible && offer.discountAmount !== undefined && (
          <span className="text-[#137333] font-bold ml-1">−₹{offer.discountAmount}</span>
        )}
      </div>
      {offer.label && <div className="text-[12px] text-gray-600 mt-0.5">{offer.label}</div>}
      {!offer.eligible && offer.ineligibilityReason && (
        <div className="text-[11px] text-gray-500 mt-0.5">{offer.ineligibilityReason}</div>
      )}
    </div>
    {offer.eligible && !isApplied && (
      <button
        onClick={onApplyOffer}
        className="text-[12px] font-bold text-[#6957f1] hover:underline shrink-0 tracking-wider"
      >
        APPLY
      </button>
    )}
    {isApplied && (
      <span className="text-[12px] font-bold text-green-700 tracking-wider shrink-0">APPLIED</span>
    )}
  </div>
);

const EmptyOffersState: React.FC = () => (
  <div className="flex flex-col items-center justify-center text-center pt-10 pb-6">
    <div className="relative w-24 h-24 mb-6">
      <FileSearch
        className="w-24 h-24 text-gray-300 coupon-search-wobble"
        strokeWidth={1.5}
      />
    </div>
    <p className="text-[15px] text-gray-700 font-medium">
      No Coupons are available at this moment
    </p>
  </div>
);

export default CouponSection;
