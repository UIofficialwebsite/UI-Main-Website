import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/**
 * The neat tables for the text under the pages: where to go next, and the questions and answers.
 * Light header row, thin dividers, and rows that stack on a phone: the same idea as Quiz Space's tables,
 * in the main site's own colours.
 */

/** What kind of page a link leads to, from its address. */
function kindOf(href: string): string {
  if (/youtube\.com\/playlist/.test(href)) return "Video playlist";
  if (/youtube\.com/.test(href)) return "YouTube";
  if (/quizspace\./.test(href)) return "Quiz Space";
  if (/study\.iitm\.ac\.in/.test(href)) return "Official site";
  if (/^\/iitm-bs\/[^/]+\/[^/]+\/[^/]+$/.test(href)) return "Subject page";
  if (/^\/iitm-bs(\/[^/]+\/[^/]+)?$/.test(href)) return "Subject list";
  if (/\/tools\//.test(href)) return "Calculator";
  if (/\/notes/.test(href)) return "Notes";
  if (/\/pyqs/.test(href)) return "PYQs";
  if (/^\/courses/.test(href)) return "Courses";
  if (/^\/career/.test(href)) return "Careers";
  return "Guide";
}

const HEAD = "bg-[#f5f6ff] text-[12px] uppercase tracking-wider text-gray-500";

export const TableShell = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">{children}</div>
);

const Anchor = ({ href, children, className }: { href: string; children: ReactNode; className: string }) =>
  href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener" className={className}>{children}</a>
  ) : (
    <Link to={href} className={className}>{children}</Link>
  );

/** A list of places to go: what it is, the kind of page, and an arrow. */
export const LinkTable = ({ links, heading = "Page" }: { links: Array<[string, string]>; heading?: string }) => (
  <TableShell>
    <table className="w-full text-left text-[14px]">
      <thead className={HEAD}>
        <tr>
          <th scope="col" className="px-5 py-3 font-medium">{heading}</th>
          <th scope="col" className="hidden w-40 px-4 py-3 font-medium sm:table-cell">Type</th>
          <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Open</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {links.map(([href, label]) => (
          <tr key={href} className="transition-colors hover:bg-[#f8f9ff]">
            <td className="px-5 py-3">
              <Anchor href={href} className="font-medium text-[#1E3A8A] hover:underline">{label}</Anchor>
            </td>
            <td className="hidden px-4 py-3 sm:table-cell">
              <span className="rounded-full bg-[#eef0ff] px-2.5 py-1 text-[11px] font-medium text-[#4f46e5]">{kindOf(href)}</span>
            </td>
            <td className="px-4 py-3 text-right text-gray-400" aria-hidden="true">{href.startsWith("http") ? "↗" : "→"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableShell>
);

/** Questions and answers, side by side on a desktop and stacked on a phone. */
export const FaqTable = ({ faqs }: { faqs: Array<{ q: string; a: string }> }) => (
  <TableShell>
    <table className="w-full text-left text-[14px]">
      <thead className={`hidden sm:table-header-group ${HEAD}`}>
        <tr>
          <th scope="col" className="w-2/5 px-5 py-3 font-medium">Question</th>
          <th scope="col" className="px-5 py-3 font-medium">Answer</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {faqs.map((f) => (
          <tr key={f.q} className="align-top">
            <th scope="row" className="block px-5 pt-4 pb-1 text-[14px] font-semibold text-[#1f2937] sm:table-cell sm:w-2/5 sm:py-4">{f.q}</th>
            <td className="block px-5 pb-4 leading-relaxed text-gray-600 sm:table-cell sm:py-4">{f.a}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </TableShell>
);

/** A section: a heading, an optional line under it, and its content. */
export const TableSection = ({ heading, note, children }: { heading: string; note?: string; children: ReactNode }) => (
  <section>
    <h2 className="text-xl font-bold tracking-tight text-[#1f2937]">{heading}</h2>
    {note && <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-gray-500">{note}</p>}
    <div className="mt-4">{children}</div>
  </section>
);
