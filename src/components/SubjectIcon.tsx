import React from "react";

export type SubjectKind = "jee" | "neet" | "iitm" | "default";

/**
 * Clean line-drawing exam-stream icons (no background, no hover effects):
 * an atom (JEE), a DNA helix (NEET), a data network (IITM BS) and a book
 * (default), each a simple stroke SVG tinted per subject.
 */

const SIZE = "h-9 w-9";

const COLOR: Record<SubjectKind, string> = {
  jee: "text-[#2563eb]",
  neet: "text-[#ef4444]",
  iitm: "text-[#0d9488]",
  default: "text-slate-500",
};

const Atom: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.8" transform="rotate(120 12 12)" />
  </svg>
);

const Dna: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <path d="M8 3c0 4 8 5 8 9s-8 5-8 9" />
    <path d="M16 3c0 4-8 5-8 9s8 5 8 9" />
    <line x1="9.2" y1="6" x2="14.8" y2="6" />
    <line x1="8.2" y1="9.2" x2="15.8" y2="9.2" />
    <line x1="8.2" y1="14.8" x2="15.8" y2="14.8" />
    <line x1="9.2" y1="18" x2="14.8" y2="18" />
  </svg>
);

const Nodes: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="6.5" y1="7.5" x2="12" y2="12" />
    <line x1="17.5" y1="6.5" x2="12" y2="12" />
    <line x1="12" y1="12" x2="7.5" y2="17.5" />
    <line x1="12" y1="12" x2="17" y2="16.5" />
    <circle cx="6.5" cy="7.5" r="1.8" />
    <circle cx="17.5" cy="6.5" r="1.8" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="16.5" r="1.8" />
  </svg>
);

const Book: React.FC<{ className: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5.2A1.8 1.8 0 0 1 5.8 4H11v14H5.8A1.8 1.8 0 0 0 4 19.4z" />
    <path d="M20 5.2A1.8 1.8 0 0 0 18.2 4H13v14h5.2A1.8 1.8 0 0 1 20 19.4z" />
  </svg>
);

const GLYPH: Record<SubjectKind, React.FC<{ className: string }>> = {
  jee: Atom,
  neet: Dna,
  iitm: Nodes,
  default: Book,
};

export const subjectKindFor = (label: string): SubjectKind => {
  const n = label.toLowerCase();
  if (n.includes("jee")) return "jee";
  if (n.includes("neet")) return "neet";
  if (n.includes("iitm") || n.includes("bs")) return "iitm";
  return "default";
};

const SubjectIcon: React.FC<{ kind: SubjectKind; className?: string }> = ({ kind, className }) => {
  const Glyph = GLYPH[kind];
  return <Glyph className={`${SIZE} shrink-0 ${COLOR[kind]} ${className ?? ""}`} />;
};

export default SubjectIcon;
