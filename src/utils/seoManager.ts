import { useEffect } from 'react';

const SITE_NAME = 'Unknown IITians';
const BASE_URL = 'https://www.unknowniitians.com';

/**
 * Custom hook to set the document title dynamically
 * Automatically appends the site name suffix
 */
export const useDocumentTitle = (title: string, appendSiteName: boolean = true) => {
  useEffect(() => {
    const previousTitle = document.title;
    
    if (appendSiteName && title) {
      document.title = `${title} | ${SITE_NAME}`;
    } else if (title) {
      document.title = title;
    }
    
    return () => {
      document.title = previousTitle;
    };
  }, [title, appendSiteName]);
};

/**
 * Custom hook to set canonical URL dynamically
 * Cleans the URL by removing trailing slashes and query parameters
 */
export const useCanonicalUrl = (customPath?: string) => {
  useEffect(() => {
    // Use custom path or current pathname
    let pathname = customPath || window.location.pathname;
    
    // Clean the pathname:
    // 1. Remove trailing slash (except for root)
    // 2. Convert to lowercase
    pathname = pathname.replace(/\/$/, '') || '/';
    pathname = pathname.toLowerCase();
    
    const canonicalUrl = `${BASE_URL}${pathname}`;
    
    // Check if canonical link already exists
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    
    link.href = canonicalUrl;
  }, [customPath]);
};

/**
 * Combined hook for setting page SEO (title + canonical)
 */
export const usePageSEO = (title: string, canonicalPath?: string) => {
  useDocumentTitle(title);
  useCanonicalUrl(canonicalPath);
};

/**
 * Set page title imperatively (for use outside React components)
 */
export const setPageTitle = (title: string, appendSiteName: boolean = true) => {
  if (appendSiteName && title) {
    document.title = `${title} | ${SITE_NAME}`;
  } else if (title) {
    document.title = title;
  }
};

/**
 * SEO title templates for consistent naming
 */
export const SEO_TITLES = {
  // Homepage
  HOME: 'Unknown IITians: IITM BS Courses, Notes, PYQs & Free Tools',
  
  // Static pages
  ABOUT: 'About Us - Our Story & Mission',
  FAQ: 'Frequently Asked Questions',
  PRIVACY_POLICY: 'Privacy Policy',
  TERMS_OF_SERVICE: 'Terms of Service',
  NOT_FOUND: 'Page Not Found',
  
  // Auth pages
  AUTH: 'Login or Register',
  STUDENT_LOGIN: 'Student Login',
  ADMIN_LOGIN: 'Admin Login',
  PROFILE_COMPLETE: 'Complete Your Profile',
  
  // Dashboard
  DASHBOARD: 'Student Dashboard',
  ADMIN_DASHBOARD: 'Admin Dashboard',
  
  // Courses
  ALL_COURSES: 'All Courses - JEE, NEET & IITM BS Batches',
  JEE_COURSES: 'JEE Courses & Batches 2026',
  NEET_COURSES: 'NEET Courses & Batches 2026',
  IITM_COURSES: 'IITM BS Courses & Batches 2026',
  
  // Exam Prep
  JEE_PREP: 'JEE Preparation 2026 - Notes, PYQs & Study Materials',
  NEET_PREP: 'NEET Preparation 2026 - Notes, PYQs & Study Materials',
  IITM_PREP: 'IITM BS Degree Preparation: Notes, PYQs, Tools & Courses',
  
  // Career
  CAREER: 'Careers - Join Our Team',
  CAREER_OPENINGS: 'Job Openings - Careers',
  
  // Verification
  INTERN_VERIFICATION: 'Intern Verification Portal',
  EMPLOYEE_VERIFICATION: 'Employee Verification Portal',
  
  // IITM Tools
  IITM_CGPA_CALCULATOR: 'IITM BS CGPA Calculator',
  IITM_GRADE_CALCULATOR: 'IITM BS Grade Calculator',
  IITM_MARKS_PREDICTOR: 'IITM BS Marks Predictor',
} as const;

/**
 * Dashboard view titles
 */
export const DASHBOARD_VIEW_TITLES: Record<string, string> = {
  studyPortal: 'Study Portal - Dashboard',
  profile: 'My Profile - Dashboard',
  enrollments: 'My Enrollments - Dashboard',
  regularBatches: 'Regular Batches - Dashboard',
  fastTrackBatches: 'Fast Track Batches - Dashboard',
  library: 'Digital Library - Dashboard',
  explore: 'Explore Courses - Dashboard',
  receipt: 'Enrollment Receipt - Dashboard',
  contact: 'Contact Us - Dashboard',
  help: 'Help Centre - Dashboard',
  courseDetail: 'Course Details - Dashboard',
};

/**
 * Generate dynamic course title
 */
export const getCourseTitleSEO = (courseTitle: string) => {
  return `${courseTitle} - Course Details`;
};

/**
 * Generate dynamic job title
 */
export const getJobTitleSEO = (jobTitle: string) => {
  return `${jobTitle} - Career Opportunity`;
};

/**
 * Generate dynamic news title
 */
export const getNewsTitleSEO = (newsTitle: string) => {
  return `${newsTitle} - Latest Updates`;
};

/**
 * Generate IITM subject notes title
 */
export const getIITMNotesTitleSEO = (subject: string, level: string) => {
  return `${subject} Notes - IITM BS ${level}`;
};

/**
 * Generate course listing title by category
 */
export const getCourseListingTitleSEO = (category: string) => {
  const categoryTitles: Record<string, string> = {
    'jee': 'All JEE Batches',
    'neet': 'All NEET Batches',
    'iitm-bs': 'All IITM BS Batches',
  };
  return categoryTitles[category.toLowerCase()] || `All ${category} Batches`;
};
