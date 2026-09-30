import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { useDocumentTitle, useCanonicalUrl } from "@/utils/seoManager";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import LectureShelf from "@/components/iitm/LectureShelf";
import PaidCoursesTab from "@/components/iitm/PaidCoursesTab";
import { COMPARE_DISCLAIMER, comparePageFor } from "../../api/_shared/comparePages";
import type { ComparePage } from "../../api/_shared/pageTypes";

/**
 * The guide pages. The words come from the shared page data, the same file the crawler function reads,
 * so search engines read what is shown here. A page that is about using a tool IS that tool's page: it
 * shows the real tools page (same header, tabs, filters and calculators) held on the guide's own address,
 * with the guide's text below it.
 */
const NAVY = "text-[#1E3A8A]";
const IITMBSPrep = lazy(() => import("@/pages/IITMBSPrep"));

/** The guide's sections, links, questions and note: the body of the page. */
const GuideSections = ({ page }: { page: ComparePage }) => (
  <div className="space-y-10">
    {page.sections.map((sec) => (
      <section key={sec.heading}>
        <h2 className="text-xl font-bold text-[#1f2937]">{sec.heading}</h2>
        {sec.paragraphs.map((t) => (<p key={t} className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">{t}</p>))}
        {sec.bullets && (
          <ul className="mt-3 list-disc pl-5 space-y-1 text-[15px] text-gray-600">
            {sec.bullets.map((b) => (<li key={b}>{b}</li>))}
          </ul>
        )}
        {sec.links && (
          <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {sec.links.map(([href, label]) => (
              <li key={href}>
                {href.startsWith("http") ? (
                  <a href={href} target="_blank" rel="noopener" className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</a>
                ) : (
                  <Link to={href} className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    ))}

    <section>
      <h2 className="text-xl font-bold text-[#1f2937]">Where to go</h2>
      <ul className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {page.links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noopener" className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</a>
            ) : (
              <Link to={href} className={`text-[15px] font-medium ${NAVY} hover:underline`}>{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </section>

    <section>
      <h2 className="text-xl font-bold text-[#1f2937]">Frequently asked questions</h2>
      <div className="mt-4 divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
        {page.faqs.map((faq) => (
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

    <p className="text-xs text-gray-400">{COMPARE_DISCLAIMER}</p>
  </div>
);

/** The live courses, as on the courses page: for guides whose visitor came to see them. */
const LiveCourses = () => {
  const { loadCourses } = useBackend();
  useEffect(() => { loadCourses(); }, [loadCourses]);
  return (
    <PaidCoursesTab branch="All Branches" levels={[]} subjects={[]} priceRange={null} newlyLaunched={false} fasttrackOnly={false} bestSellerOnly={false} />
  );
};

/** The page's own heading and introduction, the short answer and the one button, before anything else. */
const GuideHead = ({ page }: { page: ComparePage }) => (
  <section className="bg-gradient-to-b from-blue-50/70 to-white border-b border-blue-100">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <p className="text-[11px] font-normal uppercase tracking-wider text-gray-500">IITM BS study resources</p>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight text-[#1f2937]">{page.h1}</h1>
      <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-gray-600">{page.intro}</p>
      {page.answer && (
        <p className="mt-5 max-w-3xl rounded-xl border border-blue-100 bg-white p-4 text-[15px] font-medium leading-relaxed text-[#1f2937]">{page.answer}</p>
      )}
      {page.cta && (
        <div className="mt-6">
          {page.cta[0].startsWith("http") ? (
            <a href={page.cta[0]} target="_blank" rel="noopener" className="inline-flex items-center rounded-lg bg-[#1E3A8A] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#1e40af]">{page.cta[1]}</a>
          ) : (
            <Link to={page.cta[0]} className="inline-flex items-center rounded-lg bg-[#1E3A8A] px-6 py-3 text-[15px] font-semibold text-white hover:bg-[#1e40af]">{page.cta[1]}</Link>
          )}
        </div>
      )}
    </div>
  </section>
);

const CompareResources = ({ path }: { path: string }) => {
  const page = comparePageFor(path);
  useDocumentTitle(page?.title ?? "IITM BS resources", false);
  useCanonicalUrl(path);
  if (!page) return null;

  // A guide about using a tool: the tools page itself, on this address, with the guide below.
  if (page.embed === "tools") {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#fcfcfc]" />}>
        <IITMBSPrep
          fixed={{ tool: "grade-calculator", path: page.path, title: page.title, heading: page.h1 }}
          below={
            <section className="mt-14 border-t border-gray-100 pt-10">
              <p className="max-w-3xl text-[16px] leading-relaxed text-gray-600">{page.intro}</p>
              <div className="mt-10"><GuideSections page={page} /></div>
            </section>
          }
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <NavBar />
      <main className="pt-16">
        <GuideHead page={page} />
        {page.embed === "lectures" && page.lectureGroups && (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"><LectureShelf groups={page.lectureGroups} /></div>
        )}
        {page.embed === "courses" && (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"><LiveCourses /></div>
        )}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-white">
          <GuideSections page={page} />
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default CompareResources;
