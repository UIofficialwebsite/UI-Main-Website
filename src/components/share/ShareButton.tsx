import React, { useState } from "react";
import { Share2, Check, Copy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SITE = "https://unknowniitians.com";

export interface ShareButtonProps {
  contentType: "note" | "pyq" | "iitm_note" | "course" | "tool" | "page";
  /** id/slug of the item (optional for generic pages) */
  contentId?: string;
  title: string;
  /** Canonical relative path to redirect to, e.g. "/courses/123" */
  path: string;
  className?: string;
  /** Compact icon-only trigger vs a labelled button */
  variant?: "icon" | "button";
}

type Channel = "whatsapp" | "telegram" | "copy" | "webshare" | "x";

/**
 * Tracked share control. Each channel mints a unique /s/<token> link via the
 * create_share RPC (recording who shared what + the channel), then opens the
 * chosen app. The token redirects through the share-redirect edge function,
 * which logs clicks and serves rich previews.
 */
const ShareButton: React.FC<ShareButtonProps> = ({
  contentType,
  contentId,
  title,
  path,
  className,
  variant = "icon",
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Channel | null>(null);
  const [copied, setCopied] = useState(false);

  const mint = async (channel: Channel): Promise<string | null> => {
    const { data, error } = await supabase.rpc("create_share", {
      p_content_type: contentType,
      p_content_id: contentId ?? "",
      p_title: title,
      p_target_url: path.startsWith("/") ? path : `/${path}`,
      p_channel: channel,
    });
    if (error || !data) {
      // Fall back to the plain canonical URL so sharing still works.
      console.error("create_share failed:", error);
      return null;
    }
    return `${SITE}/s/${data}`;
  };

  const text = `${title} — Unknown IITians`;

  const share = async (channel: Channel) => {
    setBusy(channel);
    const shortUrl = (await mint(channel)) ?? `${SITE}${path.startsWith("/") ? path : `/${path}`}`;
    setBusy(null);

    if (channel === "copy") {
      try {
        await navigator.clipboard.writeText(shortUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
        toast({ title: "Link copied", description: "Share it anywhere." });
      } catch {
        toast({ title: "Couldn't copy", variant: "destructive" });
      }
      return;
    }
    if (channel === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${shortUrl}`)}`, "_blank");
    } else if (channel === "telegram") {
      window.open(
        `https://t.me/share/url?url=${encodeURIComponent(shortUrl)}&text=${encodeURIComponent(text)}`,
        "_blank"
      );
    } else if (channel === "x") {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shortUrl)}`,
        "_blank"
      );
    } else if (channel === "webshare") {
      try {
        await (navigator as Navigator).share?.({ title, text, url: shortUrl });
      } catch {
        /* user cancelled */
      }
    }
    setOpen(false);
  };

  const tryWebShareFirst = async () => {
    // On devices with the native share sheet, prefer it; else open our menu.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      await share("webshare");
    } else {
      setOpen((v) => !v);
    }
  };

  return (
    <div className={`relative inline-block ${className ?? ""}`}>
      <button
        type="button"
        onClick={tryWebShareFirst}
        aria-label="Share"
        className={
          variant === "icon"
            ? "inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            : "inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        }
      >
        <Share2 className="h-4 w-4" />
        {variant === "button" && <span>Share</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-[61] mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
            <MenuItem label="WhatsApp" busy={busy === "whatsapp"} onClick={() => share("whatsapp")} dot="#25D366" />
            <MenuItem label="Telegram" busy={busy === "telegram"} onClick={() => share("telegram")} dot="#229ED9" />
            <MenuItem label="X (Twitter)" busy={busy === "x"} onClick={() => share("x")} dot="#0f172a" />
            <MenuItem
              label={copied ? "Copied!" : "Copy link"}
              busy={busy === "copy"}
              onClick={() => share("copy")}
              icon={copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-500" />}
            />
            <button
              onClick={() => setOpen(false)}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-50"
            >
              <X className="h-4 w-4" /> Close
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const MenuItem: React.FC<{
  label: string;
  onClick: () => void;
  busy?: boolean;
  dot?: string;
  icon?: React.ReactNode;
}> = ({ label, onClick, busy, dot, icon }) => (
  <button
    onClick={onClick}
    disabled={busy}
    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
  >
    {icon ?? <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} />}
    {label}
  </button>
);

export default ShareButton;
