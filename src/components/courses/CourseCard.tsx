import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Clock, Tag, Loader2 } from "lucide-react";
import { Course } from '@/components/admin/courses/types';
import EnrollButton from "@/components/EnrollButton";
import { supabase } from "@/integrations/supabase/client";
import { useEnrollmentStatus } from "@/hooks/useEnrollmentStatus";

interface CourseCardProps {
  course: Course;
  index: number;
}

const CourseCard: React.FC<CourseCardProps> = ({ course, index }) => {
  const navigate = useNavigate();
  const [minAddonPrice, setMinAddonPrice] = useState<number | null>(null);
  const [hasAddons, setHasAddons] = useState(false);
  // False until the add-on lookup has returned, so we never show the direct
  // free-enroll button before we know whether this course actually has add-ons.
  const [addonsChecked, setAddonsChecked] = useState(false);
  
  // Enrollment status check
  const { isFullyEnrolled, isMainCourseOwned, hasRemainingAddons } = useEnrollmentStatus(course.id);

  // Logic for "NEW" tag based on updated_at (last 30 days)
  const isNewlyLaunched = useMemo(() => {
    if (!course.updated_at) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(course.updated_at) > thirtyDaysAgo;
  }, [course.updated_at]);

  const discountPercent = course.price && course.discounted_price
    ? Math.round(((course.price - course.discounted_price) / course.price) * 100)
    : 0;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBA";
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  // Whatsapp Share
  const handleWhatsappShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const courseUrl = `${window.location.origin}/courses/${course.id}`;
    const message = `Check out this course: ${course.title}\n${courseUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // --- CHECK ADD-ONS & LOWEST PRICE LOGIC ---
  useEffect(() => {
    const checkAddonsAndPrice = async () => {
      // Fetch all add-ons for this course
      const { data, error } = await supabase
        .from('course_addons')
        .select('price')
        .eq('course_id', course.id);

      if (!error && data && data.length > 0) {
        setHasAddons(true);

        // Only calculate "Starts at" price if the Main Batch is FREE (0 or null)
        if (course.price === 0 || course.price === null) {
          // Filter for paid add-ons only
          const paidAddons = data.filter(addon => addon.price > 0);
          
          if (paidAddons.length > 0) {
            // Find the lowest price among add-ons
            const lowest = Math.min(...paidAddons.map(p => p.price));
            setMinAddonPrice(lowest);
          } else {
             setMinAddonPrice(null);
          }
        }
      } else {
        setHasAddons(false);
        setMinAddonPrice(null);
      }
      setAddonsChecked(true);
    };

    checkAddonsAndPrice();
  }, [course.id, course.price]);

  // --- RENDER HELPERS ---
  const isBaseFree = course.price === 0 || course.price === null;
  const hasPaidAddons = minAddonPrice !== null;

  const renderPrice = () => {
    // Case 1: Base is Free + Paid Add-ons exist => "Starts at ₹..."
    if (isBaseFree && hasPaidAddons) {
      return (
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Starts at</span>
          <span className="text-[20px] font-bold text-[#1E3A8A]">₹{minAddonPrice?.toLocaleString()}</span>
        </div>
      );
    }

    // Case 2: Discounted Base Price
    if (course.discounted_price && course.price && course.discounted_price < course.price) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-bold text-[#1E3A8A]">₹{course.discounted_price.toLocaleString()}</span>
          <span className="text-[14px] text-[#94a3b8] line-through font-normal">₹{course.price?.toLocaleString()}</span>
        </div>
      );
    }

    // Case 3: True Free (Base 0 + No Paid Add-ons)
    if (isBaseFree && !hasPaidAddons) {
      return <span className="text-[22px] font-bold text-[#1b8b5a]">FREE</span>;
    }

    // Case 4: Standard Price
    return <span className="text-[22px] font-bold text-[#1E3A8A]">₹{course.price?.toLocaleString()}</span>;
  };

  const renderBuyButton = () => {
    // Common styles
    const btnClass = "flex-1 bg-[#1E3A8A] text-white h-[42px] text-[13px] font-normal uppercase rounded-lg hover:bg-[#1E3A8A]/90 transition-colors flex items-center justify-center gap-2";

    // Fully enrolled - show "Let's Study"
    if (isFullyEnrolled) {
      return (
        <button
          onClick={() => navigate('/dashboard')}
          className="flex-1 bg-green-600 text-white h-[42px] text-[13px] font-normal uppercase rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
        >
          LET'S STUDY
        </button>
      );
    }

    // Main owned but addons available - show "Upgrade"
    if (isMainCourseOwned && hasRemainingAddons) {
      return (
        <button
          onClick={() => navigate(`/courses/${course.id}/configure`)}
          className={btnClass}
        >
          UPGRADE
        </button>
      );
    }

    // Logic 1: Free Batch (No Add-ons) -> Use EnrollButton for phone collection.
    // Guard: only show the direct free-enroll button once the add-on lookup has
    // returned. Otherwise a free-base course that actually HAS add-ons briefly
    // renders this button (hasAddons is still false), and a fast click creates a
    // base-only free enrollment with no subject. While checking, show a disabled
    // placeholder so nothing can be clicked prematurely.
    if (isBaseFree && !hasAddons) {
        if (!addonsChecked) {
            return (
                <button className={btnClass} disabled>
                    <Loader2 className="w-4 h-4 animate-spin" />
                </button>
            );
        }
        return (
            <EnrollButton
                courseId={course.id}
                coursePrice={0}
                className={btnClass}
            >
                ENROLL NOW
            </EnrollButton>
        );
    }

    // Logic 2: Everything else (paid, or has add-ons) -> Configure batch page
    const label = isBaseFree ? "ENROLL NOW" : "BUY NOW";
    return (
      <button
        onClick={() => navigate(`/courses/${course.id}/configure`)}
        className={btnClass}
      >
        {label}
      </button>
    );
  };

  return (
    <div 
      className="bg-white w-full border-[1.5px] border-[#e2e8f0] relative p-[12px] shadow-sm font-['Public_Sans',sans-serif] flex flex-col h-full"
      style={{ borderRadius: '6px' }}
    >
      {/* Banner */}
      <div 
        className="w-full aspect-video bg-gradient-to-b from-[#fce07c] to-[#f9c83d] relative overflow-hidden mb-[15px] flex flex-col justify-center items-center"
        style={{ borderRadius: '6px' }}
      >
        {course.image_url ? (
          <img src={course.image_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white/90 text-[24px] font-[800] text-center uppercase leading-tight px-4">
            {course.title}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-[18px] px-1">
        <h2 className="text-[19px] font-bold text-[#1a1a1a] flex-1 leading-[1.2]">
          {course.title}
        </h2>
        
        <div className="flex flex-row items-center gap-1.5 shrink-0 mt-1 whitespace-nowrap font-sans">
          {isNewlyLaunched && (
            <span className="bg-[#f59e0b] text-white text-[10px] font-normal px-[10px] py-[3px] text-center uppercase" style={{ borderRadius: '6px' }}>NEW</span>
          )}
          {course.language && (
            <span className="bg-[#f3f4f6] text-[#4b5563] text-[10px] font-normal px-[10px] py-[3px] text-center" style={{ borderRadius: '6px' }}>{course.language}</span>
          )}
        </div>

        <div className="shrink-0 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleWhatsappShare}>
          <svg viewBox="0 0 24 24" className="w-[22px] h-[22px] fill-black">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.03c0 2.12.554 4.189 1.602 6.039L0 24l6.135-1.61a11.748 11.748 0 005.911 1.586h.005c6.634 0 12.032-5.396 12.033-12.03a11.811 11.811 0 00-3.417-8.481z"/>
          </svg>
        </div>
      </div>

      {/* Info */}
      <div className="mb-[20px] px-1 space-y-2 flex-grow">
        <div className="flex items-center gap-[10px] text-[#6b7280] text-[13.5px] font-normal">
          <GraduationCap className="w-4 h-4" />
          <span>For <span className="text-[#1a1a1a] uppercase">{course.exam_category}</span> Aspirants</span>
        </div>
        <div className="flex items-center gap-[10px] text-[#6b7280] text-[13.5px] font-normal">
          <Clock className="w-4 h-4" />
          <span>Starts on <b className="text-[#1a1a1a] font-normal">{formatDate(course.start_date)}</b> Ends on <b className="text-[#1a1a1a] font-normal">{formatDate(course.end_date)}</b></span>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="flex items-end justify-between mb-[20px] px-1">
        <div>
          {renderPrice()}
          <span className="block text-[10px] font-normal text-[#94a3b8] mt-[2px] uppercase">
            {isBaseFree && hasPaidAddons ? "(CUSTOMIZE BATCH)" : "(FOR FULL BATCH)"}
          </span>
        </div>
        {discountPercent > 0 && (
          <div className="bg-[#e6f7ef] text-[#1b8b5a] px-[10px] py-[6px] text-[10px] font-normal flex items-center gap-[5px]" style={{ borderRadius: '6px' }}>
            <Tag className="w-[12px] h-[12px]" /> {discountPercent}% OFF
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-[10px]">
        <button 
          className="flex-1 border-[1.5px] border-[#1E3A8A] text-[#1E3A8A] h-[42px] text-[13px] font-normal uppercase" 
          style={{ borderRadius: '8px' }} 
          onClick={() => navigate(`/courses/${course.id}`)}
        >
          EXPLORE
        </button>
        
        {renderBuyButton()}
      </div>
    </div>
  );
};

export default CourseCard;
