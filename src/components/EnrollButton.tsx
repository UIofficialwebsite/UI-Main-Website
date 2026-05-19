import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useLoginModal } from "@/context/LoginModalContext";
import { useIsMobile } from "@/hooks/use-mobile";
import CountryCodeSelect, { CountryCode } from "@/components/ui/CountryCodeSelect";

// Injecting the user's specific CSS styles
const customStyles = `
  /* Modal Container Overrides */
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
  
  /* Mobile Drawer Specific Override */
  .mobile-drawer-wrapper {
    font-family: 'Inter', sans-serif !important;
    background: #ffffff;
    width: 100%;
    padding: 24px;
    position: relative;
  }

  /* THREE DOTS HORIZONTAL LOADING ANIMATION */
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

  /* Modal Content */
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

  /* Form Styling */
  .form-group {
    margin-bottom: 20px;
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

  /* Phone Input Wrapper - Split Layout */
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

  .form-input {
    width: 100%;
    padding: 14px;
    font-size: 15px;
    border: 1px solid #000000;
    outline: none;
    color: #000000;
    background: white;
  }

  .form-input::placeholder {
    color: #aaaaaa;
  }

  .phone-hint {
    font-size: 12px;
    color: #888888;
    margin-top: 6px;
  }

  /* Error Message Styling */
  .error-message {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #ef4444; /* Red-500 */
    font-size: 13px;
    font-weight: 500;
    margin-top: 8px;
    background-color: #fef2f2;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #fee2e2;
  }

  /* Modal Footer Buttons */
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
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

  .btn-primary {
    background: #000000;
    color: #ffffff;
    width: 100%;
  }

  .btn-primary:hover {
    background: #222222;
  }

  .btn-primary:disabled {
    background: #888888;
    cursor: not-allowed;
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
`;

// --- SEPARATE COMPONENT FOR PHONE VERIFICATION ---
interface VerificationContentProps {
  isDrawer?: boolean;
  manualPhone: string;
  setManualPhone: (val: string) => void;
  inlineError: string | null;
  setInlineError: (val: string | null) => void;
  handlePhoneSubmit: () => void;
  isProcessing: boolean;
  onClose: () => void;
  countryCodes: CountryCode[];
  selectedDialCode: string;
  setSelectedDialCode: (val: string) => void;
  expectedPhoneLength: number;
  setExpectedPhoneLength: (val: number) => void;
}

const VerificationContent: React.FC<VerificationContentProps> = ({
  isDrawer = false,
  manualPhone,
  setManualPhone,
  inlineError,
  setInlineError,
  handlePhoneSubmit,
  isProcessing,
  onClose,
  countryCodes,
  selectedDialCode,
  setSelectedDialCode,
  expectedPhoneLength,
  setExpectedPhoneLength
}) => {
  const handleDialCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDialCode = e.target.value;
    setSelectedDialCode(newDialCode);
    // Find the country and update expected phone length
    const dialCodeDigits = newDialCode.replace('+', '');
    const country = countryCodes.find(c => c.dial_code === dialCodeDigits);
    if (country) {
      setExpectedPhoneLength(country.phone_length);
    }
    if (inlineError) setInlineError(null);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and enforce max length
    const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, expectedPhoneLength);
    setManualPhone(digitsOnly);
    if (inlineError) setInlineError(null);
  };

  const selectedCountry = countryCodes.find(c => `+${c.dial_code}` === selectedDialCode);

  return (
    <div className={isDrawer ? "mobile-drawer-wrapper" : "custom-modal-wrapper"}>
      {!isDrawer && (
        <button className="close-icon" onClick={onClose}>&times;</button>
      )}

      <div className="loading-container">
        <div className="dot"></div><div className="dot"></div><div className="dot"></div>
      </div>

      <h2 className="modal-title">Contact Details Required</h2>
      <p className="modal-description">
        Please provide your phone number to generate your payment receipt and finalize your enrollment process.
      </p>

      <div className="form-group">
        <label className="form-label">Phone Number</label>
        <div className="phone-input-wrapper">
          <CountryCodeSelect
            value={selectedDialCode}
            onChange={(value, country) => {
              setSelectedDialCode(value);
              if (country) {
                setExpectedPhoneLength(country.phone_length);
              }
            }}
            countryCodes={countryCodes}
            className="dial-code-select-wrapper"
          />
          <input 
            type="tel" 
            className="form-input phone-number-input"
            placeholder={`${'9'.repeat(expectedPhoneLength)}`}
            value={manualPhone}
            onChange={handlePhoneChange}
            maxLength={expectedPhoneLength}
          />
        </div>
        {selectedCountry && (
          <p className="phone-hint">
            Enter {expectedPhoneLength} digits for {selectedCountry.name}
          </p>
        )}
        
        {inlineError && (
          <div className="error-message">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{inlineError}</span>
          </div>
        )}
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handlePhoneSubmit} disabled={isProcessing}>
          {isProcessing ? "Verifying..." : "Continue to Enroll"}
        </button>
      </div>
    </div>
  );
};

interface EnrollButtonProps {
  courseId?: string;
  enrollmentLink?: string;
  coursePrice?: number;
  className?: string;
  children?: React.ReactNode;
  selectedSubjects?: string[];
  disabled?: boolean;
  couponCode?: string | null;
}

const EnrollButton: React.FC<EnrollButtonProps> = ({
  courseId,
  enrollmentLink,
  coursePrice = 0,
  className = "",
  children = "Enroll Now",
  selectedSubjects = [],
  disabled = false,
  couponCode = null,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [manualPhone, setManualPhone] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);
  
  // New state for country codes
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
  const [selectedDialCode, setSelectedDialCode] = useState("+91");
  const [expectedPhoneLength, setExpectedPhoneLength] = useState(10);
  
  const { toast } = useToast();
  const { openLogin } = useLoginModal();
  const isMobile = useIsMobile();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch country codes when dialog opens
  useEffect(() => {
    if (showPhoneDialog && countryCodes.length === 0) {
      supabase
        .from('country_codes')
        .select('dial_code, name, phone_length, code')
        .order('name')
        .then(({ data, error }) => {
          if (!error && data) {
            setCountryCodes(data);
            // Default to India
            const india = data.find(c => c.dial_code === '91');
            if (india) {
              setExpectedPhoneLength(india.phone_length);
            }
          }
        });
    }
  }, [showPhoneDialog, countryCodes.length]);

  const handleEnrollClick = async () => {
    setInlineError(null);
    if (isAuthenticated === false) {
      openLogin();
      return;
    }

    if (enrollmentLink) {
      window.open(enrollmentLink, '_blank');
      return;
    }

    // Free courses also need phone number - removed bypass

    try {
      setIsProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        openLogin();
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, dial_code')
        .eq('id', user.id)
        .single();

      // Check if both dial_code and phone exist with sufficient length
      if (profile?.dial_code && profile?.phone && profile.phone.length >= 5) {
        const fullPhoneNumber = `${profile.dial_code}${profile.phone}`;
        if (coursePrice === 0) {
          await handleFreeEnroll(fullPhoneNumber);
        } else {
          processPayment(fullPhoneNumber);
        }
      } else {
        setIsProcessing(false);
        setShowPhoneDialog(true);
      }
    } catch (error) {
      console.error("Error checking profile:", error);
      setIsProcessing(false);
      setShowPhoneDialog(true);
    }
  };

  // --- Handle Free Enrollment with Phone Number ---
  const handleFreeEnroll = async (phoneNumber: string) => {
    try {
      setIsProcessing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        openLogin();
        return;
      }

      // Fetch course details for payments table
      let batchName = 'Free Course';
      let subjectsString = 'No subjects';
      
      if (courseId) {
        const { data: courseData } = await supabase
          .from('courses')
          .select('title, subject')
          .eq('id', courseId)
          .single();
        
        if (courseData) {
          batchName = courseData.title;
          const subjects = courseData.subject 
            ? courseData.subject.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
          // Combine with selectedSubjects if any
          const allSubjects = [...new Set([...subjects, ...selectedSubjects])];
          subjectsString = allSubjects.length > 0 ? allSubjects.join(', ') : 'No subjects';
        }
      }

      // 1. Insert into enrollments table
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId,
          amount: 0,
          status: 'active',
          payment_id: 'free_enrollment',
          subject_name: selectedSubjects.length > 0 ? selectedSubjects[0] : null
        });

      if (enrollError) {
        if (enrollError.code === '23505') { // Unique violation code
          toast({
            title: "Already Enrolled",
            description: "You are already enrolled in this batch.",
          });
          return;
        }
        throw enrollError;
      }

      // 2. Insert into payments table for tracking
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
        // Don't throw - enrollment succeeded, payment record is for tracking only
      }

      // Dispatch event so useEnrollmentStatus re-checks immediately
      window.dispatchEvent(new CustomEvent('enrollment-updated', { detail: { courseId } }));

      toast({
        title: "Success",
        description: "Successfully enrolled in the batch!",
      });

      // Redirect to Study Portal
      window.location.href = "/redirect-to-portal";
      
    } catch (err: any) {
      console.error("Free Enrollment Error:", err);
      toast({
        title: "Enrollment Failed",
        description: "Could not enroll. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhoneSubmit = async () => {
    setInlineError(null);

    // Dynamic validation based on selected country
    const digitsOnly = manualPhone.replace(/[^0-9]/g, '');
    const dialCodeDigits = selectedDialCode.replace('+', '');
    const country = countryCodes.find(c => c.dial_code === dialCodeDigits);
    
    if (country && digitsOnly.length !== country.phone_length) {
      setInlineError(`Phone number should be ${country.phone_length} digits for ${country.name}`);
      return;
    }
    
    // Fallback validation if country not found
    if (!country && (digitsOnly.length < 5 || digitsOnly.length > 15)) {
      setInlineError("Please enter a valid phone number (5-15 digits).");
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Save dial_code and phone separately
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            dial_code: selectedDialCode,
            phone: manualPhone 
          })
          .eq('id', user.id);

        if (updateError) {
          console.error("Failed to update profile phone:", updateError);
        }
      }
      
      // Send combined format for payment or free enrollment
      const fullPhoneNumber = `${selectedDialCode}${manualPhone}`;
      
      // Check if this is a free course
      if (coursePrice === 0) {
        await handleFreeEnroll(fullPhoneNumber);
      } else {
        await processPayment(fullPhoneNumber);
      }
      setShowPhoneDialog(false); 
    } catch (error: any) {
      setIsProcessing(false);
      setInlineError(error.message || "Something went wrong. Please try again.");
    }
  };

  const processPayment = async (phoneNumber: string) => {
    setIsProcessing(true);
    setInlineError(null);

    try {
      if (!courseId) throw new Error("Course information is missing");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log("Initiating Payment...");

      const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
        body: {
          courseId,
          userId: user.id,
          customerEmail: user.email,
          customerPhone: phoneNumber,
          selectedSubjects: selectedSubjects,
          couponCode: couponCode ?? null,
        },
      });

      if (error) {
        console.error("Supabase Invoke Error:", error);
        let errorMessage = "Payment initialization failed";
        try {
           const body = JSON.parse(error.message);
           errorMessage = body.error || errorMessage;
        } catch (e) {
           if (error.message) errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (data?.error) {
         throw new Error(data.error);
      }

      if (!data || !data.payment_session_id) {
        throw new Error("Invalid response from payment server");
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => {
        const cashfreeMode = data.environment || 'sandbox'; 
        const cashfree = (window as any).Cashfree({ mode: cashfreeMode });
        
        cashfree.checkout({
          paymentSessionId: data.payment_session_id,
          returnUrl: data.verifyUrl, 
        });
      };
      document.body.appendChild(script);

    } catch (error: any) {
      console.error("Enrollment error:", error);
      if (showPhoneDialog) {
        setInlineError(error.message);
      } else {
        toast({
          title: "Enrollment Failed",
          description: error.message,
          variant: "destructive",
        });
      }
      setIsProcessing(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />

      <Button 
        onClick={handleEnrollClick}
        className={className}
        disabled={isProcessing || disabled}
      >
        {isProcessing && !showPhoneDialog ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          children
        )}
      </Button>

      {isMobile ? (
        <Drawer open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
          <DrawerContent>
            <VerificationContent 
              isDrawer={true} 
              manualPhone={manualPhone}
              setManualPhone={setManualPhone}
              inlineError={inlineError}
              setInlineError={setInlineError}
              handlePhoneSubmit={handlePhoneSubmit}
              isProcessing={isProcessing}
              onClose={() => setShowPhoneDialog(false)}
              countryCodes={countryCodes}
              selectedDialCode={selectedDialCode}
              setSelectedDialCode={setSelectedDialCode}
              expectedPhoneLength={expectedPhoneLength}
              setExpectedPhoneLength={setExpectedPhoneLength}
            />
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
          <DialogContent className="p-0 border-none bg-transparent shadow-none max-w-none w-auto [&>button]:hidden">
            <VerificationContent 
              isDrawer={false} 
              manualPhone={manualPhone}
              setManualPhone={setManualPhone}
              inlineError={inlineError}
              setInlineError={setInlineError}
              handlePhoneSubmit={handlePhoneSubmit}
              isProcessing={isProcessing}
              onClose={() => setShowPhoneDialog(false)}
              countryCodes={countryCodes}
              selectedDialCode={selectedDialCode}
              setSelectedDialCode={setSelectedDialCode}
              expectedPhoneLength={expectedPhoneLength}
              setExpectedPhoneLength={setExpectedPhoneLength}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default EnrollButton;
