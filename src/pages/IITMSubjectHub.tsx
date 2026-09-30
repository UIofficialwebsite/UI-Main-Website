import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import BranchNotesTab from "@/components/iitm/BranchNotesTab";
import PYQsTab from "@/components/iitm/PYQsTab";
import GradeCalculator from "@/components/iitm/GradeCalculator";
import PaidCoursesTab from "@/components/iitm/PaidCoursesTab";
import LectureShelf from "@/components/iitm/LectureShelf";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import { normaliseProgramme } from "@/components/iitm/data/curriculumConfig";
import { SUBJECT_CALC } from "@/components/iitm/data/subjectCalcMap";
import { supabase } from "@/integrations/supabase/client";
import { slugify, unslugify } from "@/utils/urlHelpers";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/seoManager";
import { hubContent, type HubContent } from "../../api/_shared/subjectHub";
import { playlistId } from "../../api/_shared/lectures";

/**
 * One page per IITM BS subject, and the page has the subject's things ON it: its notes, its lectures
 * playing in the page, its previous year papers, the grade calculator and the live batches, in tabs
 * that switch in place. The words underneath (introduction, questions, other subjects) come from
 * hubContent(), the same builder the crawler function uses.
 */
const NAVY = "text-[#1E3A8A]";

interface SubjectRow { id: number; subject_name: string }
interface NoteRow { title: string; week_number: number | null }
interface CourseRow { id: string; title: string; price: number | string | null }

type TabId = "notes" | "lectures" | "pyqs" | "grade" | "batches";

const IITMSubjectHub = () => {
  const { branch = "", level = "", subject = "" } = useParams<{ branch: string; level: string; subject: string }>();
  const { loadCourses, loadIitmBranchPyqs } = useBackend();
  const [hub, setHub] = useState<HubContent | null>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  // ?tab=lectures|pyqs|grade|batches opens that tab, so a tab can be linked to directly.
  const [searchParams] = useSearchParams();
  const wanted = searchParams.get("tab");
  const startTab: TabId = (["notes", "lectures", "pyqs", "grade", "batches"] as const).find((t) => t === wanted) ?? "notes";
  const [tab, setTab] = useState<TabId>(startTab);

  const dbBranch = unslugify(branch);
  const dbLevel = unslugify(level);

  useDocumentTitle(hub?.title ?? "IITM BS", false);
  useCanonicalUrl(`/iitm-bs/${branch}/${level}/${subject}`);

  useEffect(() => {
    loadCourses();
    loadIitmBranchPyqs();
  }, [loadCourses, loadIitmBranchPyqs]);

  useEffect(() => {
    let live = true;
    setState("loading");
    setTab(startTab);
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
      setName(String(found.subject_name));
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
  }, [dbBranch, dbLevel, subject, startTab]);

  const tabs: Array<[TabId, string]> = [["notes", "Notes"]];
  if (hub && hub.lectures.length > 0) tabs.push(["lectures", "Lectures"]);
  tabs.push(["pyqs", "PYQs"], ["grade", "Grade calculator"], ["batches", "Live batches"]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <NavBar />
      <main className="pt-16">
        <ExamPrepHeader examName="IITM BS" examPath="/exam-preparation/iitm-bs" currentTab="" pageTitle={hub?.h1 ?? `IITM BS ${unslugify(subject)}`} />

        {state === "ready" && hub && (
          <>
            <div className="w-full bg-[#eef0ff]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 overflow-x-auto pt-5" role="tablist" aria-label={`${name} resources`}>
                {tabs.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`pb-2 text-[14px] md:text-[15px] whitespace-nowrap transition-all ${tab === id ? "text-[#6366f1] border-b-[3px] border-[#6366f1] font-semibold" : "text-[#6b7280] font-medium"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <section className="py-8 bg-white min-h-[420px]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {tab === "notes" && <BranchNotesTab branch={dbBranch} level={dbLevel} specialization={null} selectedSubjects={[name]} />}
                {tab === "lectures" && (
                  <div className="max-w-4xl">
                    <LectureShelf groups={[{ heading: name, ids: hub.lectures.map(([url]) => playlistId(url)) }]} />
                  </div>
                )}
                {tab === "pyqs" && <PYQsTab branch={dbBranch} level={dbLevel} years={[]} examTypes={[]} subjects={[name]} />}
                {tab === "grade" && (() => {
                  // This subject's own course, already chosen; the full calculator is one button away.
                  const calc = SUBJECT_CALC[`${branch}/${level}/${subject}`];
                  return (
                    <GradeCalculator
                      branch={normaliseProgramme(dbBranch)}
                      level={calc ? calc[0] : dbLevel.toLowerCase() === "qualifier" ? "foundation" : dbLevel.toLowerCase()}
                      lockedKey={calc ? calc[1] : ""}
                      lockedName={name}
                    />
                  );
                })()}
                {tab === "batches" && <PaidCoursesTab branch={dbBranch} levels={[dbLevel]} subjects={[]} priceRange={null} newlyLaunched={false} fasttrackOnly={false} bestSellerOnly={false} />}
              </div>
            </section>

            {/* The words for readers and search engines: what this page is, the other subjects, the questions. */}
            <section className="bg-white border-t border-gray-100">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
                <div>
                  <h2 className="text-xl font-bold text-[#1f2937]">About {name}</h2>
                  <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">{hub.intro}</p>
                </div>
                {hub.siblingLinks.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-[#1f2937]">Other {dbLevel} subjects</h2>
                    <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                      {hub.siblingLinks.map(([href, label]) => (<li key={href}><Link to={href} className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</Link></li>))}
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
            </section>
          </>
        )}

        {state === "loading" && <div className="max-w-4xl mx-auto px-4 py-12"><p className="text-gray-500">Loading…</p></div>}
        {state === "missing" && (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <p className="text-gray-700">We could not find that subject.</p>
            <Link to="/iitm-bs" className={`mt-3 inline-block font-medium ${NAVY} hover:underline`}>See every IITM BS subject</Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default IITMSubjectHub;
