import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import { FaqTable, TableSection, TableShell } from "@/components/seo/DataTables";
import { supabase } from "@/integrations/supabase/client";
import { unslugify } from "@/utils/urlHelpers";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/seoManager";
import { indexContent, type IndexContent, type IndexSubject } from "../../api/_shared/subjectsIndex";

/** The subject lists (/iitm-bs and /iitm-bs/<branch>/<level>), built by the same code the crawler uses. */
interface SubjectRow { subject_name: string; branch: string; level: string }

const IITMSubjectsIndex = () => {
  const { branch, level } = useParams<{ branch?: string; level?: string }>();
  const [ix, setIx] = useState<IndexContent | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const dbBranch = branch ? unslugify(branch) : null;
  const dbLevel = level ? unslugify(level) : null;

  useDocumentTitle(ix?.title ?? "IITM BS subjects", false);
  useCanonicalUrl(branch && level ? `/iitm-bs/${branch}/${level}` : "/iitm-bs");

  useEffect(() => {
    let live = true;
    (async () => {
      const { data } = await supabase.from("iitm_bs_subjects").select("subject_name, branch, level").order("display_order", { ascending: true }).limit(500);
      const all: IndexSubject[] = ((data || []) as SubjectRow[]).map((r) => ({ branch: r.branch, level: r.level, name: r.subject_name }));
      const content = indexContent(dbBranch, dbLevel, all);
      if (!live) return;
      setIx(content);
      setState(content.groups.length ? "ready" : "missing");
    })();
    return () => { live = false; };
  }, [dbBranch, dbLevel]);

  return (
    <div className="min-h-screen bg-white font-sans">
      <NavBar />
      <main className="pt-16">
        <ExamPrepHeader examName="IITM BS" examPath="/exam-preparation/iitm-bs" currentTab="" pageTitle={ix?.h1 ?? "IITM BS subjects"} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-white">
          {ix && <p className="max-w-3xl text-[16px] leading-relaxed text-gray-600">{ix.intro}</p>}
          {state === "loading" && <p className="text-gray-500">Loading…</p>}
          {state === "missing" && <p className="text-gray-700">We could not find that list.</p>}
          {state === "ready" && ix && (
            <>
              {ix.groups.map((g) => (
                <TableSection key={g.heading} heading={g.heading}>
                  <TableShell>
                    <table className="w-full text-left text-[14px]">
                      <thead className="bg-[#f5f6ff] text-[12px] uppercase tracking-wider text-gray-500">
                        <tr>
                          <th scope="col" className="px-5 py-3 font-medium">Subject</th>
                          <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Also searched as</th>
                          <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Open</span></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {g.rows.map((r) => (
                          <tr key={r.href} className="transition-colors hover:bg-[#f8f9ff]">
                            <td className="px-5 py-3">
                              <Link to={r.href} className="font-semibold text-[#1E3A8A] hover:underline">{r.short}</Link>
                              {r.short !== r.full && <span className="block text-[13px] text-gray-500">{r.full}</span>}
                            </td>
                            <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{r.also.join(", ")}</td>
                            <td className="px-4 py-3 text-right text-gray-400" aria-hidden="true">→</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableShell>
                  {g.path && (
                    <p className="mt-2 text-[13px]"><Link to={g.path} className="font-medium text-[#1E3A8A] hover:underline">See the {g.heading} list on its own page</Link></p>
                  )}
                </TableSection>
              ))}
              <TableSection heading="Frequently asked questions">
                <FaqTable faqs={ix.faqs} />
              </TableSection>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IITMSubjectsIndex;
