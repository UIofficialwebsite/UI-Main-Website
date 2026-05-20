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
  Download,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface CourseLite {
  id: string;
  title: string;
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  amount: number | null;
  coupon_code: string | null;
  discount_amount: number | null;
  status: string | null;
  subject_name: string | null;
  order_id: string | null;
  payment_id: string | null;
  created_at: string | null;
  courses?: { title: string } | null;
  profiles?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const PAGE_SIZE = 50;

const statusTone = (status: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (["success", "paid", "active"].includes(s))
    return {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };
  if (["failed", "cancelled"].includes(s))
    return {
      badge: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3.5 h-3.5" />,
    };
  return {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  };
};

const EnrollmentsViewTab = () => {
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Enrollment | null>(null);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .order("title", { ascending: true });
    setCourses((data ?? []) as CourseLite[]);
  };

  const fetchEnrollments = async () => {
    setLoading(true);
    let q = supabase
      .from("enrollments")
      .select(
        "*, courses:course_id(title), profiles:user_id(full_name, email, phone)",
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      if (statusFilter === "success")
        q = q.in("status", ["success", "paid", "active", "SUCCESS", "PAID", "ACTIVE"]);
      else if (statusFilter === "failed")
        q = q.in("status", ["failed", "cancelled", "FAILED", "CANCELLED"]);
      else q = q.eq("status", statusFilter);
    }
    if (courseFilter !== "all") q = q.eq("course_id", courseFilter);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`order_id.ilike.${s},payment_id.ilike.${s},coupon_code.ilike.${s}`);
    }
    q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count } = await q;
    if (error) {
      toast({
        title: "Couldn't load enrollments",
        description: error.message,
        variant: "destructive",
      });
      setEnrollments([]);
      setTotal(0);
    } else {
      setEnrollments((data ?? []) as unknown as Enrollment[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchEnrollments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, courseFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, courseFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchEnrollments(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const exportCsv = () => {
    if (enrollments.length === 0) return;
    const headers = [
      "id",
      "created_at",
      "status",
      "course",
      "user_name",
      "user_email",
      "user_phone",
      "amount",
      "discount",
      "coupon",
      "order_id",
      "payment_id",
      "subject",
    ];
    const rows = enrollments.map((e) =>
      [
        e.id,
        e.created_at ?? "",
        e.status ?? "",
        e.courses?.title ?? e.course_id,
        e.profiles?.full_name ?? "",
        e.profiles?.email ?? "",
        e.profiles?.phone ?? "",
        e.amount ?? "",
        e.discount_amount ?? "",
        e.coupon_code ?? "",
        e.order_id ?? "",
        e.payment_id ?? "",
        e.subject_name ?? "",
      ]
        .map((v) => {
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
    a.download = `enrollments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const successCount = enrollments.filter((e) =>
      ["success", "paid", "active"].includes((e.status ?? "").toLowerCase())
    ).length;
    const revenue = enrollments
      .filter((e) =>
        ["success", "paid", "active"].includes((e.status ?? "").toLowerCase())
      )
      .reduce((acc, e) => acc + (e.amount ?? 0), 0);
    return { successCount, revenue };
  }, [enrollments]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Enrollments
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            All course enrollments — read-only view from{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded text-[12px]">enrollments</code>.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={enrollments.length === 0}
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV (this page)
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total enrollments" value={total.toLocaleString()} />
        <StatCard label="On this page" value={enrollments.length} />
        <StatCard label="Successful (this page)" value={stats.successCount} />
        <StatCard
          label="Revenue (this page)"
          value={`₹${stats.revenue.toLocaleString()}`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search order, payment ID or coupon code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success / Paid / Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed / Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Course</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
                <th className="text-left px-4 py-3 font-semibold">Coupon</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-3 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <ClipboardList className="w-6 h-6" />
                      <p>No enrollments match the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                enrollments.map((e) => {
                  const tone = statusTone(e.status);
                  return (
                    <tr
                      key={e.id}
                      onClick={() => setSelected(e)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {e.created_at
                          ? new Date(e.created_at).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">
                          {e.profiles?.full_name ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {e.profiles?.email ?? ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">
                          {e.courses?.title ?? "—"}
                        </p>
                        {e.subject_name && (
                          <p className="text-xs text-slate-500">
                            + {e.subject_name}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1 ${tone.badge}`}
                        >
                          {tone.icon}
                          {e.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {e.amount != null ? `₹${e.amount.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {e.coupon_code ? (
                          <Badge variant="secondary" className="font-mono text-xs">
                            {e.coupon_code}
                          </Badge>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Showing {enrollments.length} of {total.toLocaleString()} enrollments
          {totalPages > 1 ? ` · page ${page + 1} of ${totalPages}` : ""}
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
                <SheetTitle className="text-xl">Enrollment</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selected.id}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <DetailRow
                  label="When"
                  value={
                    selected.created_at
                      ? new Date(selected.created_at).toLocaleString("en-GB")
                      : null
                  }
                />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow
                  label="User"
                  value={
                    selected.profiles
                      ? `${selected.profiles.full_name ?? "—"} (${
                          selected.profiles.email ?? "no email"
                        })`
                      : selected.user_id
                  }
                />
                <DetailRow
                  label="Course"
                  value={selected.courses?.title ?? selected.course_id}
                />
                <DetailRow label="Subject add-on" value={selected.subject_name} />
                <DetailRow
                  label="Amount"
                  value={selected.amount != null ? `₹${selected.amount}` : null}
                />
                <DetailRow
                  label="Discount applied"
                  value={
                    selected.discount_amount != null
                      ? `₹${selected.discount_amount}`
                      : null
                  }
                />
                <DetailRow label="Coupon" value={selected.coupon_code} />
                <DetailRow label="Order ID" value={selected.order_id} />
                <DetailRow label="Payment ID" value={selected.payment_id} />
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

const DetailRow: React.FC<{ label: string; value: string | null | undefined }> = ({
  label,
  value,
}) =>
  value ? (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="col-span-2 text-slate-900 font-mono text-xs break-all">
        {value}
      </span>
    </div>
  ) : null;

export default EnrollmentsViewTab;
