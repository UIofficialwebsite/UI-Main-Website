import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

const MerchantContactAnantya = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white font-['Inter',sans-serif]">
      <NavBar />
      
      <main className="flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12 border-b border-gray-100 pb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">
              Merchant & Legal Contact Information
            </h1>
            <p className="text-gray-600">
              This page contains the official legal and contact information for payment processing, compliance, and merchant verification purposes.
            </p>
          </header>

          <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Legal Entity Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Legal Entity / Trade Name</h3>
                  <p className="text-lg font-medium text-gray-900">Anantya Overseas</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Operating Brand</h3>
                  <p className="text-lg font-medium text-gray-900">Unknown IITians</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Registered Address</h3>
                  <div className="text-gray-900 leading-relaxed">
                    <p>New Delhi,</p>
                    <p>Delhi, India</p>
                    {/* Add your full registered pin code and street address here for the gateway reviewers */}
                  </div>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Support Email</h3>
                  <a href="mailto:desk@unknowniitians.com" className="text-[#1d4ed8] hover:underline font-medium">
                    desk@unknowniitians.com
                  </a>
                  <p className="text-sm text-gray-500 mt-1">Expected response time: 24-48 hours</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Support Phone</h3>
                  <p className="text-gray-900 font-medium">+91 62971 43798</p>
                  <p className="text-sm text-gray-500 mt-1">Available via WhatsApp</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MerchantContactAnantya;
