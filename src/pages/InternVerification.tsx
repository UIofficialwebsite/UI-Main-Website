import React, { useState, useRef } from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Check, 
  X, 
  Printer, 
  Loader2
} from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const InternVerification = () => {
  usePageSEO(SEO_TITLES.INTERN_VERIFICATION, "/intern-verification");
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [verificationResult, setVerificationResult] = useState<null | { verified: boolean, message: string, details?: any }>(null);
  const [loading, setLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!employeeId || !name) {
      setVerificationResult({
        verified: false,
        message: "Please enter both employee ID and name."
      });
      toast({
        title: "Incomplete Information",
        description: "Please enter both employee ID and name.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('verify_employee', { p_employee_code: employeeId.trim() })
        .maybeSingle();

      if (error) {
        setVerificationResult({
          verified: false,
          message: "System error during verification."
        });
      } else if (!data) {
        setVerificationResult({
          verified: false,
          message: "No personnel record found matching these credentials."
        });
      } else {
        const dbName = data.full_name.toLowerCase().trim();
        const inputName = name.toLowerCase().trim();

        if (dbName !== inputName) {
           setVerificationResult({
            verified: false,
            message: "Employee ID found, but the provided name does not match our records."
          });
        } else {
          let statusText = "Active";
          if (data.status === 'completed') statusText = "Completed";
          if (data.status === 'terminated') statusText = "Terminated";

          // Generate consistent DOC ID suffix from Employee ID
          const cleanId = data.employee_code.replace(/[^a-zA-Z0-9]/g, '');
          const docSuffix = cleanId.length >= 6 ? cleanId.slice(-6).toUpperCase() : cleanId.toUpperCase().padEnd(6, '0');

          setVerificationResult({
            verified: true,
            message: "Record verified in official database.",
            details: {
              name: data.full_name,
              employeeId: data.employee_code,
              docId: `UI-VR-${docSuffix}`, // Pattern based on ID
              position: data.position,
              department: data.department,
              employeeType: data.employee_type,
              startDate: data.start_date ? new Date(data.start_date).toLocaleDateString('en-GB') : "N/A",
              endDate: data.end_date ? new Date(data.end_date).toLocaleDateString('en-GB') : "Present",
              status: statusText.toUpperCase(),
              verifiedAt: new Date().toLocaleString('en-GB'),
              verificationCertificateUrl: data.verification_certificate_url
            }
          });
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({
        verified: false,
        message: "An unexpected error occurred."
      });
    }
    setLoading(false);
  };

  const handleDownloadOfficialRecord = async () => {
    if (!printRef.current || !verificationResult?.verified) return;
    setIsGeneratingPdf(true);

    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff' 
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`Verification_${verificationResult.details.employeeId}.pdf`);
      
      toast({ 
        title: "Document Downloaded", 
        description: "Official verification record has been saved." 
      });
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to generate official document.", 
        variant: "destructive" 
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-slate-900">
      <NavBar />
      
      <main className="flex-grow pt-32 pb-20 px-6 sm:px-10 lg:px-16 w-full max-w-[1400px] mx-auto">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-20">
          
          <div className="lg:col-span-7 space-y-8 pt-4">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-4 font-serif">
                Personnel Verification
              </h1>
              <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
                Official portal for validating internship and employment records of Unknown IITians. Data is retrieved in real-time from the central HR registry.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 w-full">
            <div className="bg-white border border-slate-300 p-8 shadow-sm">
              <div className="mb-6 pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold uppercase tracking-widest text-slate-800">
                  Search Registry
                </h2>
              </div>
              
              <form onSubmit={handleVerify} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="employee-id" className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Employee / Intern ID
                  </label>
                  <Input
                    id="employee-id"
                    placeholder="UI/INT/..."
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    className="w-full h-11 bg-slate-50 border-slate-300 focus:border-slate-900 focus:ring-0 rounded-none text-slate-900"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="employee-name" className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
                    Full Legal Name
                  </label>
                  <Input
                    id="employee-name"
                    placeholder="As per records"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 bg-slate-50 border-slate-300 focus:border-slate-900 focus:ring-0 rounded-none text-slate-900"
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium uppercase tracking-wider rounded-none mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </span>
                  ) : "Validate Record"}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION */}
        {verificationResult && (
          <div className="mb-24 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {verificationResult.verified ? (
              <>
                <div className="border border-slate-200 bg-white shadow-sm max-w-4xl mx-auto">
                  <div className="bg-slate-50 px-8 py-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 bg-emerald-600 rounded-full"></div>
                      <span className="font-bold text-slate-800 uppercase tracking-wide text-sm">Record Found</span>
                    </div>
                    <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                      REF: {verificationResult.details.employeeId}
                    </span>
                  </div>

                  <div className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-500 uppercase bg-white border-b border-slate-200">
                          <tr>
                            <th className="px-8 py-5 font-bold tracking-wider w-1/4">Field</th>
                            <th className="px-8 py-5 font-bold tracking-wider w-3/4">Validated Detail</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          <tr>
                            <td className="px-8 py-4 text-slate-500 font-medium">Full Name</td>
                            <td className="px-8 py-4 font-bold text-slate-900">{verificationResult.details.name}</td>
                          </tr>
                          <tr>
                            <td className="px-8 py-4 text-slate-500 font-medium">Department</td>
                            <td className="px-8 py-4 text-slate-900">{verificationResult.details.department}</td>
                          </tr>
                          <tr>
                            <td className="px-8 py-4 text-slate-500 font-medium">Role / Position</td>
                            <td className="px-8 py-4 text-slate-900">{verificationResult.details.position}</td>
                          </tr>
                          <tr>
                            <td className="px-8 py-4 text-slate-500 font-medium">Tenure</td>
                            <td className="px-8 py-4 text-slate-900 font-mono">
                              {verificationResult.details.startDate} — {verificationResult.details.endDate}
                            </td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="px-8 py-4 text-slate-500 font-medium">Current Status</td>
                            <td className="px-8 py-4 font-bold text-slate-900 tracking-wide">
                              {verificationResult.details.status}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="px-8 py-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      Verified at: {verificationResult.details.verifiedAt}
                    </span>
                    
                    <Button 
                      onClick={handleDownloadOfficialRecord}
                      disabled={isGeneratingPdf}
                      className="bg-slate-900 text-white hover:bg-slate-800 rounded-none h-10 px-6 text-xs uppercase tracking-widest font-medium w-full sm:w-auto"
                    >
                      {isGeneratingPdf ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Printer className="w-4 h-4 mr-2" />
                      )}
                      Print Official Record
                    </Button>
                  </div>
                </div>
                
                <div className="text-center mt-4 sm:hidden">
                  <span className="text-xs text-slate-400 italic">
                    Verified at: {verificationResult.details.verifiedAt}
                  </span>
                </div>
              </>
            ) : (
              <div className="max-w-2xl mx-auto border border-red-200 bg-red-50 p-6 flex items-start gap-4">
                <X className="w-5 h-5 text-red-700 mt-0.5" />
                <div>
                  <h3 className="text-red-900 font-bold uppercase text-sm tracking-wide mb-1">Verification Failed</h3>
                  <p className="text-red-800 text-sm">
                    {verificationResult.message} Please check the credentials or contact the HR department.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FAQs */}
        <section className="max-w-3xl mx-auto border-t border-slate-200 pt-16">
          <h3 className="text-lg font-bold text-slate-900 mb-8 uppercase tracking-widest text-center">
            Verification Guidelines
          </h3>
          <Accordion type="single" collapsible className="w-full space-y-0 border border-slate-200">
            <AccordionItem value="item-1" className="border-b border-slate-200 bg-white">
              <AccordionTrigger className="text-sm font-semibold text-slate-800 px-6 py-4 hover:no-underline hover:bg-slate-50">
                Verification Protocol
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                This system queries the central Unknown IITians employee ledger. All records are updated in real-time upon contract completion or termination.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-b border-slate-200 bg-white">
              <AccordionTrigger className="text-sm font-semibold text-slate-800 px-6 py-4 hover:no-underline hover:bg-slate-50">
                Discrepancy Reporting
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 text-slate-600 text-sm leading-relaxed">
                Any inconsistencies in the displayed data should be immediately reported to the Human Resources department at <span className="font-medium text-slate-900">corporate@hq.unknowniitians.com</span> with a copy of the original offer letter.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

      </main>

      {/* --- HIDDEN OFFICIAL DOCUMENT TEMPLATE (For PDF Generation Only) --- */}
      <div 
        ref={printRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '210mm',
          minHeight: '297mm',
          backgroundColor: '#ffffff',
          padding: '20mm',
          fontFamily: "'Inter', sans-serif",
          color: '#000000',
          boxSizing: 'border-box'
        }}
      >
        {verificationResult?.verified && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Header */}
            <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img 
                  src="https://res.cloudinary.com/dkywjijpv/image/upload/v1769193106/UI_Logo_yiput4.png" 
                  alt="Official Logo" 
                  style={{ height: '50px', objectFit: 'contain' }} 
                />
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', margin: '0' }}>Unknown IITians</h1>
                  <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Human Resources Department</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Official Verification</div>
                <div style={{ fontSize: '10px', fontFamily: 'monospace' }}>DOC ID: {verificationResult.details.docId}</div>
              </div>
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '18px', textDecoration: 'underline', textTransform: 'uppercase', fontWeight: 'bold', margin: '0' }}>To Whomsoever It May Concern</h2>
            </div>

            {/* Body */}
            <div style={{ fontSize: '14px', lineHeight: '1.8', textAlign: 'justify', marginBottom: '40px' }}>
              <p style={{ marginBottom: '20px' }}>
                This is to officially certify that the employment/internship record of <strong>{verificationResult.details.name}</strong> has been successfully verified against our central personnel database.
              </p>
              <p style={{ marginBottom: '20px' }}>
                The details of the tenure are recorded as follows:
              </p>
            </div>

            {/* Formal Details Grid */}
            <div style={{ border: '1px solid #000', marginBottom: '40px' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ width: '40%', padding: '10px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f0f0f0' }}>Employee Name</div>
                <div style={{ width: '60%', padding: '10px', fontSize: '12px' }}>{verificationResult.details.name}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ width: '40%', padding: '10px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f0f0f0' }}>Unique ID</div>
                <div style={{ width: '60%', padding: '10px', fontSize: '12px' }}>{verificationResult.details.employeeId}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ width: '40%', padding: '10px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f0f0f0' }}>Department</div>
                <div style={{ width: '60%', padding: '10px', fontSize: '12px' }}>{verificationResult.details.department}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ width: '40%', padding: '10px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f0f0f0' }}>Designation</div>
                <div style={{ width: '60%', padding: '10px', fontSize: '12px' }}>{verificationResult.details.position}</div>
              </div>
              <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                <div style={{ width: '40%', padding: '10px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f0f0f0' }}>Tenure</div>
                <div style={{ width: '60%', padding: '10px', fontSize: '12px' }}>{verificationResult.details.startDate} to {verificationResult.details.endDate}</div>
              </div>
              <div style={{ display: 'flex' }}>
                <div style={{ width: '40%', padding: '10px', borderRight: '1px solid #000', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', backgroundColor: '#f0f0f0' }}>Current Status</div>
                <div style={{ width: '60%', padding: '10px', fontSize: '12px', fontWeight: 'bold' }}>{verificationResult.details.status}</div>
              </div>
            </div>

            {/* Footer / Stamp Area */}
            <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              
              {/* LEFT: Verification Status & Time */}
              <div style={{ textAlign: 'left', minWidth: '200px' }}>
                {/* MOVED VERIFIED STATUS HERE */}
                <div style={{ 
                  color: '#16a34a', 
                  fontSize: '16px', 
                  fontWeight: '900', 
                  textTransform: 'uppercase', 
                  border: '2px solid #16a34a', 
                  padding: '5px 10px', 
                  display: 'inline-block',
                  marginBottom: '15px',
                  letterSpacing: '1px'
                }}>
                  VERIFIED
                </div>
                
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>Date of Verification:</div>
                <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{verificationResult.details.verifiedAt}</div>
                <div style={{ fontSize: '10px', color: '#666', marginTop: '5px', fontStyle: 'italic' }}>Computer Generated Document</div>
              </div>

              {/* RIGHT: Stamp & Signature */}
              <div style={{ textAlign: 'center' }}>
                {/* Signature Layer */}
                <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 10px auto' }}>
                  
                  {/* Circular Stamp */}
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '50%', 
                    border: '3px double #1e3a8a', // Double circle border
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    color: '#1e3a8a',
                    boxSizing: 'border-box',
                    padding: '10px'
                  }}>
                    {/* Top Text */}
                    <div style={{ position: 'absolute', top: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Unknown IITians</div>
                    
                    {/* Faint Logo Background */}
                    <img 
                      src="https://res.cloudinary.com/dkywjijpv/image/upload/v1769193106/UI_Logo_yiput4.png" 
                      style={{ width: '50px', opacity: 0.2, filter: 'grayscale(100%)' }}
                      alt=""
                    />

                    {/* Bottom Location Text */}
                    <div style={{ position: 'absolute', bottom: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>New Delhi</div>
                  </div>

                  {/* Overlaid Signature */}
                  <img 
                    src="https://res.cloudinary.com/dkywjijpv/image/upload/v1769433351/image_4_1_g6qsah.png" 
                    alt="Signature" 
                    style={{ position: 'absolute', bottom: '25px', left: '15px', width: '110px', zIndex: 20 }}
                  />
                </div>

                <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto', paddingTop: '5px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold' }}>Recruitment In-Charge</div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase' }}>Authorized Signatory</div>
                </div>
              </div>

            </div>

            {/* Disclaimer Footer */}
            <div style={{ borderTop: '1px solid #ccc', paddingTop: '10px', marginTop: '30px', fontSize: '9px', color: '#666', textAlign: 'center' }}>
              Note: This is a manual verification and we advise the recruiters to two-step verify using this email <a href="mailto:hr@unknowniitians.com" style={{ color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>hr@unknowniitians.com</a> or the page link: {window.location.origin}/intern-verification.
            </div>

          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default InternVerification;
