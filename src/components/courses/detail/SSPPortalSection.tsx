import React from 'react';
import { LayoutDashboard, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import SSPContentBrowser from '@/components/courses/detail/SSPContentBrowser';
import { useCourseCatalog } from '@/hooks/useCourseCatalog';

interface SSPPortalSectionProps {
  /** When given, the card also lists this batch's real contents. */
  courseId?: string;
  courseTitle?: string;
  onBuyClick?: () => void;
}

const SSPPortalSection: React.FC<SSPPortalSectionProps> = ({ courseId, courseTitle, onBuyClick }) => {
  // Live counts for the three tiles that describe actual content, so the card
  // says "285 lectures" instead of a generic promise. The query is shared with
  // the browser below, so this costs no extra request.
  const { data: catalog } = useCourseCatalog(courseId);
  const countLabel = (n?: number, noun?: string) =>
    n && n > 0 ? `${n} ${noun}${n > 1 ? 's' : ''} in this batch.` : undefined;

  const features = [
    {
      // Custom Icon Provided
      iconUrl: "https://i.ibb.co/Jw0JZThT/image.png",
      title: "Recorded Lectures",
      description:
        countLabel(catalog?.totals?.video, 'lecture') ??
        "HD recordings available for unlimited replay.",
    },
    {
      // Updated Icon from IITM BS PYQ Section
      iconUrl: "https://i.ibb.co/XkVT3SgT/image.png",
      title: "Study Materials",
      description:
        countLabel(catalog?.totals?.note, 'note') ??
        "PDFs, notes, and practice sheets vault.",
    },
    {
      // Default Icon
      icon: LayoutDashboard,
      title: "Student Dashboard",
      description: "Track goals and manage your schedule.",
    },
    {
      // Custom Icon Provided
      iconUrl: "https://i.ibb.co/ynmGbf4Y/image.png",
      title: "Progress Tracking",
      description: "Data-driven insights on your performance.",
    },
    {
      // Custom Icon Provided
      iconUrl: "https://i.ibb.co/8DJp3Yj1/image.png",
      title: "Doubt Resolution",
      description: "Rapid answers from expert instructors.",
    },
    {
      // Default Icon
      icon: ClipboardCheck,
      title: "Test & Practice",
      description:
        countLabel(catalog?.totals?.dpp, 'practice sheet') ??
        "Assignments and simulated mock exams.",
    }
  ];

  // Identical Gradients to SubjectsSection
  const gradients = [
    "bg-gradient-to-b from-[#f0f7ff] to-[#e0f2fe]", // Blue
    "bg-gradient-to-b from-[#f5f3ff] to-[#ede9fe]", // Purple
    "bg-gradient-to-b from-[#ecfdf5] to-[#d1fae5]", // Emerald
    "bg-gradient-to-b from-[#fffbeb] to-[#fef3c7]", // Amber
    "bg-gradient-to-b from-[#fff1f2] to-[#ffe4e6]", // Rose
    "bg-gradient-to-b from-[#eef2ff] to-[#e0e7ff]", // Indigo
  ];

  return (
    <section id="ssp" className="scroll-mt-24 w-full font-['Inter',sans-serif]">
       <div className="bg-white rounded-[24px] p-5 md:p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-black/5 w-full">
         
         <h2 className="text-[20px] md:text-[22px] font-semibold text-black mb-6 md:mb-8 tracking-tight">
           Student Service Portal
         </h2>
         
         <div className="grid grid-cols-2 gap-3">
            {features.map((feature, idx) => {
               const Icon = feature.icon;
               const gradientClass = gradients[idx % gradients.length];
               
               return (
                 <div 
                   key={idx} 
                   className={cn(
                     "group flex flex-col justify-between px-4 py-4 md:px-5 md:py-5 rounded-lg cursor-pointer h-full min-h-[140px]",
                     "border-[1.2px] border-transparent transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
                     "hover:bg-white hover:border-black hover:shadow-sm",
                     gradientClass
                   )}
                 >
                   <div>
                     {/* Icon in White Circular Frame */}
                     <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white flex items-center justify-center shadow-sm mb-3 group-hover:shadow-md transition-shadow">
                        {feature.iconUrl ? (
                          <img 
                            src={feature.iconUrl} 
                            alt={feature.title} 
                            className="w-5 h-5 md:w-6 md:h-6 object-contain"
                          />
                        ) : (
                          Icon && <Icon className="w-4 h-4 md:w-5 md:h-5 text-black/80" />
                        )}
                     </div>

                     <h3 className="text-[13px] md:text-[15px] font-semibold text-black leading-tight mb-1.5">
                        {feature.title}
                     </h3>
                   </div>
                   
                   <p className="text-[11px] md:text-[12px] text-black/60 leading-relaxed font-medium">
                     {feature.description}
                   </p>
                 </div>
               )
            })}
         </div>

         {courseId && (
           <SSPContentBrowser
             courseId={courseId}
             courseTitle={courseTitle ?? ''}
             onBuyClick={onBuyClick}
           />
         )}
       </div>
    </section>
  );
};

export default SSPPortalSection;
