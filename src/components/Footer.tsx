import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Youtube, Linkedin, Instagram, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <footer className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/web-uploads/UI_logo.png"
                alt="Unknown IITians"
                className="h-12 w-12 "
              />
              <span className="text-xl font-semibold text-white">Unknown IITians</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              We believe every learner deserves the freedom to shape their own journey. Our platform supports diverse paths by offering resources that prioritize clarity, real-world relevance, and individual choice over rigid systems.
            </p>
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white">Let's get social :</h4>
              <div className="flex space-x-5">
                <a 
                  href="https://www.youtube.com/@UnknownIITians" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/4/42/YouTube_icon_%282013-2017%29.png" 
                    alt="YouTube" 
                    className="w-7 h-7 object-contain"
                  />
                </a>
                <a 
                  href="https://linkedin.com/company/unknown-iitians/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png" 
                    alt="LinkedIn" 
                    className="w-7 h-7 object-contain"
                  />
                </a>
                <a 
                  href="https://www.instagram.com/unknown_iitians/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" 
                    alt="Instagram" 
                    className="w-7 h-7 object-contain"
                  />
                </a>
                <a 
                  href="https://whatsapp.com/channel/0029VayHsVwIiRorIdVX9n1l" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" 
                    alt="WhatsApp" 
                    className="w-7 h-7 object-contain"
                  />
                </a>
                <a 
                  href="https://t.me/bsdatascience_iitm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg" 
                    alt="Telegram" 
                    className="w-7 h-7 object-contain"
                  />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/exam-preparation/iitm-bs" className="text-gray-300 hover:text-white transition-colors text-sm">
                  IITM BS Prep
                </Link>
              </li>
              <li>
                <Link to="/exam-preparation/jee/notes" className="text-gray-300 hover:text-white transition-colors text-sm">
                  JEE Prep
                </Link>
              </li>
              <li>
                <Link to="/exam-preparation/neet/notes" className="text-gray-300 hover:text-white transition-colors text-sm">
                  NEET Prep
                </Link>
              </li>
              <li>
                <Link to="/career" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Career
                </Link>
              </li>
              <li>
                <Link to="/intern-verification" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail size={16} className="text-royal flex-shrink-0" />
                <span className="text-gray-300 text-sm">desk@unknowniitians.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone size={16} className="text-royal flex-shrink-0" />
                <span className="text-gray-300 text-sm"> To be updated soon</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin size={16} className="text-royal flex-shrink-0 mt-1" />
                <span className="text-gray-300 text-sm">
                  New Delhi, Delhi, India <br />
                </span>
              </div>
            </div>

            {/* Compact Newsletter Section */}
            <div className="pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium mb-2 text-white">Stay Updated</h4>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 text-sm h-8"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-royal hover:bg-royal-dark text-xs h-8"
                >
                  {isSubmitting ? "Subscribing..." : "Subscribe"}
                </Button>
              </form>
            </div>
          </div>


          {/* Legal & Support */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Legal & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-gray-300 hover:text-white transition-colors text-sm">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Learning Resources Section - Separate Row */}
        <div className="border-t border-gray-700 mt-12 pt-12">
          <h3 className="text-2xl font-bold mb-8 text-left">Learning Resources</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* IITM BS Notes */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">IITM BS Notes</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Data Science</h5>
                  <ul className="space-y-1.5 ml-2">
                    <li>
                      <a href="/exam-preparation/iitm-bs/notes/data-science/foundation" className="text-gray-400 hover:text-white transition-colors text-sm">
                        Foundation Level
                      </a>
                    </li>
                    <li>
                      <a href="/exam-preparation/iitm-bs/notes/data-science/diploma" className="text-gray-400 hover:text-white transition-colors text-sm">
                        Diploma Level
                      </a>
                    </li>
                    <li>
                      <a href="/exam-preparation/iitm-bs/notes/data-science/degree" className="text-gray-400 hover:text-white transition-colors text-sm">
                        Degree Level
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Electronic Systems</h5>
                  <ul className="space-y-1.5 ml-2">
                    <li>
                      <a href="/exam-preparation/iitm-bs/notes/electronic-systems/foundation" className="text-gray-400 hover:text-white transition-colors text-sm">
                        Foundation Level
                      </a>
                    </li>
                    <li>
                      <a href="/exam-preparation/iitm-bs/notes/electronic-systems/diploma" className="text-gray-400 hover:text-white transition-colors text-sm">
                        Diploma Level
                      </a>
                    </li>
                    <li>
                      <a href="/exam-preparation/iitm-bs/notes/electronic-systems/degree" className="text-gray-400 hover:text-white transition-colors text-sm">
                        Degree Level
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">Other Exams</h5>
                  <ul className="space-y-1.5 ml-2">
                    <li>
                      <a href="/exam-preparation/jee/notes" className="text-gray-400 hover:text-white transition-colors text-sm">
                        JEE Notes
                      </a>
                    </li>
                    <li>
                      <a href="/exam-preparation/neet/notes" className="text-gray-400 hover:text-white transition-colors text-sm">
                        NEET Notes
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* PYQs */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Previous Year Questions</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">IITM BS</h5>
                  <ul className="space-y-1.5 ml-2">
                    <li>
                      <a href="/exam-preparation/iitm-bs/pyqs" className="text-gray-400 hover:text-white transition-colors text-sm">
                        All IITM BS PYQs
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">JEE</h5>
                  <ul className="space-y-1.5 ml-2">
                    <li>
                      <a href="/exam-preparation/jee/pyqs" className="text-gray-400 hover:text-white transition-colors text-sm">
                        JEE Main - January Session
                      </a>
                    </li>
                    <li>
                      <a href="/exam-preparation/jee/pyqs" className="text-gray-400 hover:text-white transition-colors text-sm">
                        JEE Main - April Session
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-300 mb-2">NEET</h5>
                  <ul className="space-y-1.5 ml-2">
                    <li>
                      <a href="/exam-preparation/neet/pyqs" className="text-gray-400 hover:text-white transition-colors text-sm">
                        NEET PYQs
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tools & Courses */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">IITM Tools</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/iitm-tools/cgpa-calculator" className="text-gray-400 hover:text-white transition-colors text-sm">
                    CGPA Calculator
                  </a>
                </li>
                <li>
                  <a href="/iitm-tools/grade-calculator/data-science/foundation" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Grade Calculator
                  </a>
                </li>
                <li>
                  <a href="/iitm-tools/marks-predictor/data-science/foundation" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Marks Predictor
                  </a>
                </li>
              </ul>
            </div>

            {/* Courses */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">Courses</h4>
              <ul className="space-y-2">
                <li>
                  <a href="/courses?category=iitm-bs" className="text-gray-400 hover:text-white transition-colors text-sm">
                    IITM BS Courses
                  </a>
                </li>
                <li>
                  <a href="/courses?category=jee" className="text-gray-400 hover:text-white transition-colors text-sm">
                    JEE Courses
                  </a>
                </li>
                <li>
                  <a href="/courses?category=neet" className="text-gray-400 hover:text-white transition-colors text-sm">
                    NEET Courses
                  </a>
                </li>
                <li>
                  <a href="/courses" className="text-gray-400 hover:text-white transition-colors text-sm">
                    All Courses
                  </a>
                </li>
                <li>
                  <a href="/courses" className="text-gray-400 hover:text-white transition-colors text-sm">
                    Video Lectures
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              © 2026 Unknown IITians. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
