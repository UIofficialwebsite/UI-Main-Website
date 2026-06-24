import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * When a visitor lands on a real page carrying a ?si=<token> share code, log the
 * click against that share, then strip ?si from the URL so it stays clean. Mount
 * once inside the Router.
 */
const ShareClickTracker = () => {
  const location = useLocation();

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
        () => {},
        () => {}
      );

    params.delete("si");
    const clean =
      location.pathname + (params.toString() ? `?${params.toString()}` : "") + location.hash;
    window.history.replaceState({}, "", clean);
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default ShareClickTracker;
