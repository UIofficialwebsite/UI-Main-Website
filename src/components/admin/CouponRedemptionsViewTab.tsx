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
import { Search, Download, Tag } from "lucide-react";

interface Redemption {
  id: string;
  coupon_id: string;
  user_id: string;
  enrollment_id: string | null;
  order_id: string | null;
  discount_amount: number;
  final_amount: number;
  redeemed_at: string;
  coupons?: { code: string; display_label: string | null } | null;
  profiles?: { full_name: string | null; email: string | null } | null;
}

interface CouponLite {
  id: string;
  code: string;
}

const PAGE_SIZE = 50;

const CouponRedemptionsViewTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Redemption[]>([]);
  const [coupons, setCoupons] = useState<CouponLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [couponFilter, setCouponFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchCoupons = async () => {
    const { data } = await supabase
      .from("coupons")
      .select("id, code")
      .order("code", { ascending: true });
    setCoupons((data ?? []) as CouponLite[]);
  };

  const fetchRedemptions = async () => {
    setLoading(true);
    let q = supabase
      .from("coupon_redemptions")
      .select(
        "*, coupons:coupon_id(code, display_label), profiles:user_id(full_name, email)",
        { count: "exact" }
      )
      .order("redeemed_at", { ascending: false });

    if (couponFilter !== "all") q = q.eq("coupon_id", couponFilter);
    if (search.trim()) {
      const s = `%${search.trim()}%`;
      q = q.or(`order_id.ilike.${s}`);
    }
    q = q.range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    const { data, error, count } = await q;
    if (error) {
      toast({
        title: "Couldn't load redemptions",
        description: error.message,
        variant: "destructive",
      });
      setRows([]);
      setTotal(0);
    } else {
      setRows((data ?? []) as unknown as Redemption[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    fetchRedemptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, couponFilter]);

  useEffect(() => {
    setPage(0);
  }, [search, couponFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchRedemptions(), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const exportCsv = () => {
    if (rows.length === 0) return;
    const headers = [
      "id",
      "redeemed_at",
      "coupon_code",
      "user_name",
      "user_email",
      "order_id",
      "discount_amount",
      "final_amount",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.redeemed_at,
          r.coupons?.code ?? "",
          r.profiles?.full_name ?? "",
          r.profiles?.email ?? "",
          r.order_id ?? "",
          r.discount_amount,
          r.final_amount,
        ]
          .map((v) => {
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
    a.download = `coupon-redemptions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const totalDiscount = useMemo(
    () => rows.reduce((acc, r) => acc + r.discount_amount, 0),
    [rows]
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Coupon Redemptions
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Every successful coupon use — read-only from{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded text-[12px]">coupon_redemptions</code>.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Export CSV (this page)
        </Button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total redemptions" value={total.toLocaleString()} />
        <StatCard label="On this page" value={rows.length} />
        <StatCard
          label="Discount given (this page)"
          value={`₹${totalDiscount.toLocaleString()}`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={couponFilter} onValueChange={setCouponFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Coupon" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            <SelectItem value="all">All coupons</SelectItem>
            {coupons.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.code}
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
                <th className="text-left px-4 py-3 font-semibold">Coupon</th>
                <th className="text-left px-4 py-3 font-semibold">User</th>
                <th className="text-left px-4 py-3 font-semibold">Order</th>
                <th className="text-right px-4 py-3 font-semibold">Discount</th>
                <th className="text-right px-4 py-3 font-semibold">Final</th>
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
                      <Tag className="w-6 h-6" />
                      <p>No redemptions match the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(r.redeemed_at).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {r.coupons?.code ?? r.coupon_id.slice(0, 8)}
                      </Badge>
                      {r.coupons?.display_label && (
                        <p className="text-xs text-slate-500 mt-1">
                          {r.coupons.display_label}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">
                        {r.profiles?.full_name ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {r.profiles?.email ?? ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {r.order_id ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-700 font-medium">
                      −₹{r.discount_amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-900">
                      ₹{r.final_amount.toLocaleString()}
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
          Showing {rows.length} of {total.toLocaleString()} redemptions
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

export default CouponRedemptionsViewTab;
