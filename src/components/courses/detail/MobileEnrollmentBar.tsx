import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Tag } from "lucide-react";
import { EnrollmentCardProps } from './EnrollmentCard';
import { cn } from "@/lib/utils";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";
import { supabase } from "@/integrations/supabase/client";

export function MobileEnrollmentBar({
  course,
  customEnrollHandler,
  isMainCourseOwned,
  isFullyEnrolled,
  enrolling,
  isLive = true
}: EnrollmentCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();
  const [isVisible, setIsVisible] = useState(true);
  
  // Expiry logic matching EnrollmentCard
  const today = new Date();
  const validTillDate = course.valid_till ? new Date(course.valid_till) : null;
  const isExpired = validTillDate ? today > validTillDate : false;
  
  // Add-on State
  const [minAddonPrice, setMinAddonPrice] = useState<number | null>(null);
  const [hasAddons, setHasAddons] = useState(false);

  // Logic to hide bar when footer is reached
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(!entry.isIntersecting);
      },
      { threshold: 0 } 
    );

    const footer = document.querySelector('footer');
    if (footer) {
      observer.observe(footer);
    }

    return () => {
      if (footer) observer.unobserve(footer);
    };
  }, []);

  // --- CHECK ADD-ONS & LOWEST PRICE LOGIC (Same as CourseCard) ---
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
    };
    
    checkAddonsAndPrice();
  }, [course.id, course.price]);

  // Standard Price Calculation Logic
  const price = course.discounted_price ?? course.price ?? 0;
  const originalPrice = course.price ?? 0;
  const hasDiscount = course.discounted_price && course.price && course.discounted_price < course.price;
  const discountPercentage = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  // Determine rendering conditions
  const isBaseFree = course.price === 0 || course.price === null;
  const hasPaidAddons = minAddonPrice !== null;

  // Button Action Logic
  const handleAction = () => {
    if (!user) {
      openLogin();
      return;
    }

    if (customEnrollHandler) {
      customEnrollHandler();
    } else {
       navigate(`/courses/${course.id}/configure`);
    }
  };

  const getButtonText = () => {
    if (enrolling) return "Processing...";
    if (isFullyEnrolled) return "Go to Dashboard";
    if (isMainCourseOwned) return "Upgrade";
    // If it's a "Starts at" situation (Base free + addons), prompt to Configure/Enroll
    if (isBaseFree && hasAddons) return "Enroll Now";
    return "Continue with Batch";
  };

  const renderPrice = () => {
    // Case 1: Base is Free + Paid Add-ons exist => "Starts at ₹..."
    if (isBaseFree && hasPaidAddons) {
      return (
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide leading-none mb-0.5">
            Starts at
          </span>
          <span className="text-xl font-bold tracking-tight text-blue-800 leading-none">
            ₹{minAddonPrice?.toLocaleString()}
          </span>
        </div>
      );
    }

    // Standard rendering for other cases
    return (
      <>
        <div className="flex items-baseline gap-2">
          {price === 0 ? (
            <span className="text-xl font-bold tracking-tight text-[#1b8b5a]">
              FREE
            </span>
          ) : (
            <span className="text-xl font-medium tracking-tight text-blue-800">
              ₹{price.toLocaleString()}
            </span>
          )}
          
          {hasDiscount && price !== 0 && originalPrice > 0 && (
            <span className="text-xs text-slate-500 line-through font-normal opacity-80">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        
        {hasDiscount && price !== 0 && discountPercentage > 0 && (
          <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 w-fit uppercase tracking-wide">
            <Tag className="w-2.5 h-2.5 fill-green-700" />
            {discountPercentage}% Off
          </div>
        )}
      </>
    );
  };

  return (
    <div 
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-in-out px-5 py-3 lg:hidden flex items-center justify-between min-w-[320px]",
        isVisible ? "translate-y-0" : "translate-y-[110%]"
      )}
    >
      {/* Pricing Info */}
      <div className="flex flex-col gap-0.5 justify-center min-h-[44px]">
        {renderPrice()}
      </div>

      {/* Action Button */}
      {isExpired ? (
        <Button
          disabled
          className="bg-gray-400 text-white border-none px-5 py-2 h-10 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Enrollment Closed
        </Button>
      ) : (
        <Button
          onClick={handleAction}
          disabled={enrolling}
          className="bg-blue-800 hover:bg-blue-900 text-white border-none px-5 py-2 h-10 rounded-lg text-sm font-medium shadow-sm transition-all active:scale-[0.98]"
        >
          {enrolling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing
            </>
          ) : (
            getButtonText()
          )}
        </Button>
      )}
    </div>
  );
}
