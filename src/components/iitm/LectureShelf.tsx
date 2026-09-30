import { useState } from "react";
import { TITLE_BY_ID } from "../../../api/_shared/lectures";

/**
 * A playlist plays right here: the video is on the page, and the other playlists are one tap away
 * under it, grouped the way students look for them. Nothing opens in another tab first.
 */
export interface LectureGroup {
  heading: string;
  ids: string[];
}

const LectureShelf = ({ groups }: { groups: LectureGroup[] }) => {
  const first = groups.flatMap((g) => g.ids)[0];
  const [current, setCurrent] = useState<string>(first);
  if (!first) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-3 md:p-5 shadow-sm">
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          key={current}
          title={TITLE_BY_ID[current] ?? "Lecture playlist"}
          src={`https://www.youtube.com/embed/videoseries?list=${current}`}
          className="h-full w-full"
          loading="lazy"
          allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
      <p className="mt-3 text-[15px] font-semibold text-[#1f2937]">{TITLE_BY_ID[current]}</p>

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div key={g.heading}>
            {groups.length > 1 && <p className="text-[11px] font-medium uppercase tracking-wider text-gray-500">{g.heading}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {g.ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCurrent(id)}
                  aria-pressed={current === id}
                  className={`rounded-full border px-3.5 py-1.5 text-left text-[13px] transition-colors ${current === id ? "border-[#6366f1] bg-[#6366f1] text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"}`}
                >
                  {TITLE_BY_ID[id]?.replace(/\s*\|.*$/, "") ?? id}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LectureShelf;
