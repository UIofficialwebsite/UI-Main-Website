import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Course } from '@/components/admin/courses/types';
import { Separator } from '@/components/ui/separator';
import { MapPin, Calendar, BookOpen, Loader2 } from 'lucide-react';
import EnrollButton from '@/components/EnrollButton';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { ShareButton } from '@/components/ShareButton';
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLoginModal } from "@/context/LoginModalContext";
import CouponSection, { type AppliedCoupon } from '@/components/coupons/CouponSection';

export interface EnrollmentCardProps {
    course: Course;
    isDashboardView?: boolean;
    customEnrollHandler?: () => void;
    isMainCourseOwned?: boolean;
    isFullyEnrolled?: boolean;
    ownedAddons?: string[];
    isFreeCourse?: boolean;
    enrolling?: boolean;
    className?: string;
    forceExpanded?: boolean;
    isLive?: boolean;
}

const EnrollmentCard: React.FC<EnrollmentCardProps> = ({ 
    course, 
    isDashboardView, 
    customEnrollHandler,
    isMainCourseOwned = false,
    isFullyEnrolled = false,
    ownedAddons = [],
    isFreeCourse = false,
    enrolling = false,
    className,
    forceExpanded = false,
    isLive = true
}) => {
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [minAddonPrice, setMinAddonPrice] = useState<number | null>(null);
    const [hasAddons, setHasAddons] = useState(false);
    const [totalAddonsCount, setTotalAddonsCount] = useState(0);

    // Coupon state for the no-addons direct enrollment path.
    // CouponSection handles input/offers fetching/sheet; parent owns applied state.
    const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

    const cardRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const { openLogin } = useLoginModal();

    const discountPercentage = course.price && course.discounted_price
        ? Math.round(((course.price - course.discounted_price) / course.price) * 100)
        : 0;
        
    const today = new Date();
    // Use valid_till to determine if the enrollment window has passed
    const validTillDate = course.valid_till ? new Date(course.valid_till) : null;
    const isExpired = validTillDate ? today > validTillDate : false;

    useEffect(() => {
        const checkAddonsAndPrice = async () => {
            const { data, error, count } = await supabase
                .from('course_addons')
                .select('price', { count: 'exact' })
                .eq('course_id', course.id);

            if (!error && data) {
                const addonsExist = data.length > 0;
                setHasAddons(addonsExist);
                setTotalAddonsCount(count || 0);

                if (course.price === 0 || course.price === null) {
                    const paidAddons = data.filter(addon => addon.price > 0);
                    if (paidAddons.length > 0) {
                        const lowest = Math.min(...paidAddons.map(p => p.price));
                        setMinAddonPrice(lowest);
                    } else {
                        setMinAddonPrice(null);
                    }
                }
            } else {
                setHasAddons(false);
                setTotalAddonsCount(0);
                setMinAddonPrice(null);
            }
        };
        checkAddonsAndPrice();
    }, [course.id, course.price]);

    useEffect(() => {
        if (forceExpanded) {
            setDetailsVisible(true);
            return;
        }

        const scrollContainer = isDashboardView 
            ? cardRef.current?.closest('.overflow-y-auto') || window 
            : window;

        const handleScroll = () => {
            const currentScroll = scrollContainer instanceof HTMLElement
                ? scrollContainer.scrollTop 
                : window.scrollY;

            setDetailsVisible(currentScroll > 80);
        };

        scrollContainer.addEventListener('scroll', handleScroll);
        handleScroll();

        return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }, [isDashboardView, forceExpanded]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "TBD";
        const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-GB', options);
    };

    // Coupon teaser is only meaningful for the direct (no-addons) paid enrollment
    // path. With addons the user goes to /configure where a fuller coupon UI lives.
    const basePrice = course.discounted_price || course.price || 0;
    const showCouponSection = !hasAddons && !isMainCourseOwned && !isFullyEnrolled
        && !isExpired && basePrice > 0 && !customEnrollHandler;

    const renderMainButton = () => {
        const btnClasses = "flex-1 text-lg bg-black hover:bg-black/90 text-white h-11 min-w-0 px-4";
        
        // Calculate if the user has everything:
        const allAddonsOwned = totalAddonsCount > 0 ? ownedAddons.length >= totalAddonsCount : true;
        const completeEnrollment = isMainCourseOwned && allAddonsOwned;

        // 1. COMPLETELY ENROLLED -> Show "Let's Study" (No Icon, No Popup)
        // Allow enrolled students to keep studying even if the valid date has crossed
        if (isFullyEnrolled || completeEnrollment) {
            return (
                <Button 
                    size="lg" 
                    className={btnClasses}
                    onClick={() => navigate('/dashboard')}
                >
                    <span className="truncate">Let's Study</span>
                </Button>
            );
        }

        // 2. COURSE EXPIRED -> Show disabled enrollment closed state based on valid_till date
        if (isExpired) {
            return (
                <Button 
                    size="lg" 
                    className="flex-1 text-lg bg-gray-400 text-white h-11 min-w-0 px-4 cursor-not-allowed"
                    disabled
                >
                    <span className="truncate">Enrollment Closed</span>
                </Button>
            );
        }

        // 3. Main course owned, but add-ons pending -> Show "Continue Enrollment" (Navigate to config)
        if (isMainCourseOwned && !allAddonsOwned) {
            return (
                <Button 
                    size="lg" 
                    className={btnClasses}
                    onClick={() => navigate(`/courses/${course.id}/configure`)} 
                >
                    <span className="truncate">Continue Enrollment</span>
                </Button>
            );
        }

        // 4. Not owned, but has add-ons -> Show "Configure Plan"
        if (hasAddons && !isMainCourseOwned && !customEnrollHandler) {
             return (
                <Button
                    size="lg"
                    className={btnClasses}
                    onClick={() => {
                        if (!user) {
                            openLogin();
                            return;
                        }
                        navigate(`/courses/${course.id}/configure`);
                    }}
                >
                    <span className="truncate">Configure Plan</span>
                </Button>
             );
        }

        // 5. Custom Handler (e.g., specific enrollment flow)
        if (customEnrollHandler) {
             return (
                <Button 
                    size="lg" 
                    className={btnClasses}
                    onClick={customEnrollHandler}
                    disabled={enrolling}
                >
                    {enrolling ? <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> : null}
                    <span className="truncate">Continue Enrollment</span>
                </Button>
            );
        } 
        
        // 6. Default -> Standard Enroll Button
        return (
            <EnrollButton
                courseId={course.id}
                coursePrice={course.discounted_price || course.price}
                enrollmentLink={course.enroll_now_link || undefined}
                className={btnClasses}
                couponCode={appliedCoupon?.code ?? null}
            >
                <span className="truncate">Continue Enrollment</span>
            </EnrollButton>
        );
    };

    const renderPrice = () => {
        // Case 1: Base is Free + Paid Add-ons exist => "Starts at ₹..."
        if ((course.price === 0 || course.price === null) && minAddonPrice !== null) {
            return (
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Starts at</span>
                    <span className="text-3xl font-bold text-gray-900">₹{minAddonPrice.toLocaleString()}</span>
                </div>
            );
        }

        // Case 2: True Free (Base 0 + No Paid Add-ons)
        if (course.price === 0 || course.price === null) {
            return (
                <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-[#1b8b5a]">FREE</span>
                </div>
            );
        }

        // Case 3: Paid Course
        // When a coupon is applied, show the discounted final price prominently
        // and strike out the listed price.
        if (appliedCoupon) {
            const listPrice = course.discounted_price || course.price || 0;
            return (
                <div className="flex flex-col">
                    <div className="flex items-baseline">
                        <span className="text-3xl font-bold text-gray-900">₹{appliedCoupon.finalAmount}</span>
                        <span className="text-gray-500 line-through ml-2 font-normal">₹{listPrice}</span>
                    </div>
                    <span className="text-xs text-green-700 font-medium mt-0.5">You save ₹{appliedCoupon.discountAmount}</span>
                </div>
            );
        }

        return (
            <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">₹{course.discounted_price || course.price}</span>
                {course.discounted_price && (
                    <span className="text-gray-500 line-through ml-2 font-normal">₹{course.price}</span>
                )}
            </div>
        );
    };

    return (
        <div ref={cardRef} className={cn("lg:scale-95 lg:origin-top", className)}>
            <div className={cn("rounded-xl bg-gradient-to-b from-neutral-200 to-transparent p-0.5 shadow-xl", className ? "bg-none p-0 shadow-none" : "")}>
                <Card className={cn("overflow-hidden rounded-lg font-sans bg-white", className ? "border-none shadow-none" : "")}>
                    <CardHeader className="p-0">
                        <img src={course.image_url || '/placeholder.svg'} alt={course.title} className="w-full h-auto object-cover aspect-video" />
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            {renderPrice()}
                            
                            {course.discounted_price && (course.price !== 0 && course.price !== null) && (
                                <div className="relative">
                                    <div className="bg-green-500 text-white font-bold text-sm px-3 py-1 rounded-md">
                                        {discountPercentage}% OFF
                                    </div>
                                    <div className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-green-500"></div>
                                </div>
                            )}
                        </div>

                        <div
                            className="transition-all ease-in-out duration-500 overflow-hidden"
                            style={{
                                maxHeight: detailsVisible ? '500px' : '0',
                                opacity: detailsVisible ? 1 : 0,
                            }}
                        >
                            <div className="space-y-4 pt-2 pb-4">
                                <div className="flex items-center text-gray-700">
                                    <MapPin className="w-5 h-5 mr-3 text-gray-500" />
                                    <span className="font-normal">{course.branch} - {course.level}</span>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <Calendar className="w-5 h-5 mr-3 text-gray-500" />
                                    <div className="flex flex-col">
                                        <span className="font-normal">Starts: {formatDate(course.start_date || '')}</span>
                                        <span className="font-normal text-slate-400">Ends: {formatDate(course.end_date || '')}</span>
                                    </div>
                                </div>
                                <div className="flex items-center text-gray-700">
                                    <BookOpen className="w-5 h-5 mr-3 text-gray-500" />
                                    <span className="font-normal">Language: {course.language}</span>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        {showCouponSection && (
                            <CouponSection
                                courseId={course.id}
                                courseTitle={course.title}
                                selectedAddonIds={[]}
                                cartTotal={basePrice}
                                appliedCoupon={appliedCoupon}
                                onApply={setAppliedCoupon}
                                onRemove={() => setAppliedCoupon(null)}
                                celebrateOnAutoApply={false}
                                className="mb-4"
                            />
                        )}

                        <div className="flex w-full gap-3 items-center">
                            {renderMainButton()}

                            <ShareButton
                                url={window.location.href}
                                title={course.title}
                                description={`Check out this course: ${course.title}`}
                                variant="outline"
                                className="shrink-0 aspect-square h-11 w-11 p-0 border-gray-300"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default EnrollmentCard;
