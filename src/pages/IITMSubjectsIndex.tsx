import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { unslugify } from "@/utils/urlHelpers";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/seoManager";
import { indexContent, type IndexContent, type IndexSubject } from "../../api/_shared/subjectsIndex";

/** The subject lists (/iitm-bs and /iitm-bs/<branch>/<level>), built by the same code the crawler uses. */
const NAVY = "text-[#1E3A8A]";

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
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <NavBar />
      <main className="pt-16">
        <section className="bg-gradient-to-b from-blue-50/70 to-white border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <p className="text-[11px] font-normal uppercase tracking-wider text-gray-500">IITM BS subjects</p>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-[#1f2937]">{ix?.h1 ?? "IITM BS subjects"}</h1>
            {ix && <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-gray-600">{ix.intro}</p>}
          </div>
        </section>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 bg-white">
          {state === "loading" && <p className="text-gray-500">Loading…</p>}
          {state === "missing" && <p className="text-gray-700">We could not find that list.</p>}
          {state === "ready" && ix && (
            <>
              {ix.groups.map((g) => (
                <section key={g.heading}>
                  <h2 className="text-xl font-bold text-[#1f2937]">
                    {g.path ? <Link to={g.path} className="hover:underline">{g.heading}</Link> : g.heading}
                  </h2>
                  <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {g.links.map(([href, label]) => (<li key={href}><Link to={href} className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</Link></li>))}
                  </ul>
                </section>
              ))}
              <section>
                <h2 className="text-xl font-bold text-[#1f2937]">Frequently asked questions</h2>
                <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
                  {ix.faqs.map((faq) => (
                    <details key={faq.q} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-[#1f2937]">
                        {faq.q}
                        <span aria-hidden="true" className="text-gray-400 transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="mt-3 text-[15px] leading-relaxed text-gray-600">{faq.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IITMSubjectsIndex;
