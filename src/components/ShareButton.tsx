import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/utils/analytics';

const SITE = 'https://unknowniitians.com';

type ContentType = 'note' | 'pyq' | 'iitm_note' | 'course' | 'tool' | 'page';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
  forceTextOnMobile?: boolean;
  /** Optional categorization for analytics; inferred from the URL when omitted. */
  contentType?: ContentType;
  contentId?: string;
}

// Reduce any URL to a same-site relative path ("/courses/123?x=1").
const toRelativePath = (url: string): string => {
  try {
    const u = new URL(url, SITE);
    return (u.pathname + u.search) || '/';
  } catch {
    return url.startsWith('/') ? url : '/';
  }
};

const inferType = (path: string): ContentType => {
  const p = path.toLowerCase();
  if (p.includes('/courses')) return 'course';
  if (p.includes('iitm-tools') || p.includes('/tools')) return 'tool';
  if (p.includes('pyq')) return 'pyq';
  if (p.includes('iitm-bs/notes') || p.includes('branch')) return 'iitm_note';
  if (p.includes('note')) return 'note';
  return 'page';
};

const newToken = (): string => {
  const raw =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  return raw.replace(/[^a-z0-9]/gi, '').slice(0, 16);
};

/**
 * Site-wide share button. Mints a tracked /s/<token> short link, opens the
 * native share sheet (or copies), and records the share in the background. The
 * token is generated client-side so the share sheet opens synchronously within
 * the click (no lost user-gesture from awaiting the network).
 */
export const ShareButton: React.FC<ShareButtonProps> = ({
  url,
  title,
  description,
  variant = 'outline',
  size = 'sm',
  className,
  showText = false,
  contentType,
  contentId,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const token = newToken();
    const relPath = toRelativePath(url);
    // YouTube-style: the REAL page URL + a ?si=<token> tracking code, so the link
    // is trustworthy (students see the actual page, not an opaque redirect).
    const sep = relPath.includes('?') ? '&' : '?';
    const shareLink = `${SITE}${relPath}${sep}si=${token}`;
    const ctype = contentType ?? inferType(relPath);
    let channel = 'copy';

    // Share/copy FIRST so we keep the user-gesture, THEN record (fire-and-forget).
    try {
      if (navigator.share) {
        channel = 'webshare';
        navigator
          .share({ title, text: description || `Check out: ${title}`, url: shareLink })
          .catch(() => {});
      } else {
        await navigator.clipboard.writeText(shareLink);
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }

    // GA4 share event (method = channel used).
    track('share', { method: channel, content_type: ctype, item_id: contentId ?? undefined });

    supabase
      .rpc('record_share', {
        p_token: token,
        p_content_type: ctype,
        p_content_id: contentId ?? '',
        p_title: title,
        p_target_url: relPath,
        p_channel: channel,
      })
      .then(
        () => {},
        () => {}
      );
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      className={cn('rounded-md border-gray-200 hover:border-black transition-all h-9 px-3', className)}
    >
      {copied ? <Check className="h-4 w-4" /> : <Share className="h-4 w-4" />}
      {showText && <span className="ml-2 font-semibold">{copied ? 'Copied' : 'Share'}</span>}
    </Button>
  );
};
