import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Live contents of a course's batch, straight from the SSP portal.
 *
 * Everything here is generated — subjects, chapters and titles all come from
 * the lectures and notes that actually exist in the portal right now. Nothing
 * about any course is listed in this file.
 *
 * The catalog carries no playable address. Opening an item is a separate,
 * per-item request (`unlockItem`) that checks payment server-side.
 */

export type CatalogItemType = 'video' | 'note' | 'dpp';

export interface CatalogItem {
  id: string;
  type: CatalogItemType;
  title: string;
  topic: string | null;
  date: string | null;
  /** Admin marked this openable without buying the batch. Still needs a login. */
  free: boolean;
}

export interface CatalogSubject {
  subject: string;
  counts: { video: number; note: number; dpp: number; free: number };
  items: CatalogItem[];
}

export interface CourseCatalog {
  batch: string | null;
  preview_enabled: boolean;
  subjects: CatalogSubject[];
  totals: { video: number; note: number; dpp: number; free: number };
}

export type UnlockResult =
  | { allowed: true; type: CatalogItemType; title: string; url: string; free: boolean }
  | { allowed: false; reason: 'login_required' | 'not_purchased' | 'not_found' | 'no_content' | 'unavailable' | 'bad_request' | 'forbidden'; batch?: string; subject?: string };

export const useCourseCatalog = (courseId: string | undefined) =>
  useQuery<CourseCatalog>({
    queryKey: ['course-catalog', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/catalog?course_id=${encodeURIComponent(courseId!)}`);
      if (!res.ok) throw new Error('Could not load the batch contents');
      return (await res.json()) as CourseCatalog;
    },
    enabled: !!courseId,
    // The catalog is the same for everyone and already cached at the edge;
    // there is no reason for a visitor to re-fetch it while browsing.
    staleTime: 10 * 60_000,
    retry: 1,
  });

/**
 * Asks the server to open ONE item.
 *
 * The session token is attached so /api/unlock can verify who is asking. It is
 * the server, not this function, that decides — a denial comes back as a reason
 * with no URL attached, which is what the paywall renders.
 */
export const unlockItem = async (catalogId: string): Promise<UnlockResult> => {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch('/api/unlock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify({ catalog_id: catalogId }),
  });

  return (await res.json().catch(() => ({ allowed: false, reason: 'unavailable' }))) as UnlockResult;
};
