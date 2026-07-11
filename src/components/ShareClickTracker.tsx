import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PENDING_KEY = "pending_si_click";

/**
 * When a visitor lands on a real page carrying a ?si=<token> share code, log the
 * click against that share, then strip ?si from the URL so it stays clean. Mount
 * once inside the Router.
 *
 * If the visitor isn't logged in yet (e.g. a shared link to a gated file that
 * forces login), the click is first recorded as Anonymous, but its id is stashed
 * — once they log in we attach their identity to it, so the sender's log shows
 * their real name instead of "Anonymous".
 */
const ShareClickTracker = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const si = params.get("si");
    if (!si) return;

    supabase
      .rpc("log_si_click", {
        p_token: si,
        p_ref: document.referrer || null,
        p_ua: navigator.userAgent,
      })
      .then(
        ({ data }) => {
          // Stash the click id so a later login can attach the user to it.
          if (data) {
            try {
              localStorage.setItem(PENDING_KEY, JSON.stringify({ id: data, ts: Date.now() }));
            } catch {
              /* ignore */
            }
          }
        },
        () => {}
      );

    params.delete("si");
    const clean =
      location.pathname + (params.toString() ? `?${params.toString()}` : "") + location.hash;
    window.history.replaceState({}, "", clean);
  }, [location.pathname, location.search, location.hash]);

  // Once the visitor is logged in, attach their identity to a recent anonymous
  // click (turns "Anonymous" into their name in the sender's log).
  useEffect(() => {
    if (!user) return;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
    if (!raw) return;
    try {
      const { id, ts } = JSON.parse(raw) as { id: string; ts: number };
      // Only attach if the click was recent, to avoid stale attribution.
      if (id && Date.now() - ts < 30 * 60 * 1000) {
        supabase.rpc("attach_si_click", { p_click: id }).then(
          () => {},
          () => {}
        );
      }
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
  }, [user]);

  return null;
};

export default ShareClickTracker;
