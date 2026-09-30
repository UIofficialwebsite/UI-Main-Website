import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import { supabase } from "@/integrations/supabase/client";
import { slugify, unslugify } from "@/utils/urlHelpers";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/seoManager";
import { hubContent, type HubContent } from "../../api/_shared/subjectHub";

/**
 * One page per IITM BS subject: its notes, its previous year papers on Quiz Space, the
 * calculators and the live batches for its level. The words come from hubContent(), the same
 * builder the crawler function uses, so what Google reads is what is shown here.
 */
const NAVY = "text-[#1E3A8A]";

interface SubjectRow { id: number; subject_name: string }
interface NoteRow { title: string; week_number: number | null }
interface CourseRow { id: string; title: string; price: number | string | null }

const HubLink = ({ href, label }: { href: string; label: string }) =>
  href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener" className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</a>
  ) : (
    <Link to={href} className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</Link>
  );

const IITMSubjectHub = () => {
  const { branch = "", level = "", subject = "" } = useParams<{ branch: string; level: string; subject: string }>();
  const [hub, setHub] = useState<HubContent | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  const dbBranch = unslugify(branch);
  const dbLevel = unslugify(level);

  useDocumentTitle(hub?.title ?? "IITM BS", false);
  useCanonicalUrl(`/iitm-bs/${branch}/${level}/${subject}`);

  useEffect(() => {
    let live = true;
    setState("loading");
    (async () => {
      const { data: subjects } = await supabase
        .from("iitm_bs_subjects")
        .select("id, subject_name")
        .eq("branch", dbBranch)
        .eq("level", dbLevel)
        .order("display_order", { ascending: true });
      const rows = (subjects || []) as SubjectRow[];
      const found = rows.find((s) => slugify(String(s.subject_name)) === subject);
      if (!found) { if (live) setState("missing"); return; }
      const [notes, batches] = await Promise.all([
        supabase.from("iitm_branch_notes").select("title, week_number").eq("subject_id", found.id).eq("is_active", true).order("week_number", { ascending: true }),
        supabase.from("courses").select("id, title, price").eq("is_live", true).eq("exam_category", "IITM BS").eq("branch", dbBranch).eq("level", dbLevel).order("title", { ascending: true }),
      ]);
      if (!live) return;
      setHub(
        hubContent({
          branch: dbBranch,
          level: dbLevel,
          subject: String(found.subject_name),
          notes: ((notes.data || []) as NoteRow[]).map((x) => ({ title: String(x.title), week: x.week_number ?? null })),
          batches: ((batches.data || []) as CourseRow[]).map((x) => ({ id: String(x.id), title: String(x.title), price: x.price == null ? null : Number(x.price) })),
          siblings: rows.map((s) => String(s.subject_name)),
        }),
      );
      setState("ready");
    })();
    return () => { live = false; };
  }, [dbBranch, dbLevel, subject]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <NavBar />
      <main className="pt-16">
        <ExamPrepHeader
          examName="IITM BS"
          examPath="/exam-preparation/iitm-bs"
          currentTab=""
          pageTitle={hub?.h1 ?? `IITM BS ${unslugify(subject)}`}
        />
        <section className="py-10 bg-white min-h-[520px]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {state === "loading" && <p className="text-gray-500">Loading…</p>}
            {state === "missing" && (
              <div>
                <p className="text-gray-700">We could not find that subject.</p>
                <Link to="/exam-preparation/iitm-bs/notes" className={`mt-3 inline-block font-medium ${NAVY} hover:underline`}>Browse all IITM BS notes</Link>
              </div>
            )}
            {state === "ready" && hub && (
              <div className="space-y-10">
                <p className="max-w-3xl text-[16px] leading-relaxed text-gray-600">{hub.intro}</p>

                <div>
                  <h2 className="text-xl font-bold text-[#1f2937]">Where to go</h2>
                  <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {hub.links.map(([href, label]) => (<li key={href}><HubLink href={href} label={label} /></li>))}
                  </ul>
                </div>

                {hub.noteTitles.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[#1f2937]">Notes in this subject</h2>
                    <ul className="mt-4 list-disc pl-5 space-y-1 text-[15px] text-gray-600">
                      {hub.noteTitles.map((t, i) => (<li key={`${t}-${i}`}>{t}</li>))}
                    </ul>
                  </div>
                )}

                {hub.batches.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[#1f2937]">Live batches for {dbLevel}</h2>
                    <ul className="mt-4 space-y-2">
                      {hub.batches.map(([href, label]) => (<li key={href}><HubLink href={href} label={label} /></li>))}
                    </ul>
                  </div>
                )}

                {hub.siblingLinks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[#1f2937]">Other {dbLevel} subjects</h2>
                    <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                      {hub.siblingLinks.map(([href, label]) => (<li key={href}><HubLink href={href} label={label} /></li>))}
                    </ul>
                  </div>
                )}

                <div>
                  <h2 className="text-xl font-bold text-[#1f2937]">Frequently asked questions</h2>
                  <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                    {hub.faqs.map((faq) => (
                      <details key={faq.q} className="group px-5 py-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[#1f2937]">
                          {faq.q}
                          <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-45">+</span>
                        </summary>
                        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{faq.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default IITMSubjectHub;
