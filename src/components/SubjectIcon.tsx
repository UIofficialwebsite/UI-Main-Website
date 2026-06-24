import React from "react";

export type SubjectKind = "jee" | "neet" | "iitm" | "default";

/**
 * Premium exam-stream icon: a custom glyph (atom / DNA helix / data network /
 * book) set in a glossy gradient medallion with a colour-tinted glow — built to
 * replace flat, generic lucide icons in the Courses / Exam-Prep dropdowns.
 */

const AtomGlyph = () => (
  <svg viewBox="0 0 24 24" className="relative h-[22px] w-[22px] text-white" fill="none">
    <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="currentColor" strokeWidth="1.5" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)" />
  </svg>
);

const DnaGlyph = () => (
  <svg viewBox="0 0 24 24" className="relative h-[22px] w-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M8 3c0 4 8 5 8 9s-8 5-8 9" />
    <path d="M16 3c0 4-8 5-8 9s8 5 8 9" />
    <line x1="9.2" y1="6" x2="14.8" y2="6" />
    <line x1="8.2" y1="9.2" x2="15.8" y2="9.2" />
    <line x1="8.2" y1="14.8" x2="15.8" y2="14.8" />
    <line x1="9.2" y1="18" x2="14.8" y2="18" />
  </svg>
);

const NodesGlyph = () => (
  <svg viewBox="0 0 24 24" className="relative h-[22px] w-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.4">
    <line x1="6" y1="7" x2="12" y2="12" />
    <line x1="18" y1="6" x2="12" y2="12" />
    <line x1="12" y1="12" x2="7" y2="18" />
    <line x1="12" y1="12" x2="17.5" y2="17" />
    <circle cx="6" cy="7" r="1.9" fill="currentColor" />
    <circle cx="18" cy="6" r="1.9" fill="currentColor" />
    <circle cx="12" cy="12" r="2.3" fill="currentColor" />
    <circle cx="7" cy="18" r="1.9" fill="currentColor" />
    <circle cx="17.5" cy="17" r="1.9" fill="currentColor" />
  </svg>
);

const BookGlyph = () => (
  <svg viewBox="0 0 24 24" className="relative h-[22px] w-[22px] text-white" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.2A1.8 1.8 0 0 1 5.8 4H11v14H5.8A1.8 1.8 0 0 0 4 19.4z" />
    <path d="M20 5.2A1.8 1.8 0 0 0 18.2 4H13v14h5.2A1.8 1.8 0 0 1 20 19.4z" />
  </svg>
);

// Full class literals so Tailwind keeps the gradient utilities.
const CONFIG: Record<SubjectKind, { grad: string; glow: string; Glyph: React.FC }> = {
  jee: { grad: "from-blue-500 via-indigo-500 to-indigo-600", glow: "rgba(79,70,229,0.45)", Glyph: AtomGlyph },
  neet: { grad: "from-rose-500 via-red-500 to-red-600", glow: "rgba(244,63,94,0.45)", Glyph: DnaGlyph },
  iitm: { grad: "from-emerald-500 via-teal-500 to-teal-600", glow: "rgba(13,148,136,0.45)", Glyph: NodesGlyph },
  default: { grad: "from-slate-500 to-slate-700", glow: "rgba(71,85,105,0.4)", Glyph: BookGlyph },
};

export const subjectKindFor = (label: string): SubjectKind => {
  const n = label.toLowerCase();
  if (n.includes("jee")) return "jee";
  if (n.includes("neet")) return "neet";
  if (n.includes("iitm") || n.includes("bs")) return "iitm";
  return "default";
};

const SubjectIcon: React.FC<{ kind: SubjectKind; className?: string }> = ({ kind, className }) => {
  const { grad, glow, Glyph } = CONFIG[kind];
  return (
    <span
      className={`relative grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-gradient-to-br ${grad} ring-1 ring-white/25 transition-transform duration-300 group-hover:scale-105 ${className ?? ""}`}
      style={{ boxShadow: `0 7px 18px -5px ${glow}` }}
    >
      {/* glossy top sheen */}
      <span className="pointer-events-none absolute inset-0 rounded-[13px] bg-gradient-to-b from-white/30 to-transparent" />
      <Glyph />
    </span>
  );
};

export default SubjectIcon;
