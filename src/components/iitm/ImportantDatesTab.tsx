import React from "react";

const ImportantDatesTab = () => {
  // May 2026 Term — official IITM BS exam schedule.
  // Weekly assignment deadlines are intentionally excluded.
  const importantDates = [
    {
      id: 1,
      title: "Term Start & Week 1 Content Release",
      date: "2026-06-12",
      description:
        "Official start of the May 2026 Term. Week 1 content is released on the portal.",
      type: "Academic",
      is_important: true,
    },
    {
      id: 2,
      title: "OPPE Slot Allocation (Tentative)",
      date: "2026-07-01",
      description:
        "Tentative — early July. Exam slots are released to individual students. Complete the OPPE System Compatibility Test (SCT) to stay eligible for the programming exams.",
      type: "Academic",
      is_important: false,
    },
    {
      id: 3,
      title: "Quiz 1",
      date: "2026-07-19",
      description:
        "In-person quiz at designated exam centres. Time: 2:00 PM – 6:00 PM (a morning session may be added if required).",
      type: "Exam",
      is_important: true,
    },
    {
      id: 4,
      title: "OPPE 1 — Day 1",
      date: "2026-08-01",
      description:
        "Online Proctored Programming Exam. Courses: Foundation Python, Diploma MLP, Degree C Programming. Slot timings are allocated closer to the date.",
      type: "OPPE",
      is_important: true,
    },
    {
      id: 5,
      title: "OPPE 1 — Day 2",
      date: "2026-08-02",
      description:
        "Online Proctored Programming Exam. Courses: Foundation Python, Diploma Java/TDS, Degree MLOPS.",
      type: "OPPE",
      is_important: true,
    },
    {
      id: 6,
      title: "Quiz 2",
      date: "2026-08-16",
      description:
        "In-person quiz at designated exam centres. Time: 2:00 PM – 6:00 PM (a morning session may be added if required).",
      type: "Exam",
      is_important: true,
    },
    {
      id: 7,
      title: "OPPE 2 — Day 1",
      date: "2026-08-29",
      description:
        "Online Proctored Programming Exam. Courses: Diploma System Commands/DBMS, Degree C Programming.",
      type: "OPPE",
      is_important: false,
    },
    {
      id: 8,
      title: "OPPE 2 — Day 2",
      date: "2026-08-30",
      description:
        "Online Proctored Programming Exam. Multiple Diploma & Degree courses.",
      type: "OPPE",
      is_important: true,
    },
    {
      id: 9,
      title: "OPPE 2 — Day 3",
      date: "2026-09-05",
      description:
        "Online Proctored Programming Exam. Courses: Diploma System Commands, Foundation Python.",
      type: "OPPE",
      is_important: false,
    },
    {
      id: 10,
      title: "OPPE 2 — Day 4",
      date: "2026-09-06",
      description:
        "Online Proctored Programming Exam. Multiple courses including MLOPS.",
      type: "OPPE",
      is_important: true,
    },
    {
      id: 11,
      title: "End Term Exam",
      date: "2026-09-13",
      description:
        "Final End Term Exam for all levels. In-person at exam centres. Sessions: 9:00 AM – 12:00 PM and 2:00 PM – 5:00 PM.",
      type: "Exam",
      is_important: true,
    },
  ];

  // Sort by date (ascending) to show upcoming events first
  const sortedDates = importantDates.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="w-full font-['Inter'] bg-white">
      <h2 className="text-[14px] font-semibold text-black uppercase tracking-[0.05em] mb-5">
        Important Exam Dates (May 2026 Term)
      </h2>

      <div className="overflow-x-auto border border-black rounded-none">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-[#e6f7f7]">
              <th className="border-b border-r border-black px-5 py-4 text-left font-bold text-[11px] uppercase tracking-[0.05em] text-[#2c4a4a] w-[20%]">
                Date
              </th>
              <th className="border-b border-black px-5 py-4 text-left font-bold text-[11px] uppercase tracking-[0.05em] text-[#2c4a4a] w-[80%]">
                Event Details
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDates.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors border-b border-black last:border-b-0">
                {/* Date Column */}
                <td className="border-r border-black p-5 align-top bg-gray-50">
                  <div className="flex flex-col">
                    <span className="text-[24px] font-bold text-black leading-none">
                      {new Date(item.date).getDate()}
                    </span>
                    <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                      {new Date(item.date).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400 uppercase mt-1">
                      {new Date(item.date).toLocaleDateString("en-US", { weekday: 'long' })}
                    </span>
                  </div>
                </td>

                {/* Details Column */}
                <td className="p-5 align-top">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h3 className="text-[16px] font-bold text-black leading-tight">
                        {item.title}
                      </h3>
                      {/* Type Badge */}
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border ${
                        item.type === 'Exam' ? 'border-[#991b1b] bg-[#fef2f2] text-[#991b1b]' :
                        item.type === 'OPPE' ? 'border-[#854d0e] bg-[#fefce8] text-[#854d0e]' :
                        item.type === 'Registration' ? 'border-[#166534] bg-[#f0fdf4] text-[#166534]' :
                        item.type === 'Deadline' ? 'border-[#b91c1c] bg-[#fff1f2] text-[#b91c1c]' :
                        'border-black bg-white text-black'
                      }`}>
                        {item.type}
                      </span>
                    </div>

                    <p className="text-[13px] text-[#4b5563] leading-[1.5]">
                      {item.description}
                    </p>

                    {item.is_important && (
                      <div className="mt-1">
                         <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-black text-white">
                            Important
                         </span>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ImportantDatesTab;
