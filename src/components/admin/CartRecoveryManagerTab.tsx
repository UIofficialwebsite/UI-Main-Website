import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Ticket, Power } from "lucide-react";

const CartRecoveryManagerTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [minCoupon, setMinCoupon] = useState("349");
  const [couponCode, setCouponCode] = useState("COMEBACK10");

  const [totalSent, setTotalSent] = useState<number | null>(null);
  const [withCoupon, setWithCoupon] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: cfg }, sent, coup] = await Promise.all([
      supabase
        .from("cart_recovery_config")
        .select("enabled, min_coupon_amount, coupon_code")
        .eq("id", 1)
        .maybeSingle(),
      supabase.from("abandoned_cart_recovery").select("id", { count: "exact", head: true }),
      supabase
        .from("abandoned_cart_recovery")
        .select("id", { count: "exact", head: true })
        .not("coupon_code", "is", null),
    ]);
    if (cfg) {
      setEnabled(cfg.enabled);
      setMinCoupon(String(cfg.min_coupon_amount));
      setCouponCode(cfg.coupon_code);
    }
    setTotalSent(sent.count ?? 0);
    setWithCoupon(coup.count ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const min = Number(minCoupon);
    if (Number.isNaN(min) || min < 0) {
      toast({ title: "Invalid amount", description: "Enter a valid minimum amount.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("cart_recovery_config")
      .update({ enabled, min_coupon_amount: min, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Saved",
      description: enabled
        ? `Recovery is ON. Carts ≥ ₹${min} get the coupon; below that, a plain reminder.`
        : "Recovery is OFF. No emails will be sent.",
    });
  };

  if (loading) {
    return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Cart Recovery</h2>
        <p className="text-sm text-slate-500 mt-1">
          Automatically email students who started an enrolment but didn't finish.
          Runs hourly, sends one reminder per person per course.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={<Mail className="w-5 h-5 text-royal" />} label="Reminders sent" value={totalSent} />
        <StatCard icon={<Ticket className="w-5 h-5 text-royal" />} label="With a coupon" value={withCoupon} />
      </div>

      <Card className="p-6 max-w-2xl space-y-6">
        {/* On / off */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Power className="w-4 h-4 text-slate-500" />
              <span className="font-semibold text-slate-900">Automated recovery</span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              When on, abandoned carts are emailed automatically every hour.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              enabled ? "bg-royal" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="border-t border-slate-100" />

        {/* Threshold */}
        <div>
          <Label htmlFor="min-coupon">Minimum order value for a coupon (₹)</Label>
          <Input
            id="min-coupon"
            type="number"
            min={0}
            value={minCoupon}
            onChange={(e) => setMinCoupon(e.target.value)}
            className="mt-1 max-w-[200px]"
          />
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Carts worth <strong>₹{minCoupon || 0} or more</strong> get the{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded">{couponCode}</code> coupon
            in their reminder. Cheaper carts get a plain "you didn't finish"
            reminder with <strong>no discount</strong>. Set to 0 to always include
            the coupon.
          </p>
        </div>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving} className="bg-royal hover:bg-royal-dark">
            {saving ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number | null }> = ({
  icon,
  label,
  value,
}) => (
  <Card className="p-5 flex items-center gap-4">
    <div className="rounded-lg bg-royal/10 p-2.5">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-900">{value === null ? "—" : value.toLocaleString()}</p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </Card>
);

export default CartRecoveryManagerTab;
