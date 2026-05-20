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
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface Payment {
  id: string;
  amount: number | null;
  net_amount: number | null;
  batch: string | null;
  coupon_code: string | null;
  courses: string | null;
  created_at: string;
  customer_email: string | null;
  customer_phone: string | null;
  discount_applied: boolean | null;
  discount_type: string | null;
  discount_value: number | null;
  order_id: string;
  payment_group: string | null;
  payment_id: string | null;
  payment_mode: string | null;
  payment_time: string | null;
  status: string | null;
  user_id: string | null;
  utr: string | null;
  raw_response: unknown;
}

const PAGE_SIZE = 50;

const statusTone = (status: string | null) => {
  const s = (status ?? "").toLowerCase();
  if (["success", "paid", "ok"].includes(s))
    return {
      badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };
  if (["failed", "cancelled", "user_dropped"].includes(s))
    return {
      badge: "bg-red-100 text-red-800 border-red-200",
      icon: <XCircle className="w-3.5 h-3.5" />,
    };
  return {
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  };
};

const PaymentsViewTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [modeFilter, setModeFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [modes, setModes] = useState<string[]>([]);

  const fetchModes = async () => {
    const { data } = await supabase
      .from("payments")
      .select("payment_mode")
      .not("payment_mode", "is", null)
      .limit(500);
    if (data) {
      const set = new Set<string>();
      (data as { payment_mode: string | null }[]).forEach((r) => {
        const v = r.payment_mode?.trim();
        if (v) set.add(v);
      });
      setModes(Array.from(set).sort());
    }
  };

  const fetchPayments = async () => {
    setLoading(true);
    let q = supabase
      .from("payments")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      if (statusFilter === "success")
        q = q.in("status", ["success", "paid", "SUCCESS", "PAID", "OK", "ok"]);
      else if (statusFilter === "failed")
        q = q.in("status", [
          "failed",
          "cancelled",
          "user_dropped",
          "FAILED",
          "CANCELLED",
          "USER_DROPPED",
        ]);
      else q = q.eq("status", statusFilter);
    }
    if (modeFilter !== "all") q = q.eq("payment_mode", modeFilter);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(
        `order_id.ilike.${s},payment_id.ilike.${s},utr.ilike.${s},customer_email.ilike.${s},customer_phone.ilike.${s},coupon_code.ilike.${s}`
      );
    }
    q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count } = await q;
    if (error) {
      toast({
        title: "Couldn't load payments",
        description: error.message,
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
    } else {
      setRows((data ?? []) as unknown as Payment[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchModes();
  }, []);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, modeFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, modeFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchPayments(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = [
      "id",
      "order_id",
      "payment_id",
      "utr",
      "created_at",
      "status",
      "payment_mode",
      "amount",
      "net_amount",
      "customer_email",
      "customer_phone",
      "coupon_code",
      "discount_value",
      "courses",
      "batch",
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
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const stats = useMemo(() => {
    const successCount = rows.filter((r) =>
      ["success", "paid", "ok"].includes((r.status ?? "").toLowerCase())
    ).length;
    const revenue = rows
      .filter((r) =>
        ["success", "paid", "ok"].includes((r.status ?? "").toLowerCase())
      )
      .reduce((acc, r) => acc + (r.amount ?? 0), 0);
    return { successCount, revenue };
  }, [rows]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Payments</h2>
          <p className="text-sm text-slate-500 mt-1">
            All payment events received from Cashfree — read-only from{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded text-[12px]">payments</code>.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV (this page)
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total payments" value={total.toLocaleString()} />
        <StatCard label="On this page" value={rows.length} />
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
            placeholder="Search order, payment ID, UTR, email or phone…"
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
            <SelectItem value="success">Success / Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed / Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Payment mode" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">All modes</SelectItem>
            {modes
              .filter((m) => !!m && m.trim() !== "")
              .map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
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
                <th className="text-left px-4 py-3 font-semibold">Order</th>
                <th className="text-left px-4 py-3 font-semibold">Customer</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Mode</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
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
                      <CreditCard className="w-6 h-6" />
                      <p>No payments match the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((p) => {
                  const tone = statusTone(p.status);
                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelected(p)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(p.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-slate-700">
                          {p.order_id}
                        </p>
                        {p.utr && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            UTR {p.utr}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900">
                          {p.customer_email ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {p.customer_phone ?? ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`inline-flex items-center gap-1 ${tone.badge}`}
                        >
                          {tone.icon}
                          {p.status ?? "—"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {p.payment_mode ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {p.amount != null
                          ? `₹${p.amount.toLocaleString()}`
                          : "—"}
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
          Showing {rows.length} of {total.toLocaleString()} payments
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
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">Payment</SheetTitle>
                <SheetDescription className="font-mono text-xs">
                  {selected.order_id}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <DetailRow
                  label="Created"
                  value={new Date(selected.created_at).toLocaleString("en-GB")}
                />
                <DetailRow
                  label="Payment time"
                  value={
                    selected.payment_time
                      ? new Date(selected.payment_time).toLocaleString("en-GB")
                      : null
                  }
                />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow label="Mode" value={selected.payment_mode} />
                <DetailRow label="Group" value={selected.payment_group} />
                <DetailRow label="Payment ID" value={selected.payment_id} />
                <DetailRow label="UTR" value={selected.utr} />
                <DetailRow
                  label="Amount"
                  value={selected.amount != null ? `₹${selected.amount}` : null}
                />
                <DetailRow
                  label="Net amount"
                  value={
                    selected.net_amount != null
                      ? `₹${selected.net_amount}`
                      : null
                  }
                />
                <DetailRow label="Coupon" value={selected.coupon_code} />
                <DetailRow
                  label="Discount"
                  value={
                    selected.discount_value != null
                      ? `${selected.discount_type ?? ""} ${selected.discount_value}`.trim()
                      : null
                  }
                />
                <DetailRow label="Customer email" value={selected.customer_email} />
                <DetailRow label="Customer phone" value={selected.customer_phone} />
                <DetailRow label="Courses" value={selected.courses} />
                <DetailRow label="Batch" value={selected.batch} />
                {selected.raw_response != null && (
                  <details className="border rounded-md">
                    <summary className="px-3 py-2 text-sm font-medium cursor-pointer">
                      Raw webhook payload
                    </summary>
                    <pre className="text-[10px] p-3 bg-slate-50 overflow-x-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(selected.raw_response, null, 2)}
                    </pre>
                  </details>
                )}
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

export default PaymentsViewTab;
