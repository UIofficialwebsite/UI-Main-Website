// Thin, crash-proof wrapper around GA4 (gtag) defined in index.html.
//
// Enhanced Measurement already auto-tracks page_view / scroll / outbound clicks.
// This layer adds the BUSINESS events GA can't infer: purchase, file_download,
// sign_up/login, view_item, share. Every call is wrapped so analytics can never
// throw into the app.

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

/** Fire a GA4 event. No-ops safely if gtag isn't loaded (dev, blockers, etc.). */
export function track(event: string, params: Record<string, unknown> = {}): void {
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", event, params);
    }
  } catch {
    /* analytics must never break the app */
  }
}

/** Fire an event at most once per browser session for a given key. */
export function trackOnce(key: string, event: string, params: Record<string, unknown> = {}): void {
  try {
    const k = `ga1:${key}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, "1");
  } catch {
    /* if storage is unavailable, still fire (better a dup than a miss) */
  }
  track(event, params);
}

/**
 * GA4 `purchase` — the revenue event. Deduped per order across page refreshes
 * (localStorage), since the success page can be reloaded.
 */
export function trackPurchase(o: {
  orderId: string;
  value?: number | null;
  currency?: string;
  itemId?: string | null;
  itemName?: string | null;
  coupon?: string | null;
}): void {
  const guard = `ga1:purchase:${o.orderId}`;
  try {
    if (localStorage.getItem(guard)) return;
    localStorage.setItem(guard, "1");
  } catch {
    /* proceed even if storage is blocked */
  }
  track("purchase", {
    transaction_id: o.orderId,
    value: o.value ?? undefined,
    currency: o.currency ?? "INR",
    coupon: o.coupon || undefined,
    items:
      o.itemId || o.itemName
        ? [{ item_id: o.itemId ?? undefined, item_name: o.itemName ?? undefined }]
        : undefined,
  });
}
