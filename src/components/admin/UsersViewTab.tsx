import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Users as UsersIcon,
  Mail,
  Phone,
  CheckCircle2,
  CircleDot,
  Download,
} from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  student_name: string | null;
  phone: string | null;
  dial_code: string | null;
  exam: string | null;
  exam_type: string | null;
  branch: string | null;
  level: string | null;
  class: string | null;
  program_type: string | null;
  role: string | null;
  student_status: string | null;
  gender: string | null;
  profile_completed: boolean | null;
  selected_subjects: string[] | null;
  subjects: string[] | null;
  interests: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

const PAGE_SIZE = 50;

const UsersViewTab = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState<string>("all");
  const [completedFilter, setCompletedFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Profile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    let q = supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (examFilter !== "all") q = q.eq("exam_type", examFilter);
    if (completedFilter === "complete") q = q.eq("profile_completed", true);
    if (completedFilter === "incomplete")
      q = q.or("profile_completed.is.null,profile_completed.eq.false");
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(
        `full_name.ilike.${s},student_name.ilike.${s},email.ilike.${s},phone.ilike.${s}`
      );
    }
    q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count } = await q;
    if (error) {
      toast({
        title: "Couldn't load users",
        description: error.message,
        variant: "destructive",
      });
      setUsers([]);
      setTotal(0);
    } else {
      setUsers((data ?? []) as Profile[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, examFilter, completedFilter]);

  // Reset to first page when search/filter changes
  useEffect(() => {
    setPage(0);
  }, [search, examFilter, completedFilter]);

  // Debounced search trigger
  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const exportCsv = () => {
    if (users.length === 0) return;
    const headers = [
      "id",
      "full_name",
      "email",
      "phone",
      "dial_code",
      "exam_type",
      "branch",
      "level",
      "class",
      "profile_completed",
      "created_at",
    ];
    const rows = users.map((u) =>
      headers
        .map((h) => {
          const v = (u as unknown as Record<string, unknown>)[h];
          if (v == null) return "";
          const s = String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const completed = users.filter((u) => u.profile_completed).length;
    return { onPage: users.length, completed };
  }, [users]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Readers
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            General site users — everyone who has signed up. Staff are in the Employees tab. Profiles from{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded text-[12px]">profiles</code>.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={users.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV (this page)
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total users" value={total.toLocaleString()} />
        <StatCard label="On this page" value={stats.onPage} />
        <StatCard label="Profile complete" value={stats.completed} />
        <StatCard label="Page" value={`${page + 1} / ${totalPages}`} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={examFilter} onValueChange={setExamFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Exam type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All exam types</SelectItem>
            <SelectItem value="JEE">JEE</SelectItem>
            <SelectItem value="NEET">NEET</SelectItem>
            <SelectItem value="IITM_BS">IITM BS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={completedFilter} onValueChange={setCompletedFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Profile state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any profile state</SelectItem>
            <SelectItem value="complete">Complete</SelectItem>
            <SelectItem value="incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Contact</th>
                <th className="text-left px-4 py-3 font-semibold">Exam / Track</th>
                <th className="text-left px-4 py-3 font-semibold">Profile</th>
                <th className="text-left px-4 py-3 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <UsersIcon className="w-6 h-6" />
                      <p>No users match the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelected(u)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {u.full_name || u.student_name || "—"}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">
                        {u.id.slice(0, 8)}…
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {u.email && (
                        <p className="text-slate-700 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {u.email}
                        </p>
                      )}
                      {u.phone && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {u.dial_code} {u.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.exam_type && (
                          <Badge variant="outline" className="text-xs">
                            {u.exam_type}
                          </Badge>
                        )}
                        {u.branch && (
                          <Badge variant="secondary" className="text-xs">
                            {u.branch}
                          </Badge>
                        )}
                        {u.level && (
                          <Badge variant="secondary" className="text-xs">
                            {u.level}
                          </Badge>
                        )}
                        {u.class && (
                          <Badge variant="secondary" className="text-xs">
                            Class {u.class}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.profile_completed ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
                          <CircleDot className="w-3.5 h-3.5" /> Incomplete
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {users.length} of {total.toLocaleString()} users
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">
                  {selected.full_name || selected.student_name || "Unnamed user"}
                </SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selected.id}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <DetailRow label="Email" value={selected.email} />
                <DetailRow
                  label="Phone"
                  value={
                    selected.phone
                      ? `${selected.dial_code ?? ""} ${selected.phone}`.trim()
                      : null
                  }
                />
                <DetailRow label="Role" value={selected.role} />
                <DetailRow label="Gender" value={selected.gender} />
                <DetailRow label="Student status" value={selected.student_status} />
                <DetailRow label="Program type" value={selected.program_type} />
                <DetailRow label="Exam" value={selected.exam} />
                <DetailRow label="Exam type" value={selected.exam_type} />
                <DetailRow label="Branch" value={selected.branch} />
                <DetailRow label="Level" value={selected.level} />
                <DetailRow label="Class" value={selected.class} />
                <DetailRow
                  label="Subjects"
                  value={selected.subjects?.join(", ") || null}
                />
                <DetailRow
                  label="Selected subjects"
                  value={selected.selected_subjects?.join(", ") || null}
                />
                <DetailRow
                  label="Interests"
                  value={selected.interests?.join(", ") || null}
                />
                <DetailRow
                  label="Profile completed"
                  value={selected.profile_completed ? "Yes" : "No"}
                />
                <DetailRow
                  label="Created"
                  value={
                    selected.created_at
                      ? new Date(selected.created_at).toLocaleString("en-GB")
                      : null
                  }
                />
                <DetailRow
                  label="Last updated"
                  value={
                    selected.updated_at
                      ? new Date(selected.updated_at).toLocaleString("en-GB")
                      : null
                  }
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
      {label}
    </p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </Card>
);

const DetailRow: React.FC<{ label: string; value: string | null }> = ({
  label,
  value,
}) =>
  value ? (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="col-span-2 text-slate-900 break-words">{value}</span>
    </div>
  ) : null;

export default UsersViewTab;
