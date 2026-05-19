import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Course } from '@/components/admin/courses/types';
import { SimpleAddon } from '@/components/courses/detail/BatchConfigurationModal';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft, Check, ChevronDown, ChevronUp, X, Tag, BadgePercent } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useLoginModal } from '@/context/LoginModalContext';
import { usePageSEO } from "@/utils/seoManager";
import CountryCodeSelect, { CountryCode } from "@/components/ui/CountryCodeSelect";

// Custom Styles for the Phone Number Modal
const customStyles = `
  .custom-modal-wrapper {
    font-family: 'Inter', sans-serif !important;
    background: #ffffff;
    width: 100%;
    max-width: 440px;
    border: 1px solid #000000;
    padding: 32px;
    position: relative;
    box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    margin: 0 auto;
  }
  .loading-container {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-bottom: 24px;
  }
  .dot {
    width: 6px;
    height: 6px;
    background-color: #000000;
    border-radius: 50%;
    animation: dot-pulse 1.4s infinite ease-in-out both;
  }
  .dot:nth-child(1) { animation-delay: -0.32s; }
  .dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes dot-pulse {
    0%, 80%, 100% { transform: scale(0); opacity: 0.3; }
    40% { transform: scale(1); opacity: 1; }
  }
  .modal-title {
    font-size: 22px;
    font-weight: 700;
    color: #000000;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
    text-align: left;
  }
  .modal-description {
    font-size: 14px;
    color: #555555;
    line-height: 1.6;
    margin-bottom: 28px;
    text-align: left;
  }
  .form-group {
    margin-bottom: 28px;
    text-align: left;
  }
  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #000000;
    margin-bottom: 8px;
  }
  .form-input {
    width: 100%;
    padding: 14px;
    font-size: 15px;
    border: 1px solid #000000;
    outline: none;
    color: #000000;
    background: white;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  .btn {
    padding: 12px 24px;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    border: 1px solid #000000;
    transition: all 0.2s;
    border-radius: 0;
  }
  .btn-secondary {
    background: #ffffff;
    color: #000000;
  }
  .btn-primary {
    background: #000000;
    color: #ffffff;
  }
  .close-icon {
    position: absolute;
    top: 20px;
    right: 20px;
    font-size: 20px;
    color: #999;
    cursor: pointer;
    line-height: 1;
    background: none;
    border: none;
    padding: 0;
  }
  .phone-input-wrapper {
    display: flex;
    gap: 10px;
    align-items: stretch;
  }
  .dial-code-select {
    width: 160px;
    padding: 14px 10px;
    font-size: 14px;
    border: 1px solid #000000;
    background: white;
    cursor: pointer;
    outline: none;
    color: #000000;
  }
  .phone-number-input {
    flex: 1;
    min-width: 0;
  }
  .phone-hint {
    font-size: 12px;
    color: #888888;
    margin-top: 6px;
  }
`;

const BatchConfiguration = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useLoginModal();

  const [course, setCourse] = useState<Course | null>(null);
  
  // Dynamic page title based on course data
  usePageSEO(course ? `Configure Batch - ${course.title}` : "Configure Batch", courseId ? `/courses/${courseId}/configure` : undefined);
  const [addons, setAddons] = useState<SimpleAddon[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  
  // Ownership States
  const [isMainCourseOwned, setIsMainCourseOwned] = useState(false);
  const [ownedAddonIds, setOwnedAddonIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // UI States
  const [showDetails, setShowDetails] = useState(false); // Controls Top Drawer (Batch Info)
  const [showBill, setShowBill] = useState(false);       // Controls Bottom Bill (Enrollment Summary)
  
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [countryCodes, setCountryCodes] = useState<Array<{
    dial_code: string;
    name: string;
    phone_length: number;
    code: string;
  }>>([]);
  const [selectedDialCode, setSelectedDialCode] = useState("+91");
  const [expectedPhoneLength, setExpectedPhoneLength] = useState(10);

  // --- Coupon state ---
  type CouponOffer = {
    code: string;
    label: string | null;
    eligible: boolean;
    discountAmount?: number;
    finalAmount?: number;
    isAutoApplied?: boolean;
    ineligibilityReason?: string;
    priority?: number;
  };
  type AppliedCoupon = {
    code: string;
    label: string | null;
    discountAmount: number;
    finalAmount: number;
  };
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableOffers, setAvailableOffers] = useState<CouponOffer[]>([]);
  const [autoAppliedOnce, setAutoAppliedOnce] = useState(false);

  // --- 1. Fetch Data & Check Enrollment ---
  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      try {
        const [courseRes, addonsRes, enrollmentsRes] = await Promise.all([
          supabase.from('courses').select('*').eq('id', courseId).single(),
          supabase.from('course_addons').select('*').eq('course_id', courseId),
          user 
            ? supabase
                .from('enrollments')
                .select('subject_name, status')
                .eq('user_id', user.id)
                .eq('course_id', courseId)
                // Filter for successful payments only
                .in('status', ['active', 'paid', 'success'])
            : Promise.resolve({ data: null, error: null })
        ]);

        if (courseRes.error) throw courseRes.error;
        setCourse(courseRes.data);

        const fetchedAddons = addonsRes.data || [];
        setAddons(fetchedAddons);
        
        // --- UPDATED ENROLLMENT LOGIC ---
        if (enrollmentsRes.data && enrollmentsRes.data.length > 0) {
            const enrollments = enrollmentsRes.data;
            
            // 1. Check Main Course (records with null subject_name)
            const mainOwned = enrollments.some(e => !e.subject_name);
            setIsMainCourseOwned(mainOwned);

            // 2. Check Add-ons (Robust Match: ID or Name)
            const ownedIdentifiers = new Set(
                enrollments
                    .filter(e => e.subject_name)
                    .map(e => e.subject_name)
            );
            
            // Filter addons where EITHER their ID OR their Name exists in the user's enrollments
            const ownedIds = fetchedAddons
                .filter(addon => 
                    ownedIdentifiers.has(addon.id) || 
                    ownedIdentifiers.has(addon.subject_name)
                )
                .map(addon => addon.id);
            
            setOwnedAddonIds(ownedIds);

            // 3. Redirect only if EVERYTHING available is owned
            const areAllAddonsOwned = fetchedAddons.every(addon => ownedIds.includes(addon.id));
            
            if (mainOwned && (fetchedAddons.length === 0 || areAllAddonsOwned)) {
                toast.info("You are already fully enrolled in this batch.");
                navigate(`/courses/${courseId}`); 
                return;
            }
        }
        
        setSelectedAddonIds([]); 

      } catch (error) {
        console.error('Error fetching batch details:', error);
        toast.error('Failed to load batch details');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user, navigate]);

  // --- 2. Calculations ---
  const basePrice = course?.discounted_price ?? course?.price ?? 0;
  const effectiveBasePrice = isMainCourseOwned ? 0 : basePrice;
  
  // Parse core subjects early for use in logic
  const coreSubjects = useMemo(() => {
    return course?.subject 
        ? course.subject.split(',').map(s => s.trim()).filter(Boolean)
        : [];
  }, [course?.subject]);

  const selectedAddonsList = useMemo(() => {
    return addons.filter(addon => 
        selectedAddonIds.includes(addon.id) && !ownedAddonIds.includes(addon.id)
    );
  }, [addons, selectedAddonIds, ownedAddonIds]);

  const addonsTotal = selectedAddonsList.reduce((sum, addon) => sum + addon.price, 0);
  const subtotal = effectiveBasePrice + addonsTotal;
  const couponDiscount = appliedCoupon ? Math.min(appliedCoupon.discountAmount, subtotal) : 0;
  const finalTotal = Math.max(0, subtotal - couponDiscount);

  // --- Determine if Base Plan should be enrolled ---
  // CORRECTION POINT 4: If base plan has no subject AND pricing is 0, then DO NOT enroll base.
  const shouldEnrollBase = !isMainCourseOwned && (basePrice > 0 || coreSubjects.length > 0);
  
  // Calculate if there are valid items to enroll
  const hasItemsToEnroll = shouldEnrollBase || selectedAddonsList.length > 0;

  // --- 3. Handlers ---
  const toggleAddon = (addonId: string) => {
    if (ownedAddonIds.includes(addonId)) return;

    setSelectedAddonIds(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
    // Cart changed — invalidate any applied coupon. Re-fetched on next effect.
    if (appliedCoupon) {
      setAppliedCoupon(null);
      setCouponInput("");
    }
  };

  // --- Coupon: fetch eligible offers whenever the cart changes ---
  useEffect(() => {
    if (!courseId || loading) return;

    const newAddonIds = selectedAddonIds.filter(id => !ownedAddonIds.includes(id));

    const fetchOffers = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('list-eligible-coupons', {
          body: { courseId, selectedAddonIds: newAddonIds },
        });
        if (error) return;
        const offers = (data?.offers ?? []) as CouponOffer[];
        setAvailableOffers(offers);

        // Auto-apply: the best eligible coupon flagged is_auto_applied.
        // We only auto-apply once per session so the user can remove it.
        if (!autoAppliedOnce && !appliedCoupon) {
          const best = offers.find(o => o.eligible && o.isAutoApplied);
          if (best && best.discountAmount !== undefined && best.finalAmount !== undefined) {
            setAppliedCoupon({
              code: best.code,
              label: best.label ?? null,
              discountAmount: best.discountAmount,
              finalAmount: best.finalAmount,
            });
            setCouponInput(best.code);
            setAutoAppliedOnce(true);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch offers:', e);
      }
    };
    fetchOffers();
    // intentionally depend on the cart shape only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, selectedAddonIds.join(','), ownedAddonIds.join(','), user?.id, loading]);

  const applyCoupon = async (codeArg?: string) => {
    const code = (codeArg ?? couponInput).trim();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    if (!user) { openLogin(); return; }

    setCouponLoading(true);
    setCouponError(null);
    try {
      const newAddonIds = selectedAddonIds.filter(id => !ownedAddonIds.includes(id));
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { code, courseId, selectedAddonIds: newAddonIds },
      });
      if (error) throw error;
      if (!data?.valid) {
        setAppliedCoupon(null);
        setCouponError(data?.reason ?? "Couldn't apply this code.");
        return;
      }
      setAppliedCoupon({
        code: data.code,
        label: data.label ?? null,
        discountAmount: data.discountAmount,
        finalAmount: data.finalAmount,
      });
      setCouponInput(data.code);
      setCouponError(null);
      toast.success(`Coupon applied — you save ₹${data.discountAmount}`);
    } catch (e: any) {
      setCouponError(e?.message ?? "Couldn't apply this code.");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  // --- Helper: Free Enrollment with Phone Number ---
  const handleFreeEnroll = async (phoneNumber: string) => {
    if (!user || !courseId) return;
    setProcessing(true);

    try {
        const enrollmentsToInsert = [];

        // 1. Insert Base Course ONLY if valid (Paid OR Has Content)
        if (shouldEnrollBase) {
            enrollmentsToInsert.push({
                user_id: user.id,
                course_id: courseId,
                amount: 0,
                status: 'active',
                payment_id: 'free_enrollment',
                subject_name: null
            });
        }

        // 2. Insert Selected Add-ons
        selectedAddonsList.forEach(addon => {
            enrollmentsToInsert.push({
                user_id: user.id,
                course_id: courseId,
                amount: 0,
                status: 'active',
                payment_id: 'free_enrollment',
                subject_name: addon.subject_name
            });
        });

        if (enrollmentsToInsert.length === 0) {
            toast.info("No valid items selected to enroll.");
            setProcessing(false);
            return;
        }

        const { error } = await supabase.from('enrollments').insert(enrollmentsToInsert);

        if (error) {
            if (error.code === '23505') {
                toast.success("Enrollment updated!");
                navigate(`/courses/${courseId}`);
                return;
            }
            throw error;
        }

        // Insert into payments table for tracking
        const batchName = course?.title || 'Free Course';
        // Note: coreSubjects is already calculated
        const addonSubjects = selectedAddonsList.map(a => a.subject_name);
        const allSubjects = [...new Set([...coreSubjects, ...addonSubjects])];
        const subjectsString = allSubjects.length > 0 ? allSubjects.join(', ') : 'No subjects';

        const orderId = `free_${Date.now()}_${user.id.slice(0, 8)}`;
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            order_id: orderId,
            payment_id: 'free_enrollment',
            user_id: user.id,
            amount: 0,
            net_amount: 0,
            status: 'success',
            payment_mode: 'free',
            customer_email: user.email,
            customer_phone: phoneNumber,
            batch: batchName,
            courses: subjectsString,
            discount_applied: false,
            payment_time: new Date().toISOString()
          });

        if (paymentError) {
          console.error("Failed to insert payment record:", paymentError);
        }

        toast.success("Successfully enrolled!");
        navigate('/redirect-to-portal');
        
    } catch (error: any) {
        console.error("Free enrollment error:", error);
        toast.error(error.message || "Failed to enroll. Please try again.");
    } finally {
        setProcessing(false);
    }
  };

  // --- Payment Logic ---
  const handlePayment = async () => {
    if (!user) {
      openLogin();
      return;
    }

    if (!hasItemsToEnroll) {
        toast.info("Nothing valid to enroll in.");
        return;
    }

    // Strict Free vs Paid Logic
    if (finalTotal === 0) {
      // Logic for Free Enrollment (Must be explicitly free)
      // Check if the user is trying to bypass payment for a paid course
      // Note: basePrice check is sufficient here because if basePrice > 0, finalTotal would be > 0 unless logic failed elsewhere
      if (!isMainCourseOwned && basePrice > 0) {
         toast.error("Error: Cannot free enroll in a paid course.");
         return;
      }
    } 

    setProcessing(true);

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, dial_code')
        .eq('id', user.id)
        .single();

      if (profile?.dial_code && profile?.phone && profile.phone.length >= 5) {
        const fullPhone = `${profile.dial_code}${profile.phone}`;
        
        // --- BRANCH LOGIC BASED ON TOTAL ---
        if (finalTotal === 0) {
             await handleFreeEnroll(fullPhone);
        } else {
             await processPayment(fullPhone);
        }
      } else {
        setProcessing(false);
        setShowPhoneDialog(true);
        // Fetch country codes when dialog opens
        if (countryCodes.length === 0) {
          const { data } = await supabase
            .from('country_codes')
            .select('dial_code, name, phone_length, code')
            .order('name');
          if (data) {
            setCountryCodes(data);
            const india = data.find(c => c.dial_code === '91');
            if (india) setExpectedPhoneLength(india.phone_length);
          }
        }
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      setProcessing(false);
      setShowPhoneDialog(true);
    }
  };

  const handlePhoneSubmit = async () => {
    const digitsOnly = manualPhone.replace(/[^0-9]/g, '');
    const dialCodeDigits = selectedDialCode.replace('+', '');
    const country = countryCodes.find(c => c.dial_code === dialCodeDigits);
    
    if (country && digitsOnly.length !== country.phone_length) {
      toast.error(`Phone number should be ${country.phone_length} digits for ${country.name}`);
      return;
    }
    
    if (!country && (digitsOnly.length < 5 || digitsOnly.length > 15)) {
      toast.error("Please enter a valid phone number (5-15 digits).");
      return;
    }

    setProcessing(true);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          dial_code: selectedDialCode,
          phone: manualPhone 
        })
        .eq('id', user.id);

      if (updateError) console.error("Failed to update profile phone:", updateError);
      
      const fullPhoneNumber = `${selectedDialCode}${manualPhone}`;
      setShowPhoneDialog(false);
      
      // --- BRANCH LOGIC BASED ON TOTAL (Re-check for modal submission) ---
      if (finalTotal === 0) {
         // Strict check before enrolling
         if (!isMainCourseOwned && basePrice > 0) {
             toast.error("Error: Payment required.");
             setProcessing(false);
             return;
         }
         await handleFreeEnroll(fullPhoneNumber);
      } else {
         await processPayment(fullPhoneNumber);
      }
    } catch (error) {
      setProcessing(false);
      console.error(error);
      toast.error("Something went wrong saving your contact info.");
    }
  };

  const processPayment = async (phoneNumber: string) => {
    try {
      if (!courseId) throw new Error("Course information is missing");

      // SAFETY: Strictly prevent processing payment if amount is 0 or less
      // This prevents the Cashfree "invalid amount" error popup
      if (finalTotal <= 0) {
          toast.error("Invalid payment amount. Please refresh and try again.");
          setProcessing(false);
          return;
      }

      // FIX: Ensure unique addon IDs before sending to backend to prevent DB unique constraint violations
      const rawAddonIds = selectedAddonIds.filter(id => !ownedAddonIds.includes(id));
      const newAddonIds = Array.from(new Set(rawAddonIds));

      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          courseId,
          userId: user.id,
          customerEmail: user.email,
          customerPhone: phoneNumber,
          selectedSubjects: newAddonIds,
          couponCode: appliedCoupon?.code ?? null,
        },
      });

      if (error) {
        let errorMessage = "Payment initialization failed";
        try {
           const body = JSON.parse(error.message);
           errorMessage = body.error || errorMessage;
        } catch (e) {
           if (error.message) errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (data?.error) throw new Error(data.error);
      if (!data || !data.payment_session_id) throw new Error("Invalid response from payment server");

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => {
        const cashfreeMode = data.environment || 'sandbox'; 
        const cashfree = (window as any).Cashfree({ mode: cashfreeMode });
        
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          returnUrl: data.verifyUrl, 
        });
        setProcessing(false); 
      };
      document.body.appendChild(script);

    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast.error(error.message || "Enrollment Failed");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f9fc] flex items-center justify-center font-['Inter',sans-serif]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!course) return <div>Course not found</div>;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f9fc] font-['Inter',sans-serif] text-[#1a1f36] relative overflow-hidden flex flex-col items-center">
      
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <div 
        className="fixed bottom-[-20%] right-[-10%] w-[120%] h-[60%] -z-0 pointer-events-none opacity-70 blur-[40px]"
        style={{
            background: 'linear-gradient(110deg, rgba(246, 249, 252, 0) 0%, #ffcf4d 30%, #ff61d2 60%, #70e2ff 100%)',
            transform: 'rotate(-8deg)',
            transformOrigin: 'bottom right'
        }}
      />

      {/* --- MOBILE DETAILS DRAWER (Top) --- */}
      <div 
        className={`fixed top-0 left-0 w-full bg-white z-[60] shadow-none border-b border-[#e3e8ee] rounded-b-[24px] transition-transform duration-300 ease-out flex flex-col pt-8 pb-8 px-6 md:hidden ${
            showDetails ? 'translate-y-0' : '-translate-y-[120%]'
        }`}
      >
        <div 
            className="absolute top-6 right-6 text-[#697386] cursor-pointer"
            onClick={() => setShowDetails(false)}
        >
            <X className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-7 mt-4">
            <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold text-[#697386] uppercase tracking-wider">Batch Name</span>
                <span className="text-[22px] font-bold text-[#1a1f36] tracking-tight">{course.title}</span>
            </div>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#697386] uppercase tracking-wider">Start Date</span>
                    <span className="text-[16px] font-normal text-[#1a1f36]">{formatDate(course.start_date)}</span>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold text-[#697386] uppercase tracking-wider">End Date</span>
                    <span className="text-[16px] font-normal text-[#1a1f36]">
                        {course.end_date ? formatDate(course.end_date) : 'TBA'}
                    </span>
                </div>
            </div>
            <div className="bg-[#f6f8fa] border border-[#e3e8ee] p-4 rounded-md text-[15px] font-normal text-[#1a1f36] text-center mt-2">
                {user?.email || 'N/A'}
            </div>
        </div>
      </div>
      
      {showDetails && (
        <div 
            className="fixed inset-0 bg-black/20 z-[55] md:hidden backdrop-blur-[1px]"
            onClick={() => setShowDetails(false)}
        />
      )}

      {/* --- MOBILE BILL DRAWER (Bottom) --- */}
      {showBill && (
        <div 
            className="fixed inset-0 bg-black/20 z-[55] md:hidden backdrop-blur-[1px]"
            onClick={() => setShowBill(false)}
        />
      )}
      <div 
        className={`fixed bottom-[72px] left-0 w-full bg-white z-[56] rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out flex flex-col px-6 py-6 border-t border-gray-100 md:hidden ${
            showBill ? 'translate-y-0' : 'translate-y-[150%]'
        }`}
      >
        <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-[#697386] uppercase tracking-wider">Enrollment Summary</h3>
            <div 
                className="bg-gray-100 p-1.5 rounded-full cursor-pointer"
                onClick={() => setShowBill(false)}
            >
                <X className="w-4 h-4 text-[#1a1f36]" />
            </div>
        </div>

        <div className="flex flex-col gap-3 font-['Inter',sans-serif]">
            <div className="flex justify-between items-baseline py-1">
                <span className="text-[15px] text-[#1a1f36] font-medium">Base Plan</span>
                <span className="text-[15px] font-medium text-[#1a1f36]">
                    {effectiveBasePrice === 0 ? "Free" : `₹${effectiveBasePrice}`}
                </span>
            </div>
            
            {selectedAddonsList.length > 0 && <div className="h-px bg-gray-100 my-1"></div>}
            
            {selectedAddonsList.map(addon => (
                <div key={`bill-${addon.id}`} className="flex justify-between items-baseline py-1">
                    <span className="text-[14px] text-[#4f566b] truncate max-w-[200px]">{addon.subject_name}</span>
                    <span className="text-[14px] font-medium text-[#1a1f36]">₹{addon.price}</span>
                </div>
            ))}

            {appliedCoupon && (
                <div className="flex justify-between items-baseline py-1">
                    <span className="text-[14px] text-[#137333] font-medium flex items-center gap-1">
                        <BadgePercent className="w-3.5 h-3.5" /> {appliedCoupon.code}
                    </span>
                    <span className="text-[14px] font-semibold text-[#137333]">−₹{couponDiscount}</span>
                </div>
            )}

            <div className="border-t border-dashed border-gray-300 my-2"></div>

            <div className="flex justify-between items-center">
                <span className="text-[16px] font-bold text-[#1a1f36]">Total Due</span>
                <span className="text-[18px] font-bold text-[#1a1f36]">₹{finalTotal}</span>
            </div>
        </div>
      </div>


      {/* --- RESTORED: MOBILE HEADER (WITH LOGO) --- */}
      <div className="w-full bg-white/50 backdrop-blur-md border-b border-gray-100 z-50 sticky top-0 md:hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <div 
                className="cursor-pointer group flex items-center gap-4"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="w-5 h-5 text-[#1a1f36]" />
                <div className="flex items-center gap-3">
                    <img src="https://i.ibb.co/kgdrjTby/UI-Logo.png" alt="UI Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
                    <span className="font-['Inter',sans-serif] font-bold text-[#1a1f36] text-lg tracking-tight">Unknown IITians</span>
                </div>
            </div>
          </div>
      </div>

      <div className="relative z-10 w-full max-w-[1000px] px-5 mt-4 md:mt-12 pb-32 md:pb-20">
        
        {/* --- PC HEADER (UNCHANGED) --- */}
        <div 
            className="hidden md:flex mb-10 w-fit cursor-pointer group items-center gap-4"
            onClick={() => navigate(-1)}
        >
            <ArrowLeft className="w-5 h-5 text-[#1a1f36] transition-transform duration-300 ease-in-out group-hover:-translate-x-1" />
            <div className="grid place-items-start">
                <div className="col-start-1 row-start-1 flex items-center gap-4 transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:-translate-y-2 group-hover:pointer-events-none">
                    <img src="https://i.ibb.co/kgdrjTby/UI-Logo.png" alt="UI Logo" className="w-14 h-14 object-contain drop-shadow-sm" />
                    <span className="font-['Inter',sans-serif] font-bold text-[#1a1f36] text-2xl tracking-tight">Unknown IITians</span>
                </div>
                <div className="col-start-1 row-start-1 flex items-center h-full transition-all duration-300 ease-in-out opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0">
                    <span className="font-['Inter',sans-serif] font-bold text-[#1a1f36] text-lg tracking-tight pl-1">Back</span>
                </div>
            </div>
        </div>

        {/* --- RESTORED: MOBILE DETAILS TOGGLE --- */}
        <div className="flex justify-center mt-2 mb-6 md:hidden">
            <button 
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md transition-all duration-200 active:scale-95 border border-gray-200/50 shadow-sm"
            >
                <span className="font-normal text-sm">View Detail</span>
                {showDetails ? <ChevronUp className="w-4 h-4 text-black" /> : <ChevronDown className="w-4 h-4 text-black" />}
            </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-[60px]">
          <div className="flex-[1.2] w-full">
            <div className="hidden md:block mb-8">
                <h1 className="text-[28px] font-bold tracking-tight text-[#1a1f36]">Select Your Subjects</h1>
                <h2 className="text-xl text-[#1a1f36] mt-4 mb-2">
                    <span className="font-semibold">Batch Name:</span> <span className="font-normal">{course.title}</span>
                </h2>
                <p className="text-[#4f566b] font-medium text-sm mb-4">
                    {course.start_date && <span>Starts on {formatDate(course.start_date)}</span>}
                    {course.start_date && course.end_date && <span className="mx-2">•</span>}
                    {course.end_date && <span>Ends on {formatDate(course.end_date)}</span>}
                </p>
            </div>

            <div className="md:hidden mb-6">
                 <h1 className="text-[24px] font-bold tracking-tight text-[#1a1f36]">Select Your Subjects</h1>
                 <p className="text-[#4f566b] text-sm mt-1">Customize your learning path.</p>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Core Subjects */}
              {coreSubjects.map((subject, idx) => (
                <div key={`core-${idx}`} className="flex items-center justify-between bg-white border border-[#e3e8ee] p-[18px] px-6 rounded-lg opacity-80 cursor-not-allowed select-none">
                  <div className="flex items-center flex-grow">
                    {isMainCourseOwned ? (
                        /* Empty Spacer for Enrolled Items */
                        <div className="w-5 h-5 mr-4" />
                    ) : (
                        <div className="w-5 h-5 bg-[#e3e8ee] border border-[#e3e8ee] rounded-[4px] mr-4 flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#4f566b]" strokeWidth={3} />
                        </div>
                    )}
                    <span className="font-medium text-[15px] text-[#1a1f36]">{subject}</span>
                  </div>
                  <span className="font-semibold text-[11px] text-[#22c55e] bg-green-50 px-2 py-1 rounded tracking-wide">
                    {isMainCourseOwned ? "ENROLLED" : "INCLUDED"}
                  </span>
                </div>
              ))}

              {/* Add-ons */}
              {addons.map((addon) => {
                const isOwned = ownedAddonIds.includes(addon.id);
                const isSelected = selectedAddonIds.includes(addon.id) || isOwned;
                
                return (
                  <label 
                    key={addon.id} 
                    className={`group flex items-center justify-between border p-[18px] px-6 rounded-lg transition-all duration-150 
                        ${isOwned 
                            ? 'bg-gray-50 border-gray-200 cursor-not-allowed' 
                            : 'bg-white border-[#e3e8ee] cursor-pointer hover:border-black hover:shadow-sm'
                        }`}
                  >
                    <div className="flex items-center flex-grow">
                      {isOwned ? (
                          /* Empty Spacer for Enrolled Items */
                          <div className="w-5 h-5 mr-4" />
                      ) : (
                          <div className={`w-5 h-5 border rounded-[4px] mr-4 flex items-center justify-center transition-colors duration-200 
                            ${isSelected 
                                ? 'bg-[#1a1f36] border-[#1a1f36]' 
                                : 'bg-white border-[#e3e8ee] group-hover:border-[#b0b6c0]'
                            }`}>
                             <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={isSelected} 
                                disabled={isOwned}
                                onChange={() => toggleAddon(addon.id)} 
                             />
                             {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                          </div>
                      )}
                      
                      <span className={`font-medium text-[15px] ${isOwned ? 'text-gray-500' : 'text-[#1a1f36]'}`}>
                        {addon.subject_name}
                      </span>
                    </div>
                    
                    {isOwned ? (
                        <span className="text-xs font-bold text-[#22c55e] bg-green-50 px-2 py-1 rounded">
                            ENROLLED
                        </span>
                    ) : (
                        <span className="font-semibold text-[15px] text-[#1a1f36]">₹{addon.price}</span>
                    )}
                  </label>
                );
              })}
            </div>

            {/* --- MOBILE COUPON SECTION (after subjects) --- */}
            <div className="md:hidden mt-6 space-y-4">
              {/* Coupon input */}
              <div>
                <div className="flex items-center gap-1.5 mb-2 text-[11px] font-bold text-[#697386] uppercase tracking-wider">
                  <BadgePercent className="w-3 h-3" /> Have a coupon?
                </div>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2.5">
                    <div className="flex items-center gap-2 text-sm text-green-800 min-w-0">
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="font-semibold truncate">{appliedCoupon.code}</span>
                      <span className="text-green-700">· save ₹{couponDiscount}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-xs text-green-700 hover:text-green-900 underline shrink-0 ml-2">
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon(); }}
                        placeholder="Enter code"
                        className="flex-1 border border-[#e3e8ee] rounded-md px-3 py-2.5 text-sm outline-none focus:border-[#1a1f36] uppercase tracking-wide min-w-0"
                      />
                      <button
                        onClick={() => applyCoupon()}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2.5 bg-white border border-[#1a1f36] text-[#1a1f36] rounded-md text-sm font-semibold disabled:opacity-50 shrink-0"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && <p className="text-xs text-red-600 mt-1.5">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Available offers on mobile */}
              {availableOffers.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-[#697386] uppercase tracking-wider mb-2">Available Offers</div>
                  <div className="flex flex-col gap-2">
                    {availableOffers.map((offer) => (
                      <div
                        key={`m-offer-${offer.code}`}
                        className={`flex items-start justify-between gap-2 border rounded-md px-3 py-2 text-xs ${
                          offer.eligible
                            ? 'border-[#e3e8ee] bg-[#f8fafc]'
                            : 'border-[#eef0f3] bg-[#f6f8fa] opacity-60'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[#1a1f36] font-semibold">
                            <Tag className="w-3 h-3 shrink-0" />
                            <span className="truncate">{offer.code}</span>
                            {offer.eligible && offer.discountAmount !== undefined && (
                              <span className="text-[#137333] font-bold ml-1">−₹{offer.discountAmount}</span>
                            )}
                          </div>
                          {offer.label && <div className="text-[11px] text-[#4f566b] mt-0.5 truncate">{offer.label}</div>}
                          {!offer.eligible && offer.ineligibilityReason && (
                            <div className="text-[11px] text-[#697386] mt-0.5">{offer.ineligibilityReason}</div>
                          )}
                        </div>
                        {offer.eligible && (!appliedCoupon || appliedCoupon.code !== offer.code) && (
                          <button
                            onClick={() => { setCouponInput(offer.code); applyCoupon(offer.code); }}
                            className="text-[11px] font-bold text-[#1a1f36] hover:underline shrink-0"
                          >
                            APPLY
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:flex-[0.8] w-full flex flex-col justify-start pt-2 hidden md:flex">
            <div className="bg-white border border-[#e3e8ee] p-8 rounded-lg w-full shadow-sm md:sticky md:top-24">
              <h2 className="text-[18px] font-bold text-[#1a1f36] mb-6 tracking-tight">Enrollment Summary</h2>

              <div className="flex justify-between mb-3 text-sm">
                <div className="flex flex-col">
                    <span className="text-[#1a1f36] font-medium">Base Plan</span>
                    <span className="text-xs text-[#4f566b] truncate max-w-[150px]">{course.title}</span>
                </div>
                {isMainCourseOwned ? (
                     <span className="text-[#22c55e] font-bold text-xs bg-green-50 px-2 py-0.5 rounded h-fit">ENROLLED</span>
                ) : (
                    basePrice === 0 ? <span className="text-[#22c55e] font-bold">FREE</span> : <span className="text-[#1a1f36] font-medium">₹{basePrice}</span>
                )}
              </div>

              {selectedAddonsList.map(addon => (
                <div key={`summary-${addon.id}`} className="flex justify-between mb-3 text-sm animate-in fade-in slide-in-from-left-2">
                    <span className="text-[#4f566b]">{addon.subject_name}</span>
                    <span className="text-[#4f566b]">₹{addon.price}</span>
                </div>
              ))}

              {appliedCoupon && (
                <div className="flex justify-between mb-3 text-sm">
                  <span className="text-[#137333] font-medium flex items-center gap-1">
                    <BadgePercent className="w-4 h-4" /> {appliedCoupon.code}
                  </span>
                  <span className="text-[#137333] font-medium">−₹{couponDiscount}</span>
                </div>
              )}

              <div className="h-px bg-[#e3e8ee] my-5"></div>

              {/* Coupon input */}
              <div className="mb-5">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md px-3 py-2">
                    <div className="flex items-center gap-2 text-sm text-green-800">
                      <Check className="w-4 h-4" />
                      <span className="font-semibold">{appliedCoupon.code}</span>
                      <span className="text-green-700">applied · save ₹{couponDiscount}</span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-xs text-green-700 hover:text-green-900 underline"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-[11px] font-bold text-[#697386] uppercase tracking-wider">Have a coupon?</label>
                    <div className="flex gap-2 mt-1.5">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') applyCoupon(); }}
                        placeholder="Enter code"
                        className="flex-1 border border-[#e3e8ee] rounded-md px-3 py-2 text-sm outline-none focus:border-[#1a1f36] uppercase tracking-wide"
                      />
                      <button
                        onClick={() => applyCoupon()}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 bg-white border border-[#1a1f36] text-[#1a1f36] rounded-md text-sm font-semibold hover:bg-[#1a1f36] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 mt-1.5">{couponError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Available offers */}
              {availableOffers.length > 0 && (
                <div className="mb-5">
                  <div className="text-[11px] font-bold text-[#697386] uppercase tracking-wider mb-2">Available Offers</div>
                  <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                    {availableOffers.map((offer) => (
                      <div
                        key={`offer-${offer.code}`}
                        className={`flex items-start justify-between gap-2 border rounded-md px-3 py-2 text-xs ${
                          offer.eligible
                            ? 'border-[#e3e8ee] bg-[#f8fafc]'
                            : 'border-[#eef0f3] bg-[#f6f8fa] opacity-60'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[#1a1f36] font-semibold">
                            <Tag className="w-3 h-3 shrink-0" />
                            <span className="truncate">{offer.code}</span>
                            {offer.eligible && offer.discountAmount !== undefined && (
                              <span className="text-[#137333] font-bold ml-1">−₹{offer.discountAmount}</span>
                            )}
                          </div>
                          {offer.label && <div className="text-[11px] text-[#4f566b] mt-0.5 truncate">{offer.label}</div>}
                          {!offer.eligible && offer.ineligibilityReason && (
                            <div className="text-[11px] text-[#697386] mt-0.5">{offer.ineligibilityReason}</div>
                          )}
                        </div>
                        {offer.eligible && (!appliedCoupon || appliedCoupon.code !== offer.code) && (
                          <button
                            onClick={() => { setCouponInput(offer.code); applyCoupon(offer.code); }}
                            className="text-[11px] font-bold text-[#1a1f36] hover:underline shrink-0"
                          >
                            APPLY
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-baseline mb-6">
                <span className="text-[15px] font-semibold text-[#1a1f36]">Total Due Today</span>
                <span className="text-[24px] font-bold text-[#1a1f36]">₹{finalTotal}</span>
              </div>

              <button 
                onClick={handlePayment}
                disabled={processing || !hasItemsToEnroll}
                className="w-full bg-[#1a1f36] text-white border-0 py-3.5 px-4 rounded-md text-[15px] font-semibold cursor-pointer transition-colors hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-md"
              >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue to Payment"}
              </button>
              
              <p className="mt-6 text-[12px] text-[#4f566b] leading-relaxed text-center">
                By continuing, you agree to our <br className="hidden md:block"/>
                <a href="/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-[#635bff] no-underline font-medium hover:underline">Terms of Service</a> 
                {' '}&{' '} 
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#635bff] no-underline font-medium hover:underline">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE FIXED FOOTER --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[57] bg-white border-t border-[#e3e8ee] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-5 py-3 h-[72px] flex items-center justify-between animate-in fade-in slide-in-from-bottom-5">
        <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#697386] uppercase tracking-wider">Total Due</span>
            <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-[#1a1f36]">₹{finalTotal}</span>
            </div>
        </div>

        <div className="flex gap-2 h-11">
            <button 
                onClick={() => setShowBill(!showBill)}
                className="flex items-center justify-center w-11 h-11 bg-white hover:bg-gray-50 text-[#1a1f36] rounded-md border border-[#e3e8ee] active:scale-95 transition-all shadow-sm"
            >
                {showBill ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            <button 
                onClick={handlePayment}
                disabled={processing || !hasItemsToEnroll}
                className="bg-[#1a1f36] text-white px-6 h-11 rounded-md text-[14px] font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center min-w-[120px]"
            >
                {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : "PAY NOW"}
            </button>
        </div>
      </div>

      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none w-auto [&>button]:hidden">
          <div className="custom-modal-wrapper">
            <button className="close-icon" onClick={() => setShowPhoneDialog(false)}>&times;</button>
            <div className="loading-container"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
            <h2 className="modal-title">Contact Details Required</h2>
            <p className="modal-description">
              Please provide your phone number to generate your payment receipt.
            </p>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <div className="phone-input-wrapper">
                <CountryCodeSelect
                  value={selectedDialCode}
                  onChange={(value, country) => {
                    setSelectedDialCode(value);
                    if (country) setExpectedPhoneLength(country.phone_length);
                  }}
                  countryCodes={countryCodes as CountryCode[]}
                  className="dial-code-select-wrapper"
                />
                <input 
                  type="tel" 
                  className="form-input phone-number-input"
                  placeholder={`${'9'.repeat(expectedPhoneLength)}`}
                  value={manualPhone}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, expectedPhoneLength);
                    setManualPhone(digitsOnly);
                  }}
                  maxLength={expectedPhoneLength}
                />
              </div>
              <p className="phone-hint">
                Enter {expectedPhoneLength} digits for selected country
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowPhoneDialog(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handlePhoneSubmit} disabled={processing}>
                {processing ? "Verifying..." : "Continue to Enroll"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchConfiguration;
