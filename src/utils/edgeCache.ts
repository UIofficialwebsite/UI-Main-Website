// Client side of the edge cache (api/cached-reads.ts).
//
// `cachedRead` tries the CDN-cached endpoint first; on ANY failure it runs the
// provided direct-Supabase fallback. So the edge layer only ever ADDS a saving —
// if it's slow/broken/not yet deployed, behaviour is exactly as before.

type Fallback<T> = () => Promise<T>;

export type CachedResource =
  | "courses"
  | "notes"
  | "pyqs"
  | "important_dates"
  | "news_updates"
  | "communities"
  | "jobs"
  | "iitm_branch_notes"
  | "iitm_branch_pyqs"
  | "page_banners";

export async function cachedRead<T>(
  resource: CachedResource,
  fallback: Fallback<T>,
  exam?: string,
  page?: string
): Promise<T> {
  try {
    const url =
      `/api/cached-reads?r=${encodeURIComponent(resource)}` +
      (exam ? `&exam=${encodeURIComponent(exam)}` : "") +
      (page ? `&page=${encodeURIComponent(page)}` : "");
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`edge ${resource} ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}
