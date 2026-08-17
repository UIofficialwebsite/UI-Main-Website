import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ExamPrepHeader from "@/components/ExamPrepHeader";
import BranchNotesTab from "@/components/iitm/BranchNotesTab";
import { useIITMNotesFilters } from "@/components/iitm/hooks/useIITMNotesFilters";
import PYQsTab from "@/components/iitm/PYQsTab";
import NewsTab from "@/components/iitm/NewsTab";
import ImportantDatesTab from "@/components/iitm/ImportantDatesTab";
import SyllabusTab, { SYLLABUS_DATA, CourseLevel } from "@/components/iitm/SyllabusTab";
import PaidCoursesTab from "@/components/iitm/PaidCoursesTab";
import { buildExamUrl, getTabFromUrl, parseIITMBSUrl, slugify } from "@/utils/urlHelpers";
import { X, Home, ChevronRight, RotateCcw } from "lucide-react";
import { useBackend } from "@/components/BackendIntegratedWrapper";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePageSEO, SEO_TITLES } from "@/utils/seoManager";

// --- NEW IMPORTS FOR TOOLS ---
import MarksPredictor from "@/components/iitm/MarksPredictor";
import GradeCalculator from "@/components/iitm/GradeCalculator";
import CGPACalculator from "@/components/iitm/CGPACalculator";
import { PROGRAMMES, getAvailableCalculatorLevels, normaliseProgramme } from "@/components/iitm/data/curriculumConfig";

/**
 * Custom Filled Arrow Component
 */
const FilledArrow = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    width="8" 
    height="6" 
    viewBox="0 0 8 6" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={`ml-2 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
  >
    <path d="M4 6L0.535898 0L7.4641 0L4 6Z" fill="#374151" />
  </svg>
);

const IITMBSPrep = () => {
  usePageSEO(SEO_TITLES.IITM_PREP, "/exam-preparation/iitm-bs");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { courses, pyqs, loadCourses, loadIitmBranchPyqs, loadImportantDates, loadNewsUpdates, loadCommunities } = useBackend();
  useEffect(() => {
    loadCourses();
    loadIitmBranchPyqs();
    loadImportantDates("IITM_BS");
    loadImportantDates("IITM BS");
    loadNewsUpdates("IITM_BS");
    loadNewsUpdates("IITM BS");
    loadCommunities("IITM_BS");
    loadCommunities("IITM BS");
  }, [loadCourses, loadIitmBranchPyqs, loadImportantDates, loadNewsUpdates, loadCommunities]);
  
  const filterRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [isSticky, setIsSticky] = useState(false);
  const [filterOffset, setFilterOffset] = useState(0);
  
  // Parse initial URL params
  const initialUrlState = parseIITMBSUrl(location.pathname);
  
  // Tab State
  const [activeTab, setActiveTab] = useState(() => initialUrlState.tab);

  // --- ISOLATED STATES PER TAB ---
  
  // PYQ Tab State
  const [pyqBranch, setPyqBranch] = useState(initialUrlState.branch || "Data Science");
  const [pyqLevel, setPyqLevel] = useState(initialUrlState.level || "Foundation");
  const [pyqYears, setPyqYears] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([]);
  const [pyqSubjects, setPyqSubjects] = useState<string[]>([]);

  // Notes Tab State
  const [notesBranch, setNotesBranch] = useState(initialUrlState.branch || "Data Science");
  const [notesLevel, setNotesLevel] = useState(initialUrlState.level || "Foundation");
  const [selectedNotesSubjects, setSelectedNotesSubjects] = useState<string[]>([]);
  const [availableNotesSubjects, setAvailableNotesSubjects] = useState<string[]>([]);
  const [notesSpecialization, setNotesSpecialization] = useState<string | null>(null);

  // Courses Tab State
  const [courseBranch, setCourseBranch] = useState(initialUrlState.branch || "Data Science");
  const [courseLevel, setCourseLevel] = useState("Foundation");
  const [selectedCourseLevels, setSelectedCourseLevels] = useState<string[]>([]);
  const [selectedCourseSubjects, setSelectedCourseSubjects] = useState<string[]>([]);
  const [coursePriceRange, setCoursePriceRange] = useState<string | null>(null);
  const [newlyLaunched, setNewlyLaunched] = useState(false);
  const [fastrackOnly, setFastrackOnly] = useState(false);
  const [bestSellerOnly, setBestSellerOnly] = useState(false);

  // Syllabus Tab State
  const [syllabusLevel, setSyllabusLevel] = useState<CourseLevel>((initialUrlState.level as CourseLevel) || "Qualifier");
  const [syllabusBranch, setSyllabusBranch] = useState<string>(initialUrlState.branch || "Data Science");
  const [syllabusSubjectIds, setSyllabusSubjectIds] = useState<string[]>([]);

  // Tools State
  const [toolsBranch, setToolsBranch] = useState<string>(normaliseProgramme(initialUrlState.branch));
  const [toolsLevel, setToolsLevel] = useState(initialUrlState.level || "Foundation");
  const [selectedTool, setSelectedTool] = useState(initialUrlState.tool || "cgpa-calculator");

  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest'>('recent');

  // --- DROPDOWN POSITIONING LOGIC ---
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left?: number; right?: number; width: number }>({ top: 0, left: 0, width: 0 });

  // --- DYNAMIC DATA DERIVATION ---
  
  // Active Context
  const activeBranch = activeTab === 'pyqs' ? pyqBranch : activeTab === 'notes' ? notesBranch : activeTab === 'courses' ? courseBranch : activeTab === 'syllabus' ? syllabusBranch : PROGRAMMES[normaliseProgramme(toolsBranch)].label;
  const activeLevel = activeTab === 'pyqs' ? pyqLevel : activeTab === 'notes' ? notesLevel : activeTab === 'courses' ? courseLevel : activeTab === 'syllabus' ? syllabusLevel : toolsLevel;

  const branchSlug = useMemo(() => activeBranch.toLowerCase().replace(/\s+/g, '-'), [activeBranch]);
  const levelSlug = useMemo(() => activeLevel.toLowerCase(), [activeLevel]);

  // PYQ Options
  const currentProgramPyqs = useMemo(() => 
    pyqs.filter(p => p.branch === branchSlug && p.level === levelSlug)
  , [pyqs, branchSlug, levelSlug]);

  const dynamicYears = useMemo(() => 
    Array.from(new Set(currentProgramPyqs.map(p => p.year?.toString()).filter(Boolean))).sort((a, b) => Number(b) - Number(a))
  , [currentProgramPyqs]);

  // [UPDATED] Uses 'session' instead of 'exam_type' to get Quiz 1, End Term, etc.
  const dynamicExamTypes = useMemo(() => 
    Array.from(new Set(currentProgramPyqs.map(p => p.session).filter(Boolean))).sort()
  , [currentProgramPyqs]);

  const dynamicPyqSubjects = useMemo(() => 
    Array.from(new Set(currentProgramPyqs.map(p => p.subject).filter(Boolean))).sort()
  , [currentProgramPyqs]);

  // Syllabus Options
  const availableSyllabusCourses = useMemo(() => {
    return SYLLABUS_DATA.filter((course) => {
      if (course.level !== syllabusLevel) return false;
      
      // Branch filtering logic matching SyllabusTab
      if (syllabusBranch === "Electronic Systems") {
          return course.category === "Electronic Systems";
      } else {
          // Data Science Branch includes all other categories
          return course.category !== "Electronic Systems";
      }
    });
  }, [syllabusLevel, syllabusBranch]);

  const syllabusSubjectOptions = useMemo(() => availableSyllabusCourses.map(c => ({ id: c.id, name: c.name })), [availableSyllabusCourses]);

  // Derive Course options - only show live courses
  const iitmCourses = useMemo(() => 
    courses.filter(c => 
      c.is_live === true &&
      (c.exam_category === 'IITM BS' || c.exam_category === 'IITM_BS')
    )
  , [courses]);

  const branches = useMemo(() => Array.from(new Set(iitmCourses.map(c => c.branch))).filter(Boolean).sort() as string[], [iitmCourses]);
  const levels = useMemo(() => Array.from(new Set(iitmCourses.map(c => c.level))).filter(Boolean).sort() as string[], [iitmCourses]);

  // --- Notes & PYQ filters derived from CONTENT (not courses) ---
  // The Notes/PYQ branch+level options must reflect what actually has content,
  // so Diploma/Degree notes show even when no matching course exists.
  const { rows: notesFilterRows } = useIITMNotesFilters();
  const slugToTitle = (slug: string) =>
    slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const LEVEL_ORDER = ["qualifier", "foundation", "diploma", "degree"];
  const sortByLevel = (a: string, b: string) => {
    const ia = LEVEL_ORDER.indexOf(a.toLowerCase());
    const ib = LEVEL_ORDER.indexOf(b.toLowerCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  };

  const notesBranches = useMemo(
    () => Array.from(new Set(notesFilterRows.map(p => p.branch))).map(slugToTitle).sort(),
    [notesFilterRows]
  );
  const notesLevels = useMemo(() => {
    const bSlug = notesBranch.toLowerCase().replace(/\s+/g, "-");
    const lv = notesFilterRows.filter(p => p.branch === bSlug).map(p => p.level);
    return Array.from(new Set(lv)).map(slugToTitle).sort(sortByLevel);
  }, [notesFilterRows, notesBranch]);

  // Specialization is a GENERAL sub-filter: it appears only when the selected
  // branch+level actually has specialization values in its notes (e.g. DS
  // Diploma → Data Science / Programming). Empty for levels without one.
  const notesSpecializations = useMemo(() => {
    const bSlug = notesBranch.toLowerCase().replace(/\s+/g, "-");
    const lSlug = notesLevel.toLowerCase().replace(/\s+/g, "-");
    const specs = notesFilterRows
      .filter(p => p.branch === bSlug && p.level === lSlug && p.specialization)
      .map(p => p.specialization as string);
    return Array.from(new Set(specs)).sort();
  }, [notesFilterRows, notesBranch, notesLevel]);

  const pyqBranches = useMemo(
    () => Array.from(new Set(pyqs.map(p => p.branch).filter(Boolean) as string[]))
      .map(s => slugToTitle(s.toLowerCase())).sort(),
    [pyqs]
  );
  const pyqLevels = useMemo(() => {
    const bSlug = pyqBranch.toLowerCase().replace(/\s+/g, "-");
    const lv = pyqs.filter(p => p.branch === bSlug).map(p => p.level).filter(Boolean) as string[];
    return Array.from(new Set(lv)).map(s => slugToTitle(s)).sort(sortByLevel);
  }, [pyqs, pyqBranch]);

  const availableCourseLevels = useMemo(() => 
    Array.from(new Set(iitmCourses.filter(c => c.branch === courseBranch).map(c => c.level))).filter(Boolean).sort() as string[]
  , [iitmCourses, courseBranch]);
  
  const availableCourseSubjects = useMemo(() => 
    Array.from(new Set(iitmCourses.filter(c => c.branch === courseBranch).map(c => c.subject))).filter(Boolean).sort() as string[]
  , [iitmCourses, courseBranch]);

  // --- TEMP STATES (For "Apply" Logic) ---
  const [tempBranch, setTempBranch] = useState(activeBranch);
  const [tempLevel, setTempLevel] = useState(activeLevel);
  const [tempSpecialization, setTempSpecialization] = useState<string | null>(null);
  // Syllabus Temps
  const [tempSyllabusSubjectIds, setTempSyllabusSubjectIds] = useState<string[]>([]);
  // PYQ Temps
  const [tempPyqYears, setTempPyqYears] = useState<string[]>([]);
  const [tempExamTypes, setTempExamTypes] = useState<string[]>([]);
  const [tempPyqSubjects, setTempPyqSubjects] = useState<string[]>([]);
  // Notes/Course Temps
  const [tempNotesSubjects, setTempNotesSubjects] = useState<string[]>([]);
  const [tempCourseLevels, setTempCourseLevels] = useState<string[]>([]);
  const [tempCourseSubjects, setTempCourseSubjects] = useState<string[]>([]);
  const [tempCoursePrice, setTempCoursePrice] = useState<string | null>(null);

  const handleOpenDropdown = (type: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const spaceOnRight = viewportWidth - rect.left;
    const minDropdownWidth = 220; 
    const alignRight = spaceOnRight < minDropdownWidth;

    if (alignRight) {
        setDropdownPos({ top: rect.bottom + 8, right: viewportWidth - rect.right, width: rect.width });
    } else {
        setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width });
    }

    if (activeTab === 'pyqs') {
        setTempBranch(pyqBranch); setTempLevel(pyqLevel);
        setTempPyqYears(pyqYears); setTempExamTypes(examTypes); setTempPyqSubjects(pyqSubjects);
    } else if (activeTab === 'notes') {
        setTempBranch(notesBranch); setTempLevel(notesLevel);
        setTempNotesSubjects(selectedNotesSubjects);
        setTempSpecialization(notesSpecialization);
    } else if (activeTab === 'syllabus') {
        setTempLevel(syllabusLevel); setTempBranch(syllabusBranch); setTempSyllabusSubjectIds(syllabusSubjectIds);
    } else if (activeTab === 'courses') {
        setTempBranch(courseBranch); 
        setTempCourseLevels(selectedCourseLevels); setTempCourseSubjects(selectedCourseSubjects); setTempCoursePrice(coursePriceRange);
    } else if (activeTab === 'tools') {
        setTempBranch(PROGRAMMES[normaliseProgramme(toolsBranch)].label);
        setTempLevel(toolsLevel);
    }
    
    setOpenDropdown(openDropdown === type ? null : type);
  };

  // --- FIX: Reset filters when Branch OR Level changes ---
  useEffect(() => {
    setPyqYears([]); setExamTypes([]); setPyqSubjects([]);
    setSelectedNotesSubjects([]);
  }, [pyqLevel, notesLevel, pyqBranch, notesBranch]); // Added branches here

  const handleSyllabusLevelChange = (newLevel: CourseLevel) => {
    setSyllabusLevel(newLevel);
    setSyllabusSubjectIds([]); 
  };

  useEffect(() => {
    if (filterRef.current) setFilterOffset(filterRef.current.offsetTop);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
        setOpenDropdown(null);
        const navbarHeight = 64;
        if (filterRef.current && filterOffset > 0) {
            setIsSticky(window.scrollY > (filterOffset - navbarHeight));
        }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [filterOffset]);

  useEffect(() => {
    const urlState = parseIITMBSUrl(location.pathname);
    setActiveTab(urlState.tab);
    
    // Sync state for the current tab from URL
    if (urlState.tab === 'notes') {
      if (urlState.branch) setNotesBranch(urlState.branch);
      if (urlState.level) setNotesLevel(urlState.level);
    } else if (urlState.tab === 'pyqs') {
      if (urlState.branch) setPyqBranch(urlState.branch);
      if (urlState.level) setPyqLevel(urlState.level);
    } else if (urlState.tab === 'syllabus') {
      if (urlState.branch) setSyllabusBranch(urlState.branch);
      if (urlState.level) setSyllabusLevel(urlState.level as CourseLevel);
    } else if (urlState.tab === 'tools') {
      if (urlState.branch) {
        setToolsBranch(normaliseProgramme(urlState.branch));
      }
      if (urlState.level) setToolsLevel(urlState.level);
      if (urlState.tool) setSelectedTool(urlState.tool);
    } else if (urlState.tab === 'courses') {
      if (urlState.branch) setCourseBranch(urlState.branch);
    }
    
    setOpenDropdown(null);
  }, [location.pathname]);

  // Helper to build URL with current tab's filters
  const buildCurrentUrl = (tab: string, params: Record<string, string | undefined>) => {
    return buildExamUrl('iitm-bs', tab, params);
  };

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Get the appropriate branch/level for the new tab
    let params: Record<string, string | undefined> = {};
    
    if (newTab === 'notes') {
      params = { branch: notesBranch, level: notesLevel };
    } else if (newTab === 'pyqs') {
      params = { branch: pyqBranch, level: pyqLevel };
    } else if (newTab === 'syllabus') {
      params = { branch: syllabusBranch, level: syllabusLevel };
    } else if (newTab === 'tools') {
      params = { branch: toolsBranch, level: toolsLevel, tool: selectedTool };
    } else if (newTab === 'courses') {
      params = { branch: courseBranch };
    }
    // news and dates don't have params
    
    navigate(buildCurrentUrl(newTab, params), { replace: true });
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
    navigate(buildCurrentUrl('tools', { branch: toolsBranch, level: toolsLevel, tool }), { replace: true });
  };

  const applyFilters = (type: string) => {
    let newBranch = activeBranch;
    let newLevel = activeLevel;
    let newTool = selectedTool;
    
    if (activeTab === 'pyqs') {
        if (type === 'branch') { setPyqBranch(tempBranch); newBranch = tempBranch; }
        if (type === 'level') { setPyqLevel(tempLevel); newLevel = tempLevel; }
        if (type === 'year') setPyqYears(tempPyqYears);
        if (type === 'examType') setExamTypes(tempExamTypes);
        if (type === 'pyqSubject') setPyqSubjects(tempPyqSubjects);
        navigate(buildCurrentUrl('pyqs', { branch: type === 'branch' ? tempBranch : pyqBranch, level: type === 'level' ? tempLevel : pyqLevel }), { replace: true });
    } else if (activeTab === 'notes') {
        // Branch/level change invalidates the specialization sub-filter.
        if (type === 'branch') { setNotesBranch(tempBranch); setNotesSpecialization(null); newBranch = tempBranch; }
        if (type === 'level') { setNotesLevel(tempLevel); setNotesSpecialization(null); newLevel = tempLevel; }
        if (type === 'notesSubject') setSelectedNotesSubjects(tempNotesSubjects);
        if (type === 'specialization') setNotesSpecialization(tempSpecialization);
        navigate(buildCurrentUrl('notes', { branch: type === 'branch' ? tempBranch : notesBranch, level: type === 'level' ? tempLevel : notesLevel }), { replace: true });
    } else if (activeTab === 'syllabus') {
        if (type === 'level') { handleSyllabusLevelChange(tempLevel as CourseLevel); newLevel = tempLevel; }
        if (type === 'branch') {
            setSyllabusBranch(tempBranch);
            setSyllabusSubjectIds([]); 
            newBranch = tempBranch;
        } 
        if (type === 'subject') setSyllabusSubjectIds(tempSyllabusSubjectIds);
        navigate(buildCurrentUrl('syllabus', { branch: type === 'branch' ? tempBranch : syllabusBranch, level: type === 'level' ? tempLevel : syllabusLevel }), { replace: true });
    } else if (activeTab === 'courses') {
        if (type === 'branch') { setCourseBranch(tempBranch); newBranch = tempBranch; }
        if (type === 'courseLevel') setSelectedCourseLevels(tempCourseLevels);
        if (type === 'courseSubject') setSelectedCourseSubjects(tempCourseSubjects);
        if (type === 'coursePricing') setCoursePriceRange(tempCoursePrice);
        navigate(buildCurrentUrl('courses', { branch: type === 'branch' ? tempBranch : courseBranch }), { replace: true });
    } else if (activeTab === 'tools') {
        if (type === 'branch') { 
          const b = normaliseProgramme(tempBranch);
          const availableLevels = getAvailableCalculatorLevels(b);
          const currentLevel = toolsLevel.toLowerCase();
          const nextLevel = availableLevels.includes(currentLevel as any)
            ? toolsLevel
            : `${availableLevels[0]?.charAt(0).toUpperCase()}${availableLevels[0]?.slice(1)}`;
          setToolsBranch(b); 
          setToolsLevel(nextLevel);
          newBranch = b; 
          newLevel = nextLevel;
        }
        if (type === 'level') { setToolsLevel(tempLevel); newLevel = tempLevel; }
        navigate(buildCurrentUrl('tools', { 
          branch: type === 'branch' ? normaliseProgramme(tempBranch) : toolsBranch,
          level: type === 'branch' ? newLevel : type === 'level' ? tempLevel : toolsLevel,
          tool: selectedTool 
        }), { replace: true });
    }
    setOpenDropdown(null);
  };

  const resetFilters = () => {
    if (activeTab === 'pyqs') {
        setPyqYears([]); setExamTypes([]); setPyqSubjects([]);
    }
    if (activeTab === 'notes') {
        setSelectedNotesSubjects([]);
    }
    if (activeTab === 'syllabus') {
        setSyllabusSubjectIds([]);
    }
    if (activeTab === 'courses') {
        setBestSellerOnly(false);
        setNewlyLaunched(false);
        setFastrackOnly(false);
        setSelectedCourseLevels([]);
        setSelectedCourseSubjects([]);
        setCoursePriceRange(null);
    }
    setOpenDropdown(null);
  };

  const toggleTempItem = (item: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => {
        const current = Array.isArray(prev) ? prev : [];
        return current.includes(item) ? current.filter(i => i !== item) : [...current, item];
    });
  };

  const getBreadcrumbItems = () => {
    const items = [];
    const activeLabel = tabs.find(t => t.id === activeTab)?.label || activeTab;
    items.push(activeLabel);
    
    if (activeTab === 'syllabus') {
        items.push(syllabusBranch);
        items.push(syllabusLevel);
        if (syllabusSubjectIds.length > 0) items.push(`${syllabusSubjectIds.length} Subjects`);
    } else if (activeTab === 'tools') {
        items.push(PROGRAMMES[normaliseProgramme(toolsBranch)].label);
        const toolName = selectedTool.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        items.push(toolName);
    } else if (['dates', 'news'].includes(activeTab)) {
        // No extra breadcrumbs for dates/news
    } else {
        items.push(activeBranch); 
        if (['notes', 'pyqs'].includes(activeTab)) items.push(activeLevel); 
    }
    
    if (activeTab === 'pyqs') {
      if (pyqSubjects.length > 0) items.push(`${pyqSubjects.length} Subjects`);
      if (pyqYears.length > 0) items.push(`${pyqYears.length} Years`);
      if (examTypes.length > 0) items.push(`${examTypes.length} Exams`);
    } else if (activeTab === 'notes') {
      selectedNotesSubjects.forEach(s => items.push(s));
    }
    return items;
  };

  const tabs = [
    { id: "notes", label: "Notes" }, { id: "pyqs", label: "PYQs" },
    { id: "syllabus", label: "Syllabus" }, { id: "tools", label: "Tools" },
    { id: "courses", label: "Related Courses"}, { id: "news", label: "News" },
    { id: "dates", label: "Important Dates" }
  ];

  const renderDropdownContent = () => {
    if (!openDropdown) return null;
    
    const type = openDropdown;
    let items: any[] = [];
    let isCheckbox = true; 
    let currentSelection: any = null;
    let setSelection: any = null;

    if (type === 'branch') { 
        if (activeTab === 'syllabus') {
            items = ['Data Science', 'Electronic Systems'];
            isCheckbox = false; 
            currentSelection = tempBranch; 
            setSelection = setTempBranch;
        } else if (activeTab === 'tools') {
            items = Object.values(PROGRAMMES).map((programme) => programme.label);
            isCheckbox = false;
            currentSelection = tempBranch;
            setSelection = setTempBranch;
        } else {
            // Notes/PYQ branch options come from actual content; courses fall back to course list.
            items = activeTab === 'notes' ? notesBranches : activeTab === 'pyqs' ? pyqBranches : branches;
            isCheckbox = false;
            currentSelection = tempBranch;
            setSelection = setTempBranch;
        }
    }
    else if (type === 'level') {
        if (activeTab === 'syllabus') items = ["Qualifier", "Foundation", "Diploma", "Degree"];
        else if (activeTab === 'tools') {
          items = getAvailableCalculatorLevels(normaliseProgramme(tempBranch))
            .map((level) => level.charAt(0).toUpperCase() + level.slice(1));
        }
        else if (activeTab === 'notes') items = notesLevels;   // levels that actually have notes
        else if (activeTab === 'pyqs') items = pyqLevels;      // levels that actually have PYQs
        else items = levels;
        isCheckbox = false; currentSelection = tempLevel; setSelection = setTempLevel;
    }
    else if (type === 'specialization') {
        items = ['All Specializations', ...notesSpecializations];
        isCheckbox = false;
        currentSelection = tempSpecialization ?? 'All Specializations';
        setSelection = (v: string) => setTempSpecialization(v === 'All Specializations' ? null : v);
    }
    else if (type === 'subject') {
        items = syllabusSubjectOptions;
        isCheckbox = true; 
        currentSelection = tempSyllabusSubjectIds; 
        setSelection = setTempSyllabusSubjectIds;
    }
    else if (type === 'year') { items = dynamicYears; currentSelection = tempPyqYears; setSelection = setTempPyqYears; }
    else if (type === 'examType') { items = dynamicExamTypes; currentSelection = tempExamTypes; setSelection = setTempExamTypes; }
    else if (type === 'pyqSubject') { items = dynamicPyqSubjects; currentSelection = tempPyqSubjects; setSelection = setTempPyqSubjects; }
    else if (type === 'notesSubject') { items = availableNotesSubjects; currentSelection = tempNotesSubjects; setSelection = setTempNotesSubjects; }
    else if (type === 'courseLevel') { items = availableCourseLevels; currentSelection = tempCourseLevels; setSelection = setTempCourseLevels; }
    else if (type === 'courseSubject') { items = availableCourseSubjects; currentSelection = tempCourseSubjects; setSelection = setTempCourseSubjects; }
    else if (type === 'coursePricing') { items = ['free', 'paid']; isCheckbox = false; currentSelection = tempCoursePrice; setSelection = setTempCoursePrice; }

    const selectionArray = Array.isArray(currentSelection) ? currentSelection : [];

    return (
      <div 
        ref={dropdownRef} 
        className="fixed bg-white border border-[#e5e7eb] rounded-xl shadow-xl z-[99999] p-3 flex flex-col animate-in fade-in zoom-in-95 duration-100"
        style={{ 
          top: dropdownPos.top, 
          left: dropdownPos.left ?? 'auto',
          right: dropdownPos.right ?? 'auto',
          minWidth: Math.max(180, dropdownPos.width),
          maxWidth: '95vw' 
        }}
      >
        <div className="max-h-[200px] overflow-y-auto mb-3 space-y-1 custom-scrollbar">
          {items.map(item => {
            const label = typeof item === 'object' ? item.name : item;
            const value = typeof item === 'object' ? item.id : item;
            return (
                <label key={value} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs text-gray-700 font-sans font-medium">
                <input 
                    type={isCheckbox ? "checkbox" : "radio"} 
                    checked={
                    isCheckbox 
                        ? selectionArray.includes(value)
                        : currentSelection === value
                    } 
                    onChange={() => {
                    if (isCheckbox) toggleTempItem(value, currentSelection, setSelection);
                    else setSelection(value);
                    }} 
                    className="accent-[#6366f1]" 
                /> 
                <span className={type === 'examType' ? 'uppercase' : ''}>{label}</span>
                </label>
            );
          })}
          {items.length === 0 && <p className="text-[10px] text-slate-400 italic p-2">No options found</p>}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <button onClick={() => setOpenDropdown(null)} className="flex-1 py-1 text-[11px] text-slate-500 font-bold uppercase">Cancel</button>
          <button onClick={() => applyFilters(type)} className="flex-1 py-1 text-[11px] bg-[#6366f1] text-white rounded font-bold uppercase">Apply</button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (dropdownRef.current && !dropdownRef.current.contains(target) && !target.closest('button')) {
            setOpenDropdown(null);
        }
    };
    if (openDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] font-sans">
      <NavBar />
      <main className="pt-16">
        <ExamPrepHeader examName="IITM BS" examPath="/exam-preparation/iitm-bs" currentTab={activeTab} pageTitle="IITM BS Degree Preparation" />

        {/* Sticky Filter Bar */}
        <div ref={filterRef} className={`w-full transition-shadow duration-300 z-[5000] ${isSticky ? 'fixed top-16 bg-white border-b shadow-none' : 'relative'}`}>
          <div className="bg-[#f4f2ff]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8 pt-4 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`pb-2 text-[14px] md:text-[15px] cursor-pointer whitespace-nowrap transition-all font-sans ${activeTab === tab.id ? 'text-[#6366f1] border-b-[3px] border-[#6366f1] font-semibold' : 'text-[#6b7280] font-medium'}`}>{tab.label}</button>
              ))}
            </div>
          </div>

          <div className="bg-white border-b border-[#f3f4f6] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center">
              {/* SCROLLABLE FILTER ROW */}
              <div className="flex flex-nowrap gap-3 items-center whitespace-nowrap overflow-x-auto no-scrollbar w-full pb-1 pr-4">
                
                {/* 1. Branch & Level (Standard Tabs: Only for Notes and PYQs) */}
                {(activeTab === 'notes' || activeTab === 'pyqs') && (
                    <>
                      <div className="flex-shrink-0">
                          <button onClick={(e) => handleOpenDropdown('branch', e)} className="px-4 py-1.5 border border-[#6366f1] rounded-[30px] text-[12px] flex items-center gap-2 bg-[#eef2ff] font-sans text-[#374151]">
                          <span className="text-[#6b7280]">Branch:</span>
                          <span className="font-semibold text-[#111827]">{activeBranch}</span>
                          <FilledArrow isOpen={openDropdown === 'branch'} />
                          </button>
                      </div>
                      <div className="flex-shrink-0">
                          <button onClick={(e) => handleOpenDropdown('level', e)} className="px-4 py-1.5 border border-[#6366f1] rounded-[30px] text-[12px] flex items-center gap-2 bg-[#eef2ff] font-sans text-[#374151]">
                          <span className="text-[#6b7280]">Level:</span>
                          <span className="font-semibold text-[#111827]">{activeLevel}</span>
                          <FilledArrow isOpen={openDropdown === 'level'} />
                          </button>
                      </div>
                    </>
                )}

                {/* 1.5. Tools Tab Filters */}
                {activeTab === 'tools' && (
                  <>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('branch', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                        Branch <FilledArrow isOpen={openDropdown === 'branch'} />
                        </button>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('level', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                        Level <FilledArrow isOpen={openDropdown === 'level'} />
                        </button>
                    </div>
                    
                    {/* Direct Tool Selection Buttons */}
                     <button 
                      onClick={() => handleToolSelect('cgpa-calculator')} 
                      className={`px-4 py-1.5 border rounded-[30px] text-[12px] transition-all whitespace-nowrap flex items-center gap-2 ${selectedTool === 'cgpa-calculator' ? 'bg-[#6366f1] text-white border-[#6366f1]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}
                    >
                      CGPA Calculator
                    </button>
                    <button 
                      onClick={() => handleToolSelect('grade-calculator')} 
                      className={`px-4 py-1.5 border rounded-[30px] text-[12px] transition-all whitespace-nowrap flex items-center gap-2 ${selectedTool === 'grade-calculator' ? 'bg-[#6366f1] text-white border-[#6366f1]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}
                    >
                      Grade Calculator
                    </button>
                    <button 
                      onClick={() => handleToolSelect('marks-predictor')} 
                      className={`px-4 py-1.5 border rounded-[30px] text-[12px] transition-all whitespace-nowrap flex items-center gap-2 ${selectedTool === 'marks-predictor' ? 'bg-[#6366f1] text-white border-[#6366f1]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}
                    >
                      Marks Predictor
                    </button>
                  </>
                )}

                {/* 1.6. Syllabus Tab Filters */}
                {activeTab === 'syllabus' && (
                    <>
                        <div className="flex-shrink-0">
                            <button onClick={(e) => handleOpenDropdown('branch', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                            Branch <FilledArrow isOpen={openDropdown === 'branch'} />
                            </button>
                        </div>
                        <div className="flex-shrink-0">
                            <button onClick={(e) => handleOpenDropdown('level', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                            Level <FilledArrow isOpen={openDropdown === 'level'} />
                            </button>
                        </div>
                        <div className="flex-shrink-0">
                            <button onClick={(e) => handleOpenDropdown('subject', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                            {syllabusSubjectIds.length > 0 && <span className="w-5 h-5 flex items-center justify-center bg-[#6366f1] text-white text-[10px] rounded-full mr-2">{syllabusSubjectIds.length}</span>}
                            Subjects <FilledArrow isOpen={openDropdown === 'subject'} />
                            </button>
                        </div>
                    </>
                )}

                {/* 2. Tab Specific Filters */}
                {activeTab === 'notes' && (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Specialization sub-filter — only shows when this level has specializations */}
                    {notesSpecializations.length > 0 && (
                      <button onClick={(e) => handleOpenDropdown('specialization', e)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] flex items-center gap-2 font-sans ${notesSpecialization ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e5e7eb] bg-white'} text-[#374151]`}>
                        <span className="text-[#6b7280]">Specialization{notesSpecialization ? ':' : ''}</span>
                        {notesSpecialization && <span className="font-semibold text-[#111827]">{notesSpecialization}</span>}
                        <FilledArrow isOpen={openDropdown === 'specialization'} />
                      </button>
                    )}
                    <button onClick={(e) => handleOpenDropdown('notesSubject', e)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] flex items-center gap-2 font-sans ${selectedNotesSubjects.length > 0 ? 'border-[#6366f1] bg-[#eef2ff]' : 'border-[#e5e7eb] bg-white'} text-[#374151]`}>
                      {selectedNotesSubjects.length > 0 && <span className="w-5 h-5 flex items-center justify-center bg-[#6366f1] text-white text-[10px] rounded-full mr-2">{selectedNotesSubjects.length}</span>}
                      Subjects <FilledArrow isOpen={openDropdown === 'notesSubject'} />
                    </button>
                    {selectedNotesSubjects.map(sub => (
                      <div key={sub} className="px-3 py-1 border border-black rounded-full text-[12px] flex items-center gap-2 bg-white font-medium">
                        {sub} <X className="w-3.5 h-3.5 cursor-pointer" onClick={() => setSelectedNotesSubjects(prev => prev.filter(s => s !== sub))} />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'courses' && (
                  <>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('branch', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                        Branch <FilledArrow isOpen={openDropdown === 'branch'} />
                        </button>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('courseLevel', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                            Level <FilledArrow isOpen={openDropdown === 'courseLevel'} />
                        </button>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('courseSubject', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                            Subject <FilledArrow isOpen={openDropdown === 'courseSubject'} />
                        </button>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('coursePricing', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                            Pricing <FilledArrow isOpen={openDropdown === 'coursePricing'} />
                        </button>
                    </div>
                    <button onClick={() => setBestSellerOnly(!bestSellerOnly)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] transition-all whitespace-nowrap flex items-center gap-2 ${bestSellerOnly ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                      Best Seller
                      {bestSellerOnly && <X className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setNewlyLaunched(!newlyLaunched)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] transition-all whitespace-nowrap flex items-center gap-2 ${newlyLaunched ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                      Newly Launched
                      {newlyLaunched && <X className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setFastrackOnly(!fastrackOnly)} className={`px-4 py-1.5 border rounded-[30px] text-[12px] transition-all whitespace-nowrap flex items-center gap-2 ${fastrackOnly ? 'bg-white border-[#e5e7eb] text-[#374151]' : 'bg-white border-[#e5e7eb] text-[#374151]'}`}>
                      Fastrack Batch
                      {fastrackOnly && <X className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}

                {/* 3. PYQ Dropdowns */}
                {activeTab === 'pyqs' && (
                  <>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('pyqSubject', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                        {pyqSubjects.length > 0 && <span className="w-5 h-5 flex items-center justify-center bg-[#6366f1] text-white text-[10px] rounded-full mr-2">{pyqSubjects.length}</span>}
                        Subjects <FilledArrow isOpen={openDropdown === 'pyqSubject'} />
                        </button>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('year', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                        {pyqYears.length > 0 && <span className="w-5 h-5 flex items-center justify-center bg-[#6366f1] text-white text-[10px] rounded-full mr-2">{pyqYears.length}</span>}
                        Year <FilledArrow isOpen={openDropdown === 'year'} />
                        </button>
                    </div>
                    <div className="flex-shrink-0">
                        <button onClick={(e) => handleOpenDropdown('examType', e)} className="px-4 py-1.5 border border-[#e5e7eb] rounded-[30px] text-[12px] flex items-center gap-2 bg-white font-sans text-[#374151]">
                        {examTypes.length > 0 && <span className="w-5 h-5 flex items-center justify-center bg-[#6366f1] text-white text-[10px] rounded-full mr-2">{examTypes.length}</span>}
                        Exam <FilledArrow isOpen={openDropdown === 'examType'} />
                        </button>
                    </div>
                  </>
                )}

                {/* 4. Reset Link */}
                {((activeTab === 'pyqs' && (pyqYears.length > 0 || examTypes.length > 0 || pyqSubjects.length > 0)) || (activeTab === 'notes' && selectedNotesSubjects.length > 0) || (activeTab === 'syllabus' && syllabusSubjectIds.length > 0) || (activeTab === 'courses' && (selectedCourseLevels.length > 0 || selectedCourseSubjects.length > 0 || coursePriceRange || bestSellerOnly || newlyLaunched || fastrackOnly))) && (
                  <button onClick={resetFilters} className="text-[#6366f1] text-[12px] font-medium hover:underline px-2 transition-all ml-auto flex-shrink-0">
                    Reset Filters
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {isSticky && <div className="h-[120px]" />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-[#fcfcfc]">
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap gap-1">
              {getBreadcrumbItems().map((label, index) => (
                <React.Fragment key={`${label}-${index}`}>
                  <BreadcrumbItem><BreadcrumbPage className="capitalize font-medium text-[#6366f1] font-sans text-[13px]">{label}</BreadcrumbPage></BreadcrumbItem>
                  {index < getBreadcrumbItems().length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <section className="py-8 bg-white min-h-[600px] relative z-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activeTab === "pyqs" && <PYQsTab branch={pyqBranch} level={pyqLevel} years={pyqYears} examTypes={examTypes} subjects={pyqSubjects} />}
            {activeTab === "notes" && <BranchNotesTab branch={notesBranch} level={notesLevel} specialization={notesSpecialization} selectedSubjects={selectedNotesSubjects} onSubjectsLoaded={setAvailableNotesSubjects} />}
            {activeTab === "syllabus" && <SyllabusTab level={syllabusLevel} branch={syllabusBranch} selectedCourseIds={syllabusSubjectIds} />}
            
            {/* UPDATED TOOLS SECTION */}
            {activeTab === "tools" && (
                <div className="animate-in fade-in duration-300">
                    {selectedTool === 'cgpa-calculator' && <CGPACalculator branch={toolsBranch} level={toolsLevel} />}
                    {selectedTool === 'grade-calculator' && <GradeCalculator branch={toolsBranch} level={toolsLevel as any} />}
                    {selectedTool === 'marks-predictor' && <MarksPredictor branch={toolsBranch} level={toolsLevel as any} />}
                </div>
            )}

            {activeTab === "courses" && <PaidCoursesTab 
                branch={courseBranch} 
                levels={selectedCourseLevels} 
                subjects={selectedCourseSubjects} 
                priceRange={coursePriceRange} 
                newlyLaunched={newlyLaunched}
                fasttrackOnly={fastrackOnly}
                bestSellerOnly={bestSellerOnly}
            />}
            {activeTab === "news" && <NewsTab sortOrder={sortOrder} />}
            {activeTab === "dates" && <ImportantDatesTab />}
          </div>
        </section>
      </main>
      <Footer />
      {/* PORTAL-LIKE RENDERING AT ROOT LEVEL - PREVENTS CLIPPING */}
      {renderDropdownContent()}
    </div>
  );
};

export default IITMBSPrep;
