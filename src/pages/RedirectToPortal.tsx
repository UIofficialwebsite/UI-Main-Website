import { useEffect } from "react";

const RedirectToPortal = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = "https://ssp.unknowniitians.com";
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background font-['Inter',sans-serif]">
      <div className="animate-fade-in flex flex-col items-center gap-6">
        <img
          src="/web-uploads/UI_logo.png"
          alt="Unknown IITians Logo"
          className="h-16 w-auto mb-2"
        />

        <p className="text-xl font-bold text-foreground tracking-tight">
          Redirecting to Study Portal...
        </p>

        {/* Three-dot pulse animation */}
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground animate-[dot-pulse_1.4s_ease-in-out_infinite_-0.32s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground animate-[dot-pulse_1.4s_ease-in-out_infinite_-0.16s]" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground animate-[dot-pulse_1.4s_ease-in-out_infinite]" />
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          You'll be taken to the Student Service Portal shortly.
        </p>
      </div>
    </div>
  );
};

export default RedirectToPortal;
