import { lazy, Suspense, useEffect } from "react";
import { Link } from "react-router-dom";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import { FaqTable, LinkTable, TableSection } from "@/components/seo/DataTables";
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
const IITMBSPrep = lazy(() => import("@/pages/IITMBSPrep"));

/** The guide's sections, links, questions and note: the body of the page. */
const GuideSections = ({ page }: { page: ComparePage }) => (
  <div className="space-y-10">
    {page.sections.map((sec) => (
      <section key={sec.heading}>
        <h2 className="text-xl font-bold tracking-tight text-[#1f2937]">{sec.heading}</h2>
        {sec.paragraphs.map((t) => (<p key={t} className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">{t}</p>))}
        {sec.bullets && (
          <ul className="mt-4 max-w-3xl divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {sec.bullets.map((b) => (
              <li key={b} className="flex gap-3 px-5 py-3 text-[14px] leading-relaxed text-gray-700">
                <span aria-hidden="true" className="mt-0.5 text-[#6366f1]">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        )}
        {sec.links && <div className="mt-4"><LinkTable links={sec.links} heading={sec.heading} /></div>}
      </section>
    ))}

    <TableSection heading="Where to go">
      <LinkTable links={page.links} heading="Page" />
    </TableSection>

    <TableSection heading="Frequently asked questions">
      <FaqTable faqs={page.faqs} />
    </TableSection>

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

/** The main site's page header, then the introduction, the short answer and the one button, before anything else. */
const GuideHead = ({ page }: { page: ComparePage }) => (
  <>
    <ExamPrepHeader examName="IITM BS" examPath="/exam-preparation/iitm-bs" currentTab="" pageTitle={page.h1} />
    <section className="bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <p className="max-w-3xl text-[16px] leading-relaxed text-gray-600">{page.intro}</p>
        {page.answer && (
          <div className="mt-5 max-w-3xl rounded-xl border border-[#c7d2fe] bg-[#f5f6ff] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#4f46e5]">Short answer</p>
            <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#1f2937]">{page.answer.replace(/^Short answer:\s*/, "").replace(/^./, (c) => c.toUpperCase())}</p>
          </div>
        )}
        {page.cta && (
          <div className="mt-6">
            {page.cta[0].startsWith("http") ? (
              <a href={page.cta[0]} target="_blank" rel="noopener" className="inline-flex items-center rounded-lg bg-[#1E3A8A] px-6 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-[#1e40af]">{page.cta[1]}</a>
            ) : (
              <Link to={page.cta[0]} className="inline-flex items-center rounded-lg bg-[#1E3A8A] px-6 py-3 text-[15px] font-semibold text-white shadow-sm hover:bg-[#1e40af]">{page.cta[1]}</Link>
            )}
          </div>
        )}
      </div>
    </section>
  </>
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
    <div className="min-h-screen bg-white font-sans">
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
