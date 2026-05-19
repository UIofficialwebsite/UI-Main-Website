import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Check, Download, Share2, ArrowLeft, Mail, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Types ---
interface OrderItem {
  title: string;
  basePrice: number; // Logic: discounted_price if exists, else price
  validTill: string | null;
  image_url: string | null;
  id: string; 
  type: 'Batch' | 'Add-on';
}

interface ReceiptDetails {
  orderId: string;
  date: string;
  totalPaid: number;    // Sum of all payments for this course
  subtotal: number;     // Sum of basePrices of all items
  discount: number;     // Calculated: subtotal - totalPaid
  status: string;
  utr: string;
  paymentTime: string;
  items: OrderItem[];
}

const EnrollmentReceiptView = () => {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('courseId');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReceiptData = async () => {
      if (!user || !courseId) return;

      try {
        // 1. Fetch ALL enrollments for this user & course (History + Recent)
        const { data: allEnrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select(`
            order_id,
            created_at,
            status,
            amount,
            subject_name,
            courses (
              id,
              title,
              image_url,
              end_date,
              price,
              discounted_price
            )
          `)
          .eq('user_id', user.id)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false }); // Latest first

        if (enrollError) throw enrollError;

        if (!allEnrollments || allEnrollments.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Identify all unique Orders involved (Initial + Upgrades)
        const uniqueOrderIds = [...new Set(allEnrollments.map((e: any) => e.order_id).filter(Boolean))];

        // 3. Fetch Payments for ALL these orders
        let payments: any[] = [];
        if (uniqueOrderIds.length > 0) {
          const { data, error } = await supabase
            .from('payments')
            .select('*')
            .in('order_id', uniqueOrderIds)
            .order('created_at', { ascending: false }); // Latest payment first
            
          if (!error && data) payments = data;
        }

        // 4. Fetch Master Prices for Add-ons (for accurate base price display)
        let addonPricesMap = new Map<string, number>();
        if (allEnrollments.some((e: any) => e.subject_name)) {
          const { data: addonsData } = await supabase
            .from('course_addons')
            .select('subject_name, price')
            .eq('course_id', courseId);
            
          if (addonsData) {
            addonsData.forEach((addon: any) => {
              addonPricesMap.set(addon.subject_name, Number(addon.price));
            });
          }
        }

        // 5. Build Comprehensive Item List & Calculate Subtotal
        let calculatedSubtotal = 0;
        
        const finalItems: OrderItem[] = allEnrollments.map((item: any) => {
          const isAddon = !!item.subject_name;
          const displayTitle = item.subject_name || item.courses?.title || 'Unknown Item';
          
          let basePrice = 0;
          
          if (isAddon) {
            // Add-on Logic
            basePrice = addonPricesMap.get(item.subject_name) || 0;
            if (basePrice === 0) basePrice = Number(item.amount) || 0;
          } else {
            // Batch Logic
            const masterPrice = Number(item.courses?.price) || 0;
            const masterDiscounted = Number(item.courses?.discounted_price);
            
            if (!isNaN(masterDiscounted) && masterDiscounted > 0) {
                basePrice = masterDiscounted;
            } else {
                basePrice = masterPrice;
            }
          }

          calculatedSubtotal += basePrice;

          return {
            title: displayTitle,
            basePrice: basePrice,
            validTill: item.courses?.end_date,
            image_url: item.courses?.image_url,
            id: item.courses?.id,
            type: (isAddon ? 'Add-on' : 'Batch') as 'Add-on' | 'Batch'
          };
        }).sort((a, b) => {
           // Batch always on top
           if (a.type === 'Batch' && b.type !== 'Batch') return -1;
           if (b.type === 'Batch' && a.type !== 'Batch') return 1;
           return 0;
        });

        // 6. Calculate Total Paid (Sum of all successful payments)
        let finalTotalPaid = 0;
        
        if (payments.length > 0) {
            // Filter for successful/captured payments to avoid failed retries counting
            const validPayments = payments.filter(p => p.status === 'success' || p.status === 'Success' || p.status === 'captured' || p.status === 'PAID');
            const paymentsToSum = validPayments.length > 0 ? validPayments : payments;

            finalTotalPaid = paymentsToSum.reduce((sum, p) => {
                const net = Number(p.net_amount);
                const amt = Number(p.amount);
                // If net_amount exists (>0), prefer it. Else use amount.
                return sum + (net > 0 ? net : (amt || 0));
            }, 0);
        } else {
            // Fallback: Sum of enrollment amounts if no payment records found
            finalTotalPaid = allEnrollments.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
        }

        // 7. Determine Metadata (Use Latest Transaction Info)
        // Since we ordered allEnrollments and payments by desc, index 0 is latest.
        const latestEnrollment = allEnrollments[0];
        const latestPayment = payments[0]; 

        const finalStatus = latestPayment?.status || latestEnrollment.status || 'Success';
        const finalDate = latestPayment?.created_at || latestEnrollment.created_at;
        const finalUtr = latestPayment?.utr || (payments.length > 1 ? 'Multiple' : '-'); // Indicate multiple transactions if applicable
        const finalPaymentTime = latestPayment?.payment_time || new Date(finalDate).toLocaleTimeString();
        const displayOrderId = latestEnrollment.order_id || (latestEnrollment.courses as any)?.id || 'N/A';

        // Logic: Discount = (Subtotal Base) - (Total Paid)
        const finalDiscount = Math.max(0, calculatedSubtotal - finalTotalPaid);

        setReceipt({
          orderId: displayOrderId,
          date: finalDate,
          totalPaid: finalTotalPaid,
          subtotal: calculatedSubtotal,
          discount: finalDiscount,
          status: finalStatus,
          utr: finalUtr,
          paymentTime: finalPaymentTime,
          items: finalItems
        });

      } catch (error) {
        console.error('Error fetching receipt:', error);
        toast({
          title: "Error",
          description: "Could not load receipt details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceiptData();
  }, [user, courseId, toast]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return dateString; }
  };

  const formatValidTill = (dateString: string | null) => {
    if (!dateString) return "Lifetime Access";
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  const handleDownloadPDF = async () => {
    if (!receiptRef.current || !receipt) return;
    setIsDownloading(true);
    try {
      const element = receiptRef.current;
      
      // Generate Canvas from the HTML element
      const canvas = await html2canvas(element, { 
        scale: 2, // Higher scale for better clarity
        useCORS: true, 
        logging: false, 
        backgroundColor: '#ffffff' 
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // A4 Size dimensions in mm
      const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Add the first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Loop to create additional pages if content overflows
      while (heightLeft > 0) {
        position -= pdfHeight; // Move the image up to show the next segment
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`Invoice_${receipt.orderId}.pdf`);
      toast({ title: "Success", description: "Official invoice downloaded." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate receipt.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!receipt) return;
    const shareData = { title: 'Enrollment Receipt', text: `Enrollment Receipt for Order ${receipt.orderId}`, url: window.location.href };
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } 
    else { navigator.clipboard.writeText(window.location.href); toast({ title: "Link Copied", description: "Receipt link copied to clipboard." }); }
  };

  const handleContactUs = () => {
    if (!receipt) return;
    const formattedAmount = receipt.totalPaid === 0 ? 'Free' : `₹ ${receipt.totalPaid}`;
    const mailtoLink = `mailto:support@unknowniitians.live?cc=unknowniitians@gmail.com&subject=Support Request: Order ${receipt.orderId}&body=Order ID: ${receipt.orderId}%0D%0AAmount: ${formattedAmount}`;
    window.location.href = mailtoLink;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" /></div>;
  if (!receipt) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#64748b]"><h2 className="text-xl font-bold mb-2">Receipt Not Found</h2><Link to="/dashboard/enrollments"><Button variant="outline">Back to Enrollments</Button></Link></div>;

  const mainBatch = receipt.items.find(i => i.type === 'Batch') || receipt.items[0]; 
  const addOns = receipt.items.filter(i => i !== mainBatch);
  const displayItems = receipt.items; 

  return (
    <div className="font-['Inter',sans-serif] w-full max-w-[1000px] mx-auto pb-10">
      
      <div className="mb-6">
        <Link to="/dashboard/enrollments" className="inline-flex items-center text-sm text-[#64748b] hover:text-[#4f46e5] transition-colors font-medium">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Enrollments
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-10 text-center">
            <div className="w-11 h-11 bg-[#10b981] text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6" strokeWidth={3} />
            </div>
            <h1 className="text-2xl font-bold text-[#334155] mb-6">Payment Successful</h1>
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={handleDownloadPDF} disabled={isDownloading} className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-[18px] py-2.5 rounded-lg text-sm text-[#334155] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors disabled:opacity-50">
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isDownloading ? 'Generating...' : 'Download Invoice'}
              </button>
              <button onClick={handleShare} className="flex items-center gap-2 bg-white border border-[#e2e8f0] px-[18px] py-2.5 rounded-lg text-sm text-[#334155] hover:border-[#4f46e5] hover:text-[#4f46e5] transition-colors">
                <Share2 className="w-4 h-4" /> Share Receipt
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex justify-between text-[13px] text-[#64748b] mb-5">
              <span>Order Id: {receipt.orderId}</span>
              <span>Latest Transaction: {formatDate(receipt.date)}</span>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-[#fcfdfe] border border-[#f1f5f9] rounded-[10px] p-4 gap-4">
              <div className="flex gap-4 items-center w-full">
                <img src={mainBatch.image_url || "https://via.placeholder.com/90x60/4f46e5/ffffff?text=Course"} alt={mainBatch.title} className="w-[90px] h-[60px] bg-[#e2e8f0] rounded-md object-cover flex-shrink-0" />
                <div className="flex-grow">
                  <h3 className="text-base font-medium text-[#334155] mb-1 leading-tight">{mainBatch.title}</h3>
                  <p className="text-sm text-[#64748b] mb-1">
                    Price: <span className="text-[#334155] font-medium">{mainBatch.basePrice === 0 ? 'Free' : formatCurrency(mainBatch.basePrice)}</span>
                  </p>
                  <span className="inline-block bg-[#dcfce7] text-[#166534] text-[11px] px-2 py-0.5 rounded">Active</span>
                </div>
              </div>
              <Link to={`/courses/${mainBatch.id}`} className="w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-[#eef2ff] text-[#4f46e5] border-none px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors whitespace-nowrap cursor-pointer">Go to Batch</button>
              </Link>
            </div>

            {addOns.length > 0 && (
              <div className="mt-4 px-4 pt-4 border-t border-[#f1f5f9]">
                <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-3">Included Add-ons (All Purchased)</h4>
                <div className="space-y-3">
                  {addOns.map((addon, idx) => (
                    <div key={idx} className="flex items-center justify-between group py-1">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#f0f9ff] text-[#0ea5e9] flex items-center justify-center shrink-0">
                          <Plus className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-[#334155] font-medium">{addon.title}</span>
                      </div>
                      <Link to={`/courses/${addon.id}`} className="text-xs text-[#4f46e5] hover:underline font-medium">View</Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 bg-[#fafbff] p-4 rounded-lg">
              <label className="text-xs text-[#64748b] block mb-1">Valid Till:</label>
              <p className="text-base text-[#334155]">{formatValidTill(mainBatch.validTill)}</p>
            </div>
          </div>
        </div>

        {/* Right Column - Pricing */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
            <h2 className="text-[17px] font-bold text-[#334155] mb-5">Payment Summary</h2>
            
            {/* List breakdown - Showing BASE PRICE for each item */}
            {displayItems.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm text-[#64748b] mb-2">
                    <span className="truncate max-w-[180px]">{item.title} {item.type === 'Add-on' && '(Add-on)'}</span>
                    <span>{item.basePrice === 0 ? 'Free' : formatCurrency(item.basePrice)}</span>
                </div>
            ))}
            
            <div className="border-t border-[#e2e8f0] my-3"></div>
            
            {/* Subtotal */}
            <div className="flex justify-between text-sm text-[#64748b] mb-2">
              <span>Subtotal</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>

            {/* Discount - Calculated automatically, NO COUPON NAME */}
            {receipt.discount > 0 && (
              <div className="flex justify-between text-sm text-[#10b981] mb-2 font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(receipt.discount)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm text-[#64748b] mb-3"><span>Delivery Charges</span><span>₹ 0.00</span></div>
            
            <div className="mt-4 pt-4 border-t border-[#e2e8f0] flex justify-between text-base text-[#334155] font-medium">
              <span>Total Paid (Cumulative)</span>
              <span>{receipt.totalPaid === 0 ? '₹ 0.00' : formatCurrency(receipt.totalPaid)}</span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-[#f9faff] rounded-xl border border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.03)] p-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 pr-4">
                <h2 className="text-[17px] font-bold text-[#334155] mb-1">Need help?</h2>
                <p className="text-[13px] text-[#64748b] leading-[1.4] mb-4">Get in touch and we will be happy to help you.</p>
                <button onClick={handleContactUs} className="bg-[#4f46e5] text-white border-none px-6 py-2.5 rounded-lg text-sm font-medium cursor-pointer hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Contact Us
                </button>
              </div>
              <img src="https://illustrations.popsy.co/blue/customer-support.svg" className="w-20 opacity-80" alt="support" />
            </div>
          </div>
        </div>
      </div>

      {/* === HIDDEN FORMAL INVOICE TEMPLATE (PDF Only) === */}
      <div 
        ref={receiptRef}
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '210mm', minHeight: '297mm', backgroundColor: '#ffffff', padding: '40px', fontFamily: "'Inter', sans-serif", color: '#1a1a1a', boxSizing: 'border-box' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e5e7eb', paddingBottom: '24px', marginBottom: '32px' }}>
          <div>
            <img src="https://res.cloudinary.com/dkywjijpv/image/upload/v1769193106/UI_Logo_yiput4.png" alt="Logo" style={{ height: '50px', marginBottom: '16px', objectFit: 'contain' }} />
            <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#4b5563' }}>
              <strong>Unknown IITians</strong><br />Ed-tech Platform<br />New Delhi, India<br /><span style={{ color: '#4f46e5' }}>support@unknowniitians.live</span><br /><a href="https://unknowniitians.live" style={{ color: '#4f46e5', textDecoration: 'none' }}>www.unknowniitians.live</a>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111827', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>STATEMENT</h1>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              <p style={{ margin: '4px 0' }}><strong>Reference ID:</strong> {receipt.orderId}</p>
              <p style={{ margin: '4px 0' }}><strong>Date:</strong> {formatDate(receipt.date)}</p>
              <p style={{ margin: '4px 0' }}><strong>Time:</strong> {receipt.paymentTime}</p>
              <p style={{ margin: '4px 0' }}><strong>UTR:</strong> {receipt.utr}</p>
              <p style={{ margin: '4px 0' }}><strong>Status:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>PAID</span></p>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '40px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6b7280', fontWeight: 'bold', letterSpacing: '1px', margin: '0 0 8px 0' }}>Bill To</h3>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '4px' }}>{user?.user_metadata?.full_name || 'Valued Student'}</div>
          <div style={{ fontSize: '14px', color: '#4b5563' }}>{user?.email}<br />(Digital Delivery)</div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
          <thead>
            <tr style={{ backgroundColor: '#111827', color: '#ffffff' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '6px 0 0 6px' }}>Item Description</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', borderRadius: '0 6px 6px 0' }}>Price</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '16px', fontSize: '14px', color: '#1f2937' }}>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Access valid until: {formatValidTill(item.validTill)}</div>
                </td>
                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#4b5563' }}>{item.type === 'Batch' ? 'Digital Course' : 'Add-on'}</td>
                <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
                    {item.basePrice === 0 ? 'Free' : formatCurrency(item.basePrice)}
                </td>
                </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            
            {receipt.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#10b981' }}>
                    <span>Discount:</span>
                    <span>-{formatCurrency(receipt.discount)}</span>
                </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#4b5563' }}><span>Tax (0%):</span><span>₹ 0.00</span></div>
            <div style={{ borderTop: '2px solid #e5e7eb', margin: '8px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}><span>Total Paid:</span><span>{formatCurrency(receipt.totalPaid)}</span></div>
          </div>
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: 'bold', color: '#111827', marginBottom: '8px', textTransform: 'uppercase' }}>Terms & Conditions / Legal Disclaimer</h4>
          <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: '1.6', textAlign: 'justify' }}>
            <p style={{ marginBottom: '6px' }}>1. <strong>Consolidated Statement:</strong> This document represents a consolidated record of all access purchased for this course.</p>
            <p style={{ marginBottom: '6px' }}>2. <strong>Unauthorized Distribution:</strong> The content provided is the intellectual property of Unknown IITians. Unauthorized copying or distribution is strictly prohibited.</p>
            <p style={{ marginBottom: '6px' }}>3. <strong>Jurisdiction:</strong> Any disputes shall be subject to the exclusive jurisdiction of the courts located in New Delhi, India.</p>
            <p style={{ marginBottom: '6px' }}>4. <strong>Service Claims:</strong> Unknown IITians makes no guarantees regarding specific exam results. The materials are provided "as is".</p>
            <p style={{ marginBottom: '0' }}>This is a computer-generated statement and does not require a physical signature.</p>
          </div>
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>© {new Date().getFullYear()} Unknown IITians. All rights reserved. | www.unknowniitians.live</div>
        </div>
      </div>
    </div>
  );
};

export default EnrollmentReceiptView;
