import { Link } from "react-router-dom";

/**
 * Unknown IITians in numbers, and where to go next. The figures are the owner's own statements about
 * the channel and its students; the links lead to the free lectures, the subject lists and the guides.
 */
const STATS: Array<[string, string]> = [
  ["1 lakh+", "students have learned from Unknown IITians"],
  ["15 lakh+", "YouTube views till date"],
  ["300+", "free lecture and revision videos"],
  ["Free", "notes, previous year papers and calculators"],
];

const LINKS: Array<[string, string, boolean]> = [
  ["/free-iitm-bs-lectures", "Free IITM BS lectures by subject", false],
  ["/youtube-channel", "The Unknown IITians YouTube channel", false],
  ["/iitm-bs", "Every IITM BS subject: Maths 1, Maths 2, Stats, CT, Python and more", false],
  ["/iitm-bs-exam-revision-resources", "Revision for Quiz 1, Quiz 2, End Term and the Qualifier", false],
  ["/iitm-bs-courses-guide", "IITM BS live batches for Qualifier, Foundation and Diploma", false],
  ["/best-iitm-bs-resources", "Best IITM BS study resources: a student's guide", false],
  ["/iitm-bs-vs-jee-neet-alternative", "IITM BS as an alternative to the JEE and NEET route", false],
  ["/iitm-bs-educators", "Teach IITM BS subjects with Unknown IITians", false],
];

const ReachSection = () => (
  <section className="bg-white py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1f2937]">IITM BS help that students actually use</h2>
      <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-gray-600">
        Free lectures for the Foundation and Diploma subjects, Fastrack revision for every exam, free notes and previous year papers, and live batches when you want them.
      </p>

      <dl className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
        {STATS.map(([figure, label]) => (
          <div key={label} className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
            <dt className="text-3xl font-bold text-[#1E3A8A]">{figure}</dt>
            <dd className="mt-1 text-sm text-gray-600">{label}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-10 grid gap-x-8 gap-y-3 md:grid-cols-2">
        {LINKS.map(([href, label]) => (
          <li key={href}>
            <Link to={href} className="text-[15px] font-medium text-[#1E3A8A] hover:underline">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default ReachSection;
