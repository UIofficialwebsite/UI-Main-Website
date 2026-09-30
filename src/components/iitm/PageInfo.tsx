import { infoFor } from "../../../api/_shared/seoContent";
import { FaqTable, LinkTable, TableSection } from "@/components/seo/DataTables";

/**
 * An introduction, related pages and the frequently asked questions for the page being viewed: the same
 * text search engines are given, shown to visitors as two neat tables.
 */
const PageInfo = ({ pathname }: { pathname: string }) => {
  const info = infoFor(pathname);
  if (!info) return null;

  return (
    <section className="mt-14 border-t border-gray-100 pt-10" aria-labelledby="page-info-heading">
      <h2 id="page-info-heading" className="text-2xl font-bold tracking-tight text-[#1f2937]">{info.heading}</h2>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">{info.intro}</p>

      <div className="mt-8 space-y-10">
        <TableSection heading="Explore">
          <LinkTable links={info.links} heading="Where to go" />
        </TableSection>
        <TableSection heading="Frequently asked questions">
          <FaqTable faqs={info.faqs} />
        </TableSection>
      </div>
    </section>
  );
};

export default PageInfo;
