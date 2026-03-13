import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { BackendIntegratedWrapper } from "@/components/BackendIntegratedWrapper";
import { LoginModalProvider } from "@/context/LoginModalContext";
import GlobalLoginModal from "@/components/auth/GlobalLoginModal";
import ScrollPersistence from "@/components/ScrollPersistence";
import { Suspense, lazy, ComponentType } from "react";

// Helper to handle chunk loading errors with auto-reload
function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    componentImport().catch((error) => {
      // Check if it's a chunk loading error
      if (
        error.message?.includes('Failed to fetch dynamically imported module') ||
        error.message?.includes('Loading chunk') ||
        error.message?.includes('Loading CSS chunk')
      ) {
        // Clear cache and reload
        console.warn('Chunk loading failed, reloading page...', error);
        window.location.reload();
        // Return a never-resolving promise to prevent render during reload
        return new Promise(() => {});
      }
      throw error;
    })
  );
}

// Lazy Load Pages with retry
const Index = lazyWithRetry(() => import("./pages/Index"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const FocusArea = lazyWithRetry(() => import("./pages/FocusArea"));
const CourseListing = lazyWithRetry(() => import("./pages/CourseListing"));
const Courses = lazyWithRetry(() => import("./pages/Courses"));
const JEEPrep = lazyWithRetry(() => import("./pages/JEEPrep"));
const NEETPrep = lazyWithRetry(() => import("./pages/NEETPrep"));
const IITMBSPrep = lazyWithRetry(() => import("./pages/IITMBSPrep"));
const IITMBSSubjectNotesPage = lazyWithRetry(() => import("./pages/IITMBSSubjectNotesPage"));
const Career = lazyWithRetry(() => import("./pages/Career"));
const CareerOpportunities = lazyWithRetry(() => import("./pages/CareerOpportunities"));
const JobDetails = lazyWithRetry(() => import("./pages/JobDetails"));
const About = lazyWithRetry(() => import("./pages/About"));
const Contact = lazyWithRetry(() => import("./pages/Contact")); // Added Contact Page
const CourseDetail = lazyWithRetry(() => import("./pages/CourseDetail"));
const BatchConfiguration = lazyWithRetry(() => import("./pages/BatchConfiguration")); 
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"));
const ProfileComplete = lazyWithRetry(() => import("./pages/ProfileComplete"));
const GoogleCallback = lazyWithRetry(() => import("./pages/GoogleCallback"));
const StudentGoogleCallback = lazyWithRetry(() => import("./pages/StudentGoogleCallback"));
const AdminGoogleCallback = lazyWithRetry(() => import("./pages/AdminGoogleCallback"));
const StudentLogin = lazyWithRetry(() => import("./pages/StudentLogin"));
const AdminLogin = lazyWithRetry(() => import("./pages/AdminLogin"));
const AdminDashboard = lazyWithRetry(() => import("./pages/AdminDashboard"));
const InternVerification = lazyWithRetry(() => import("./pages/InternVerification"));
const EmployeeVerification = lazyWithRetry(() => import("./pages/EmployeeVerification"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const FAQ = lazyWithRetry(() => import("./pages/FAQ"));
const IITMCalculators = lazyWithRetry(() => import("./pages/IITMCalculators"));
const NewsDetail = lazyWithRetry(() => import("./pages/NewsDetail"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BackendIntegratedWrapper>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <LoginModalProvider>
              <ScrollPersistence />
              <GlobalLoginModal />
              
              <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center font-['Inter',sans-serif]">
                  Loading...
                </div>
              }>
                <Routes>
                  <Route path="/" element={<Index />} />
                  
                  {/* Auth Routes */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/student/login" element={<StudentLogin />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  
                  {/* Focus Area Selection Route */}
                  <Route path="/focus-area" element={<FocusArea />} />
                  
                  {/* Courses */}
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/category/:examCategory" element={<Courses />} />
                  <Route path="/courses/listing/:examCategory" element={<CourseListing />} />
                  <Route path="/courses/:courseId" element={<CourseDetail />} />
                  <Route path="/courses/:courseId/configure" element={<BatchConfiguration />} />
                  
                  {/* Exam Prep */}
                  <Route path="/exam-preparation/jee/*" element={<JEEPrep />} />
                  <Route path="/exam-preparation/neet/*" element={<NEETPrep />} />
                  
                  {/* IITM BS ROUTES */}
                  <Route path="/exam-preparation/iitm-bs/notes/:branch/:level/:subjectSlug" element={<IITMBSSubjectNotesPage />} />
                  <Route path="/exam-preparation/iitm-bs/*" element={<IITMBSPrep />} />
                  <Route path="/news/:newsId" element={<NewsDetail />} />
                  
                  <Route path="/iitm-tools/:tool?/:branch?/:level?" element={<IITMCalculators />} />
                  
                  {/* CAREER ROUTES */}
                  <Route path="/career" element={<Career />} />
                  <Route path="/career/openings" element={<CareerOpportunities />} />
                  <Route path="/career/job/:jobId" element={<JobDetails />} />
                  
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} /> {/* Added Contact Route */}
                  
                  {/* DASHBOARD ROUTE */}
                  <Route path="/dashboard/:tab?" element={<Dashboard />} />
                  
                  {/* Callbacks & Verification */}
                  <Route path="/profile/complete" element={<ProfileComplete />} />
                  <Route path="/auth/callback" element={<GoogleCallback />} />
                  <Route path="/auth/student/callback" element={<StudentGoogleCallback />} />
                  <Route path="/auth/admin/callback" element={<AdminGoogleCallback />} />
                  
                  {/* Admin */}
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  
                  {/* Footer / Legal */}
                  <Route path="/intern-verification" element={<InternVerification />} />
                  <Route path="/employee-verification" element={<EmployeeVerification />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/terms-of-service" element={<TermsOfService />} />
                  <Route path="/faq" element={<FAQ />} />
                  
                  {/* Redirect to Portal */}
                  <Route path="/redirect-to-portal" element={<RedirectToPortal />} />
                  
                  {/* 404 */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </LoginModalProvider>
          </BrowserRouter>
        </TooltipProvider>
      </BackendIntegratedWrapper>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
