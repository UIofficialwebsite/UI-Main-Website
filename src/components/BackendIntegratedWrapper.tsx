import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Course } from "@/components/admin/courses/types";
import { useDownloadHandler } from "@/hooks/useDownloadHandler";
import { useToast } from "@/components/ui/use-toast";

type Note = Database["public"]["Tables"]["notes"]["Row"];
type Pyq = Database["public"]["Tables"]["pyqs"]["Row"];
type ImportantDate = Database["public"]["Tables"]["important_dates"]["Row"];
type NewsUpdate = Database["public"]["Tables"]["news_updates"]["Row"];
type Community = Database["public"]["Tables"]["communities"]["Row"];
type IITMBranchNote = Database["public"]["Tables"]["iitm_branch_notes"]["Row"];
type IITMBranchPyq = Pyq;
type Job = Database["public"]["Tables"]["jobs"]["Row"];

interface BackendContextType {
  courses: Course[];
  notes: Note[];
  pyqs: Pyq[];
  importantDates: ImportantDate[];
  newsUpdates: NewsUpdate[];
  communities: Community[];
  iitmBranchNotes: IITMBranchNote[];
  iitmBranchPyqs: IITMBranchPyq[];
  recommendedCourses: any[];
  jobs: Job[];
  loading: boolean;
  contentLoading: boolean;
  error: Error | null;
  isAdmin: boolean;
  downloadCounts: Record<string, number>;
  isDownloadCountsInitialized: boolean;
  getFilteredContent: (
    profile: Database["public"]["Tables"]["profiles"]["Row"] | null
  ) => {
    courses: Course[];
    notes: Note[];
    pyqs: Pyq[];
    importantDates: ImportantDate[];
    newsUpdates: NewsUpdate[];
    communities: Community[];
  };
  handleDownload: (
    contentId: string,
    type: "notes" | "pyqs" | "iitm_branch_notes",
    fileUrl?: string | null
  ) => Promise<void>;
  updateDownloadCount: (contentId: string, count: number) => void;
  addNote: (note: any) => Promise<boolean>;
  addPyq: (pyq: any) => Promise<boolean>;
  updateNote: (id: string, note: any) => Promise<boolean>;
  updatePyq: (id: string, pyq: any) => Promise<boolean>;
  deleteNote: (id: string) => Promise<void>;
  deletePyq: (id: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
  refreshPyqs: () => Promise<void>;
  createCourse: (course: any) => Promise<boolean>;
  updateCourse: (id: string, course: any) => Promise<boolean>;
  deleteCourse: (id: string) => Promise<void>;
  // Scoped lazy loaders (call from pages — only fetches once per scope per session)
  loadCourses: () => Promise<void>;
  loadAllCourses: () => Promise<void>;
  loadNotes: (examType?: string) => Promise<void>;
  loadAllNotes: () => Promise<void>;
  loadPyqs: (examType?: string) => Promise<void>;
  loadAllPyqs: () => Promise<void>;
  loadImportantDates: (examType?: string) => Promise<void>;
  loadNewsUpdates: (examType?: string) => Promise<void>;
  loadCommunities: (examType?: string) => Promise<void>;
  loadIitmBranchNotes: () => Promise<void>;
  loadIitmBranchPyqs: () => Promise<void>;
  loadJobs: () => Promise<void>;
  loadDashboardData: (
    profile: Database["public"]["Tables"]["profiles"]["Row"] | null
  ) => Promise<void>;
  loadRecommendedCourses: () => Promise<void>;
}

const BackendContext = createContext<BackendContextType | undefined>(undefined);

const emptyFilteredContent = {
  courses: [] as Course[],
  notes: [] as Note[],
  pyqs: [] as Pyq[],
  importantDates: [] as ImportantDate[],
  newsUpdates: [] as NewsUpdate[],
  communities: [] as Community[],
};

const mergeById = <T extends { id: string | number }>(prev: T[], next: T[]): T[] => {
  if (prev.length === 0) return next;
  const map = new Map<string | number, T>();
  for (const row of prev) map.set(row.id, row);
  for (const row of next) map.set(row.id, row);
  return Array.from(map.values());
};

export const BackendIntegratedWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [pyqs, setPyqs] = useState<Pyq[]>([]);
  const [importantDates, setImportantDates] = useState<ImportantDate[]>([]);
  const [newsUpdates, setNewsUpdates] = useState<NewsUpdate[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [iitmBranchNotes, setIitmBranchNotes] = useState<IITMBranchNote[]>([]);
  const [iitmBranchPyqs, setIitmBranchPyqs] = useState<IITMBranchPyq[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Session-level dedup cache: scope key -> in-flight or completed promise
  const loadCache = useRef<Map<string, Promise<void>>>(new Map());

  const {
    handleDownload,
    downloadCounts,
    updateDownloadCount,
    isInitialized: isDownloadCountsInitialized,
  } = useDownloadHandler();

  // Admin check is cheap (one rpc) — keep automatic
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (user?.email) {
        const { data } = await supabase.rpc("is_current_user_admin");
        setIsAdmin(data || false);
      } else {
        setIsAdmin(false);
      }
    };
    checkAdminStatus();
  }, [user]);

  // Generic dedup wrapper: runs `fn` once per `key` per session
  const runOnce = useCallback((key: string, fn: () => Promise<void>): Promise<void> => {
    const existing = loadCache.current.get(key);
    if (existing) return existing;
    const promise = fn().catch((err) => {
      // On failure, drop the cache entry so future calls can retry
      loadCache.current.delete(key);
      throw err;
    });
    loadCache.current.set(key, promise);
    return promise;
  }, []);

  const loadCourses = useCallback(
    () =>
      runOnce("courses:public", async () => {
        const { data, error: e } = await supabase
          .from("courses")
          .select("*")
          .eq("is_live", true);
        if (e) {
          console.error("loadCourses error:", e);
          return;
        }
        if (data) setCourses((prev) => mergeById(prev, data as unknown as Course[]));
      }),
    [runOnce]
  );

  const loadAllCourses = useCallback(
    () =>
      runOnce("courses:all", async () => {
        const { data, error: e } = await supabase.from("courses").select("*");
        if (e) {
          console.error("loadAllCourses error:", e);
          return;
        }
        if (data) setCourses(data as unknown as Course[]);
      }),
    [runOnce]
  );

  const loadNotes = useCallback(
    (examType?: string) => {
      const key = examType ? `notes:${examType}` : "notes:public";
      return runOnce(key, async () => {
        let q = supabase.from("notes").select("*").eq("is_active", true);
        if (examType) q = q.eq("exam_type", examType);
        const { data, error: e } = await q;
        if (e) {
          console.error("loadNotes error:", e);
          return;
        }
        if (data) setNotes((prev) => mergeById(prev, data));
      });
    },
    [runOnce]
  );

  const loadAllNotes = useCallback(
    () =>
      runOnce("notes:all", async () => {
        const { data, error: e } = await supabase.from("notes").select("*");
        if (e) {
          console.error("loadAllNotes error:", e);
          return;
        }
        if (data) setNotes(data);
      }),
    [runOnce]
  );

  const loadPyqs = useCallback(
    (examType?: string) => {
      const key = examType ? `pyqs:${examType}` : "pyqs:public";
      return runOnce(key, async () => {
        let q = supabase.from("pyqs").select("*").eq("is_active", true);
        if (examType) q = q.eq("exam_type", examType);
        const { data, error: e } = await q;
        if (e) {
          console.error("loadPyqs error:", e);
          return;
        }
        if (data) setPyqs((prev) => mergeById(prev, data));
      });
    },
    [runOnce]
  );

  const loadAllPyqs = useCallback(
    () =>
      runOnce("pyqs:all", async () => {
        const { data, error: e } = await supabase.from("pyqs").select("*");
        if (e) {
          console.error("loadAllPyqs error:", e);
          return;
        }
        if (data) setPyqs(data);
      }),
    [runOnce]
  );

  const loadImportantDates = useCallback(
    (examType?: string) => {
      const key = examType ? `important_dates:${examType}` : "important_dates:public";
      return runOnce(key, async () => {
        let q = supabase.from("important_dates").select("*");
        if (examType) q = q.eq("exam_type", examType);
        const { data, error: e } = await q;
        if (e) {
          console.error("loadImportantDates error:", e);
          return;
        }
        if (data) setImportantDates((prev) => mergeById(prev, data));
      });
    },
    [runOnce]
  );

  const loadNewsUpdates = useCallback(
    (examType?: string) => {
      const key = examType ? `news_updates:${examType}` : "news_updates:public";
      return runOnce(key, async () => {
        let q = supabase.from("news_updates").select("*");
        if (examType) q = q.eq("exam_type", examType);
        const { data, error: e } = await q;
        if (e) {
          console.error("loadNewsUpdates error:", e);
          return;
        }
        if (data) setNewsUpdates((prev) => mergeById(prev, data));
      });
    },
    [runOnce]
  );

  const loadCommunities = useCallback(
    (examType?: string) => {
      const key = examType ? `communities:${examType}` : "communities:public";
      return runOnce(key, async () => {
        let q = supabase.from("communities").select("*");
        if (examType) q = q.eq("exam_type", examType);
        const { data, error: e } = await q;
        if (e) {
          console.error("loadCommunities error:", e);
          return;
        }
        if (data) setCommunities((prev) => mergeById(prev, data));
      });
    },
    [runOnce]
  );

  const loadIitmBranchNotes = useCallback(
    () =>
      runOnce("iitm_branch_notes:public", async () => {
        const { data, error: e } = await supabase
          .from("iitm_branch_notes")
          .select("*")
          .eq("is_active", true);
        if (e) {
          console.error("loadIitmBranchNotes error:", e);
          return;
        }
        if (data) setIitmBranchNotes(data);
      }),
    [runOnce]
  );

  const loadIitmBranchPyqs = useCallback(
    () =>
      runOnce("iitm_branch_pyqs", async () => {
        const { data, error: e } = await supabase
          .from("pyqs")
          .select("*")
          .eq("is_active", true)
          .or("exam_type.eq.IITM_BS,exam_type.eq.IITM BS");
        if (e) {
          console.error("loadIitmBranchPyqs error:", e);
          return;
        }
        if (data) {
          setIitmBranchPyqs(data);
          setPyqs((prev) => mergeById(prev, data));
        }
      }),
    [runOnce]
  );

  const loadJobs = useCallback(
    () =>
      runOnce("jobs:public", async () => {
        const { data, error: e } = await supabase
          .from("jobs")
          .select("*")
          .eq("is_active", true);
        if (e) {
          console.error("loadJobs error:", e);
          return;
        }
        if (data) setJobs(data);
      }),
    [runOnce]
  );

  const loadRecommendedCourses = useCallback(
    () =>
      runOnce(`recommended_courses:${user?.id ?? "anon"}`, async () => {
        if (!user) return;
        const { data, error: e } = await supabase
          .from("user_recommendations")
          .select(
            `score, courses ( id, title, description, price, discounted_price,
             duration, rating, features, bestseller, image_url,
             created_at, updated_at, subject, start_date, course_type,
             branch, level, enroll_now_link, students_enrolled,
             end_date, language, is_live, expiry_date, tags, exam_category )`
          )
          .order("score", { ascending: false })
          .limit(3);

        if (e) {
          console.error("loadRecommendedCourses error:", e);
          return;
        }
        if (data) {
          const formatted = data
            .filter((rec: any) => rec.courses && rec.courses.is_live === true)
            .map((rec: any) => rec.courses);
          setRecommendedCourses(formatted);
        }
      }),
    [runOnce, user]
  );

  // Dashboard helper — loads everything the StudyPortal needs for the user's profile,
  // scoped to the profile so we don't fetch every exam_type.
  const loadDashboardData = useCallback(
    async (profile: Database["public"]["Tables"]["profiles"]["Row"] | null) => {
      if (!profile) return;
      setLoading(true);
      try {
        const exam = profile.exam_type || undefined;
        const isIITM = profile.program_type === "IITM_BS";
        const examTypesForIITM = ["IITM_BS", "IITM BS"];

        const tasks: Promise<void>[] = [loadCourses()];
        if (isIITM) {
          examTypesForIITM.forEach((et) => {
            tasks.push(loadNotes(et));
            tasks.push(loadPyqs(et));
            tasks.push(loadImportantDates(et));
            tasks.push(loadNewsUpdates(et));
            tasks.push(loadCommunities(et));
          });
        } else if (exam) {
          tasks.push(loadNotes(exam));
          tasks.push(loadPyqs(exam));
          tasks.push(loadImportantDates(exam));
          tasks.push(loadNewsUpdates(exam));
          tasks.push(loadCommunities(exam));
        }
        await Promise.allSettled(tasks);
        await loadRecommendedCourses();
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [
      loadCourses,
      loadNotes,
      loadPyqs,
      loadImportantDates,
      loadNewsUpdates,
      loadCommunities,
      loadRecommendedCourses,
    ]
  );

  // refreshNotes/refreshPyqs: used by admin after add/update/delete. Invalidate cache
  // for the broad keys and re-fetch in full.
  const refreshNotes = useCallback(async () => {
    setContentLoading(true);
    try {
      // Drop all notes:* cache entries so any page calling loadNotes(scope) re-fetches
      for (const k of Array.from(loadCache.current.keys())) {
        if (k.startsWith("notes:")) loadCache.current.delete(k);
      }
      const { data, error: e } = await supabase.from("notes").select("*");
      if (e) throw e;
      if (data) setNotes(data);
    } catch (err) {
      console.error("Error refreshing notes:", err);
    } finally {
      setContentLoading(false);
    }
  }, []);

  const refreshPyqs = useCallback(async () => {
    setContentLoading(true);
    try {
      for (const k of Array.from(loadCache.current.keys())) {
        if (k.startsWith("pyqs:") || k === "iitm_branch_pyqs") loadCache.current.delete(k);
      }
      const { data, error: e } = await supabase.from("pyqs").select("*");
      if (e) throw e;
      if (data) setPyqs(data);
    } catch (err) {
      console.error("Error refreshing pyqs:", err);
    } finally {
      setContentLoading(false);
    }
  }, []);

  const getFilteredContent = useCallback(
    (profile: Database["public"]["Tables"]["profiles"]["Row"] | null) => {
      if (!profile) return emptyFilteredContent;

      const programType = profile.program_type;
      const examType = profile.exam_type;
      const studentStatus = profile.student_status;
      const branch = profile.branch;
      const level = profile.level;

      const filteredCourses = courses.filter((course) => {
        if (course.is_live !== true) return false;
        if (programType === "IITM_BS") {
          return (
            course.exam_category === "IITM BS" &&
            course.branch === branch &&
            course.level === level
          );
        }
        if (programType === "COMPETITIVE_EXAM") {
          return course.exam_category === examType;
        }
        return true;
      });

      const filteredNotes = notes.filter((note) => {
        if (programType === "IITM_BS") {
          return note.exam_type === "IITM_BS" || note.exam_type === "IITM BS";
        }
        if (programType === "COMPETITIVE_EXAM") {
          return (
            note.exam_type === examType &&
            (!note.class_level || note.class_level === studentStatus)
          );
        }
        return false;
      });

      const filteredPyqs = pyqs.filter((pyq) => {
        if (programType === "IITM_BS") {
          return (
            (pyq.exam_type === "IITM_BS" || pyq.exam_type === "IITM BS") &&
            pyq.branch === branch &&
            pyq.level === level
          );
        }
        if (programType === "COMPETITIVE_EXAM") {
          return (
            pyq.exam_type === examType &&
            (!pyq.class_level || pyq.class_level === studentStatus)
          );
        }
        return false;
      });

      const filteredDates = importantDates.filter((date) => {
        if (programType === "IITM_BS") {
          return (
            (date.exam_type === "IITM_BS" || date.exam_type === "IITM BS") &&
            date.branch === branch &&
            date.level === level
          );
        }
        if (programType === "COMPETITIVE_EXAM") {
          return date.exam_type === examType;
        }
        return false;
      });

      const filteredNews = newsUpdates.filter((news) => {
        if (programType === "IITM_BS") {
          return (
            (news.exam_type === "IITM_BS" || news.exam_type === "IITM BS") &&
            news.branch === branch &&
            news.level === level
          );
        }
        if (programType === "COMPETITIVE_EXAM") {
          return news.exam_type === examType;
        }
        return false;
      });

      const filteredCommunities = communities.filter((comm) => {
        if (programType === "IITM_BS") {
          return (
            (comm.exam_type === "IITM_BS" || comm.exam_type === "IITM BS") &&
            comm.branch === branch &&
            comm.level === level
          );
        }
        if (programType === "COMPETITIVE_EXAM") {
          return (
            comm.exam_type === examType &&
            (!comm.class_level || comm.class_level === studentStatus)
          );
        }
        return false;
      });

      return {
        courses: filteredCourses as Course[],
        notes: filteredNotes,
        pyqs: filteredPyqs,
        importantDates: filteredDates,
        newsUpdates: filteredNews,
        communities: filteredCommunities,
      };
    },
    [courses, notes, pyqs, importantDates, newsUpdates, communities]
  );

  const addNote = useCallback(
    async (note: any): Promise<boolean> => {
      try {
        const { error: e } = await supabase.from("notes").insert([note]);
        if (e) throw e;
        toast({ title: "Note added successfully" });
        await refreshNotes();
        return true;
      } catch (err) {
        console.error("Error adding note:", err);
        toast({ title: "Error adding note", variant: "destructive" });
        return false;
      }
    },
    [toast, refreshNotes]
  );

  const addPyq = useCallback(
    async (pyq: any): Promise<boolean> => {
      try {
        const { error: e } = await supabase.from("pyqs").insert([pyq]);
        if (e) throw e;
        toast({ title: "PYQ added successfully" });
        await refreshPyqs();
        return true;
      } catch (err) {
        console.error("Error adding PYQ:", err);
        toast({ title: "Error adding PYQ", variant: "destructive" });
        return false;
      }
    },
    [toast, refreshPyqs]
  );

  const updateNote = useCallback(
    async (id: string, note: any): Promise<boolean> => {
      try {
        const { error: e } = await supabase.from("notes").update(note).eq("id", id);
        if (e) throw e;
        toast({ title: "Note updated successfully" });
        await refreshNotes();
        return true;
      } catch (err) {
        console.error("Error updating note:", err);
        toast({ title: "Error updating note", variant: "destructive" });
        return false;
      }
    },
    [toast, refreshNotes]
  );

  const updatePyq = useCallback(
    async (id: string, pyq: any): Promise<boolean> => {
      try {
        const { error: e } = await supabase.from("pyqs").update(pyq).eq("id", id);
        if (e) throw e;
        toast({ title: "PYQ updated successfully" });
        await refreshPyqs();
        return true;
      } catch (err) {
        console.error("Error updating PYQ:", err);
        toast({ title: "Error updating PYQ", variant: "destructive" });
        return false;
      }
    },
    [toast, refreshPyqs]
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      try {
        const { error: e } = await supabase.from("notes").delete().eq("id", id);
        if (e) throw e;
        toast({ title: "Note deleted successfully" });
        await refreshNotes();
      } catch (err) {
        console.error("Error deleting note:", err);
        toast({ title: "Error deleting note", variant: "destructive" });
      }
    },
    [toast, refreshNotes]
  );

  const deletePyq = useCallback(
    async (id: string): Promise<void> => {
      try {
        const { error: e } = await supabase.from("pyqs").delete().eq("id", id);
        if (e) throw e;
        toast({ title: "PYQ deleted successfully" });
        await refreshPyqs();
      } catch (err) {
        console.error("Error deleting PYQ:", err);
        toast({ title: "Error deleting PYQ", variant: "destructive" });
      }
    },
    [toast, refreshPyqs]
  );

  const refreshCoursesFull = useCallback(async () => {
    for (const k of Array.from(loadCache.current.keys())) {
      if (k.startsWith("courses:")) loadCache.current.delete(k);
    }
    const { data } = await supabase.from("courses").select("*");
    if (data) setCourses(data as unknown as Course[]);
  }, []);

  const createCourse = useCallback(
    async (course: any): Promise<boolean> => {
      try {
        const { error: e } = await supabase.from("courses").insert([course]);
        if (e) throw e;
        toast({ title: "Course created successfully" });
        await refreshCoursesFull();
        return true;
      } catch (err) {
        console.error("Error creating course:", err);
        toast({ title: "Error creating course", variant: "destructive" });
        return false;
      }
    },
    [toast, refreshCoursesFull]
  );

  const updateCourse = useCallback(
    async (id: string, course: any): Promise<boolean> => {
      try {
        const { error: e } = await supabase.from("courses").update(course).eq("id", id);
        if (e) throw e;
        toast({ title: "Course updated successfully" });
        await refreshCoursesFull();
        return true;
      } catch (err) {
        console.error("Error updating course:", err);
        toast({ title: "Error updating course", variant: "destructive" });
        return false;
      }
    },
    [toast, refreshCoursesFull]
  );

  const deleteCourse = useCallback(
    async (id: string): Promise<void> => {
      try {
        const { error: e } = await supabase.from("courses").delete().eq("id", id);
        if (e) throw e;
        toast({ title: "Course deleted successfully" });
        await refreshCoursesFull();
      } catch (err) {
        console.error("Error deleting course:", err);
        toast({ title: "Error deleting course", variant: "destructive" });
      }
    },
    [toast, refreshCoursesFull]
  );

  const value: BackendContextType = {
    courses: courses as Course[],
    notes,
    pyqs,
    importantDates,
    newsUpdates,
    communities,
    iitmBranchNotes,
    iitmBranchPyqs,
    recommendedCourses,
    jobs,
    loading,
    contentLoading,
    error,
    isAdmin,
    downloadCounts,
    isDownloadCountsInitialized,
    getFilteredContent,
    handleDownload,
    updateDownloadCount,
    addNote,
    addPyq,
    updateNote,
    updatePyq,
    deleteNote,
    deletePyq,
    refreshNotes,
    refreshPyqs,
    createCourse,
    updateCourse,
    deleteCourse,
    loadCourses,
    loadAllCourses,
    loadNotes,
    loadAllNotes,
    loadPyqs,
    loadAllPyqs,
    loadImportantDates,
    loadNewsUpdates,
    loadCommunities,
    loadIitmBranchNotes,
    loadIitmBranchPyqs,
    loadJobs,
    loadDashboardData,
    loadRecommendedCourses,
  };

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
};

export const useBackend = () => {
  const context = useContext(BackendContext);
  if (context === undefined) {
    throw new Error("useBackend must be used within a BackendIntegratedWrapper");
  }
  return context;
};
