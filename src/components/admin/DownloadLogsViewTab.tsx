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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, FileDown } from "lucide-react";

interface DownloadLog {
  id: string;
  created_at: string;
  source: string;
  content_id: string | null;
  title: string | null;
  subject: string | null;
  exam_type: string | null;
  branch: string | null;
  level: string | null;
  class_level: string | null;
  year: number | null;
  week_number: number | null;
  file_link: string | null;
  user_id: string | null;
  email: string | null;
  phone: string | null;
}

const PAGE_SIZE = 50;

const SOURCE_LABEL: Record<string, string> = {
  notes: "Notes",
  pyqs: "PYQ",
  iitm_branch_notes: "IITM Notes",
};

const sourceTone = (s: string) => {
  if (s === "pyqs") return "bg-violet-100 text-violet-800 border-violet-200";
  if (s === "iitm_branch_notes") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
};

const DownloadLogsViewTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<DownloadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    let q = supabase
      .from("note_download_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (sourceFilter !== "all") q = q.eq("source", sourceFilter);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(
        `title.ilike.${s},subject.ilike.${s},email.ilike.${s},phone.ilike.${s},branch.ilike.${s}`
      );
    }
    q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count } = await q;
    if (error) {
      toast({ title: "Couldn't load download logs", description: error.message, variant: "destructive" });
      setRows([]);
      setTotal(0);
    } else {
      setRows((data ?? []) as unknown as DownloadLog[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sourceFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, sourceFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchLogs(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = [
      "created_at", "source", "title", "subject", "exam_type", "branch",
      "level", "class_level", "year", "week_number", "email", "phone", "content_id",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => {
            const v = (r as unknown as Record<string, unknown>)[h];
            if (v == null) return "";
            const s = String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `download-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const uniqueUsers = useMemo(
    () => new Set(rows.map((r) => r.email).filter(Boolean)).size,
    [rows]
  );

  const levelOf = (r: DownloadLog) =>
    [r.level, r.class_level].filter(Boolean).join(" / ") ||
    (r.week_number != null ? `Week ${r.week_number}` : "") ||
    (r.year != null ? String(r.year) : "—");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Download Logs</h2>
          <p className="text-sm text-slate-500 mt-1">
            Every notes / PYQ / IITM-notes download — what was downloaded, the level/branch, and who.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV (this page)
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total downloads" value={total.toLocaleString()} />
        <StatCard label="On this page" value={rows.length} />
        <StatCard label="Unique users (page)" value={uniqueUsers} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search title, subject, branch, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="notes">Notes</SelectItem>
            <SelectItem value="pyqs">PYQs</SelectItem>
            <SelectItem value="iitm_branch_notes">IITM Notes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">When</th>
                <th className="text-left px-4 py-3 font-semibold">Type</th>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold">Subject</th>
                <th className="text-left px-4 py-3 font-semibold">Branch / Level</th>
                <th className="text-left px-4 py-3 font-semibold">User</th>
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
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <FileDown className="w-6 h-6" />
                      <p>No downloads logged yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={sourceTone(r.source)}>
                        {SOURCE_LABEL[r.source] ?? r.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 max-w-[260px]">
                      <p className="text-slate-900 truncate" title={r.title ?? ""}>
                        {r.title ?? "—"}
                      </p>
                      {r.exam_type && (
                        <p className="text-[10px] uppercase tracking-wide text-slate-400">
                          {r.exam_type}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.subject ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="capitalize">{r.branch ?? "—"}</span>
                      <span className="text-slate-400"> · {levelOf(r)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{r.email ?? "Anonymous"}</p>
                      {r.phone && r.phone !== "N/A" && (
                        <p className="text-xs text-slate-500">{r.phone}</p>
                      )}
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
          Showing {rows.length} of {total.toLocaleString()} downloads
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
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Card className="p-4">
    <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </Card>
);

export default DownloadLogsViewTab;
