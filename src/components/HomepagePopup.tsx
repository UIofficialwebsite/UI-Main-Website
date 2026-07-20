import React, { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Popup {
  id: string;
  image_url: string | null;
  link_url: string;
  /** Optional — when empty no button is shown and the poster itself is the link. */
  button_text: string | null;
}

// Convert a normal YouTube link into an embeddable URL (used when a popup has no
// poster image). Returns null if it isn't a recognizable YouTube video.
const toYouTubeEmbed = (url: string): string | null => {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      if (u.searchParams.get("v")) return `https://www.youtube-nocookie.com/embed/${u.searchParams.get("v")}`;
      const m = u.pathname.match(/\/(embed|shorts)\/([^/?]+)/);
      if (m) return `https://www.youtube-nocookie.com/embed/${m[2]}`;
    }
    return null;
  } catch {
    return null;
  }
};

const STORAGE_KEY = "ui-homepage-popup-seen";

const HomepagePopup: React.FC = () => {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // homepage_popups is newer than the generated types — cast the client.
      const { data, error } = await (supabase as any)
        .from("homepage_popups")
        .select("id, image_url, link_url, button_text, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false }); // newest first
      if (cancelled || error || !data || data.length === 0) return;

      // Show once per person (localStorage), but re-show whenever a NEWER popup
      // is inserted: the newest row's created_at is the "version" we remember.
      const newest = String(data[0].created_at);
      let seen: string | null = null;
      try {
        seen = localStorage.getItem(STORAGE_KEY);
      } catch {
        /* storage blocked — still show */
      }
      if (seen === newest) return; // already saw the latest — nothing new

      setPopups(data as Popup[]);
      setOpen(true);
      try {
        localStorage.setItem(STORAGE_KEY, newest);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-scroll fast through the entries so the user quickly sees what's there.
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!open || paused || popups.length <= 1) return;
    timer.current = window.setInterval(() => {
      setIndex((i) => (i + 1) % popups.length);
    }, 2200);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [open, paused, popups.length]);

  const current = popups[index];
  const embed = useMemo(
    () => (current && !current.image_url ? toYouTubeEmbed(current.link_url) : null),
    [current]
  );

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[60000] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-[92vw] max-w-[860px] sm:w-[70vw] max-h-[92vh] sm:h-[70vh] bg-white rounded-lg shadow-2xl flex flex-col px-5 pb-5 pt-12 sm:px-6 sm:pb-6 sm:pt-14 font-['Inter',sans-serif]"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 grid place-items-center h-8 w-8 rounded-full bg-black/55 text-white hover:bg-black/75 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Poster / video area — inner padded frame.
            Mobile: fixed 16:9 rectangle so landscape thumbnails/videos fit the
            width cleanly. Desktop: fills the tall modal. */}
        <div className="w-full aspect-video sm:aspect-auto sm:flex-1 min-h-0 rounded-md border border-neutral-200 bg-neutral-950 overflow-hidden flex items-center justify-center">
          {current.image_url ? (
            <a href={current.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
              <img
                src={current.image_url}
                alt="Announcement"
                className="w-full h-full object-contain"
                loading="eager"
              />
            </a>
          ) : embed ? (
            <iframe
              src={embed}
              title="Announcement video"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <a
              href={current.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/90 underline text-sm px-6 text-center break-all"
            >
              {current.link_url}
            </a>
          )}
        </div>

        {/* Button — small, sized to its text. Hidden when no label is set;
            the poster above stays clickable and opens the same link. */}
        <div className="shrink-0 pt-3 flex flex-col items-center gap-2.5">
          {current.button_text?.trim() && (
            <a
              href={current.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#1E3A8A] text-white font-normal text-sm px-6 py-2 rounded-md hover:bg-[#152a63] transition-colors font-['Inter',sans-serif]"
            >
              {current.button_text.trim()}
            </a>
          )}

          {/* Dots */}
          {popups.length > 1 && (
            <div className="flex items-center gap-1.5">
              {popups.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-[#1E3A8A]" : "w-1.5 bg-neutral-300"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomepagePopup;
