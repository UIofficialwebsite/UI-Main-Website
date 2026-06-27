// Client side of the edge cache (api/cached-reads.ts).
//
// `cachedRead` tries the CDN-cached endpoint first; on ANY failure it runs the
// provided direct-Supabase fallback. So the edge layer only ever ADDS a saving —
// if it's slow/broken/not yet deployed, behaviour is exactly as before.

type Fallback<T> = () => Promise<T>;

export async function cachedRead<T>(
  resource: "courses" | "notes" | "pyqs",
  fallback: Fallback<T>,
  exam?: string
): Promise<T> {
  try {
    const url =
      `/api/cached-reads?r=${encodeURIComponent(resource)}` +
      (exam ? `&exam=${encodeURIComponent(exam)}` : "");
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`edge ${resource} ${res.status}`);
    return (await res.json()) as T;
  } catch {
    return fallback();
  }
}
