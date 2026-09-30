import { Link } from "react-router-dom";
import { infoFor } from "../../../api/_shared/seoContent";

/**
 * An introduction, related links and the frequently asked questions for the IITM BS
 * page being viewed — the same text search engines are given, shown to visitors too.
 * Questions are native <details>, so they are readable without JavaScript.
 */
const PageInfo = ({ pathname }: { pathname: string }) => {
  const info = infoFor(pathname);
  if (!info) return null;

  return (
    <section className="mt-14 border-t border-gray-100 pt-10" aria-labelledby="page-info-heading">
      <h2 id="page-info-heading" className="text-2xl font-bold text-[#1f2937] tracking-tight">{info.heading}</h2>
      <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-gray-600">{info.intro}</p>

      <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {info.links.map(([href, label]) => (
          <li key={href}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noopener" className="text-[15px] font-medium text-[#1E3A8A] hover:underline">{label}</a>
            ) : (
              <Link to={href} className="text-[15px] font-medium text-[#1E3A8A] hover:underline">{label}</Link>
            )}
          </li>
        ))}
      </ul>

      <h3 className="mt-10 text-lg font-semibold text-[#1f2937]">Frequently asked questions</h3>
      <div className="mt-4 max-w-3xl divide-y divide-gray-100 rounded-xl border border-gray-100 bg-white">
        {info.faqs.map((faq) => (
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
  );
};

export default PageInfo;
