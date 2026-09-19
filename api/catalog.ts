/**
 * GET /api/catalog?course_id=<uuid>
 *
 * Feeds the "Explore this batch" section on a course page: every subject,
 * lecture and note that the batch actually contains, pulled live out of the
 * portal.
 *
 * Nothing about the contents is written down on this side. We resolve the
 * course to its ERP batch name (the override map, falling back to the course
 * title) and ask the portal what is in it. Add a lecture in the portal and it
 * appears here on the next revalidation.
 *
 * The upstream response carries no playable address at all — see the portal's
 * public-catalog function. So this route is safe to cache publicly and serve to
 * signed-out visitors, which is the whole point: the page is fully indexable
 * and Supabase is read once per window instead of once per visitor.
 *
 * Unlocking anything goes through /api/unlock, which checks payment.
 */

export const config = { runtime: "edge" };

const SUPABASE_URL = "https://qzrvctpwefhmcduariuw.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6cnZjdHB3ZWZobWNkdWFyaXV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1MTAxNDYsImV4cCI6MjA2MjA4NjE0Nn0.VK1JfGf1zhXbiOc_1N03HQnA0xlpGoynjXRkb_k2NJ0";

const ERP_FUNCTIONS_URL =
  process.env.ERP_FUNCTIONS_URL ?? "https://lcfzfdjeidinenxcucvj.supabase.co/functions/v1";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMPTY = { subjects: [], totals: { video: 0, note: 0, dpp: 0, free: 0 } };

function json(body: unknown, status = 200, cache?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": cache ?? "private, no-store",
    },
  });
}

export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  const courseId = new URL(req.url).searchParams.get("course_id")?.trim();
  if (!courseId || !UUID_RE.test(courseId)) {
    return json({ error: "Missing or malformed course_id" }, 400);
  }

  try {
    // course -> ERP batch name. course_erp_batch() prefers an explicit override
    // in course_batch_map and falls back to courses.title, which is the string
    // create-cashfree-order already writes onto every payment.
    const batchRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/course_erp_batch`, {
      method: "POST",
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_course_id: courseId }),
    });

    if (!batchRes.ok) {
      console.error("course_erp_batch failed", batchRes.status);
      return json({ batch: null, preview_enabled: false, ...EMPTY }, 200, "public, s-maxage=60");
    }

    const batch = (await batchRes.json()) as string | null;
    if (!batch) {
      // Course has no matching batch — render the page without an Explore tab.
      return json(
        { batch: null, preview_enabled: false, ...EMPTY },
        200,
        "public, s-maxage=600, stale-while-revalidate=3600",
      );
    }

    const catalogRes = await fetch(
      `${ERP_FUNCTIONS_URL}/public-catalog?batch=${encodeURIComponent(batch)}`,
      { headers: { Accept: "application/json" } },
    );

    if (!catalogRes.ok) {
      console.error("public-catalog failed", catalogRes.status);
      // Short cache on failure so a blip doesn't get pinned at the edge for
      // ten minutes.
      return json({ batch, preview_enabled: false, ...EMPTY }, 200, "public, s-maxage=30");
    }

    const catalog = await catalogRes.json();

    return json(catalog, 200, "public, s-maxage=600, stale-while-revalidate=3600");
  } catch (err) {
    console.error("catalog route error", err);
    return json({ batch: null, preview_enabled: false, ...EMPTY }, 200, "public, s-maxage=30");
  }
}
