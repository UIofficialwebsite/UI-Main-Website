import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Upload, Tag as TagIcon, Eye, EyeOff } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: "percent" | "flat";
  discount_value: number;
  max_discount: number | null;
  min_order_amount: number;
  valid_from: string | null;
  valid_until: string | null;
  max_total_uses: number | null;
  max_uses_per_user: number;
  current_uses: number;
  applicable_course_ids: string[] | null;
  applicable_user_ids: string[] | null;
  user_segment: string | null;
  min_prev_enrollments: number | null;
  prev_enrolled_within_days: number | null;
  visibility: "public" | "private" | "auto_suggest";
  is_auto_applied: boolean;
  display_label: string | null;
  display_priority: number;
  is_active: boolean;
  is_first_purchase_only: boolean;
  stackable: boolean;
  created_at: string;
}

type FormState = {
  code: string;
  discount_type: "percent" | "flat";
  discount_value: string;
  max_discount: string;
  min_order_amount: string;
  valid_from: string;
  valid_until: string;
  max_total_uses: string;
  max_uses_per_user: string;
  visibility: "public" | "private" | "auto_suggest";
  is_auto_applied: boolean;
  display_label: string;
  display_priority: string;
  is_first_purchase_only: boolean;
  user_segment: "" | "new" | "returning" | "prev_enrolled";
  min_prev_enrollments: string;
  prev_enrolled_within_days: string;
  applicable_course_ids: string;
  applicable_user_ids_csv: string;
};

const emptyForm: FormState = {
  code: "",
  discount_type: "percent",
  discount_value: "",
  max_discount: "",
  min_order_amount: "0",
  valid_from: "",
  valid_until: "",
  max_total_uses: "",
  max_uses_per_user: "1",
  visibility: "private",
  is_auto_applied: false,
  display_label: "",
  display_priority: "0",
  is_first_purchase_only: false,
  user_segment: "",
  min_prev_enrollments: "",
  prev_enrolled_within_days: "",
  applicable_course_ids: "",
  applicable_user_ids_csv: "",
};

// Templates: pre-fill the form for common coupon shapes so an admin doesn't
// need to remember every field. They can tweak and save.
type Template = { key: string; label: string; description: string; apply: (f: FormState) => FormState };
const TEMPLATES: Template[] = [
  {
    key: "blank",
    label: "Start from blank",
    description: "Empty form — fill everything yourself.",
    apply: () => ({ ...emptyForm }),
  },
  {
    key: "public-percent",
    label: "Public % off (everyone sees)",
    description: "WELCOME10 style. 10% off capped at ₹1000, visible to all.",
    apply: (f) => ({
      ...emptyForm,
      ...f,
      code: f.code || "WELCOME10",
      discount_type: "percent",
      discount_value: "10",
      max_discount: "1000",
      visibility: "public",
      display_label: "10% off your order (max ₹1000)",
      display_priority: "100",
    }),
  },
  {
    key: "first-purchase-flat",
    label: "Flat ₹ off — first purchase only",
    description: "SAVE500 style. Flat ₹500 off, only for users with no prior enrollments.",
    apply: (f) => ({
      ...emptyForm,
      ...f,
      code: f.code || "SAVE500",
      discount_type: "flat",
      discount_value: "500",
      min_order_amount: "3000",
      visibility: "public",
      is_first_purchase_only: true,
      display_label: "Flat ₹500 off your first batch",
      display_priority: "80",
    }),
  },
  {
    key: "auto-apply",
    label: "Auto-applied to eligible users",
    description: "Quietly auto-fills on page load for users who qualify.",
    apply: (f) => ({
      ...emptyForm,
      ...f,
      code: f.code || "AUTO20",
      discount_type: "percent",
      discount_value: "20",
      max_discount: "2000",
      visibility: "auto_suggest",
      is_auto_applied: true,
      display_label: "Auto-applied 20% off",
      display_priority: "120",
    }),
  },
  {
    key: "personalised",
    label: "Personalised / private (must be typed)",
    description: "Influencer or 1:1 codes. Never shown in offers list.",
    apply: (f) => ({
      ...emptyForm,
      ...f,
      code: f.code || "INFLUENCER_",
      discount_type: "flat",
      discount_value: "500",
      visibility: "private",
      display_label: "Personal discount",
    }),
  },
  {
    key: "returning",
    label: "Returning students only",
    description: "LOYAL15 style. Visible only to users with ≥1 paid enrollment.",
    apply: (f) => ({
      ...emptyForm,
      ...f,
      code: f.code || "LOYAL15",
      discount_type: "percent",
      discount_value: "15",
      max_discount: "1500",
      visibility: "auto_suggest",
      user_segment: "prev_enrolled",
      min_prev_enrollments: "1",
      display_label: "Thanks for coming back — 15% off",
      display_priority: "90",
    }),
  },
];

// Tiny header used to break the long form into sections so an admin can
// scan it like a checklist rather than a wall of inputs.
const SectionHeader: React.FC<{ title: string; hint: string }> = ({ title, hint }) => (
  <div className="mt-6 mb-2 pb-1.5 border-b border-gray-200">
    <h3 className="text-[13px] font-bold uppercase tracking-wider text-gray-900">{title}</h3>
    <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
  </div>
);

const CouponsManagerTab: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [search, setSearch] = useState("");
  const [filterVis, setFilterVis] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    setCoupons((data as Coupon[]) ?? []);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      max_discount: c.max_discount?.toString() ?? "",
      min_order_amount: c.min_order_amount?.toString() ?? "0",
      valid_from: c.valid_from ? c.valid_from.slice(0, 16) : "",
      valid_until: c.valid_until ? c.valid_until.slice(0, 16) : "",
      max_total_uses: c.max_total_uses?.toString() ?? "",
      max_uses_per_user: c.max_uses_per_user?.toString() ?? "1",
      visibility: c.visibility,
      is_auto_applied: c.is_auto_applied,
      display_label: c.display_label ?? "",
      display_priority: c.display_priority?.toString() ?? "0",
      is_first_purchase_only: c.is_first_purchase_only,
      user_segment: (c.user_segment ?? "") as FormState["user_segment"],
      min_prev_enrollments: c.min_prev_enrollments?.toString() ?? "",
      prev_enrolled_within_days: c.prev_enrolled_within_days?.toString() ?? "",
      applicable_course_ids: (c.applicable_course_ids ?? []).join(", "),
      applicable_user_ids_csv: (c.applicable_user_ids ?? []).join("\n"),
    });
    setOpen(true);
  };

  const parseCsvUuids = (text: string): string[] => {
    return text
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s));
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const ids = parseCsvUuids(text);
      setForm((prev) => ({
        ...prev,
        applicable_user_ids_csv: ids.join("\n"),
      }));
      toast({ title: "CSV loaded", description: `${ids.length} user UUIDs parsed.` });
    };
    reader.readAsText(file);
  };

  const save = async () => {
    if (!form.code.trim() || !form.discount_value.trim()) {
      toast({ title: "Missing fields", description: "Code and discount value are required.", variant: "destructive" });
      return;
    }
    if (form.discount_type === "percent" && !form.max_discount.trim()) {
      toast({
        title: "Missing cap",
        description: "Percent coupons require a max_discount to prevent runaway discounts.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const payload: any = {
      code: form.code.trim(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : 0,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      max_total_uses: form.max_total_uses ? Number(form.max_total_uses) : null,
      max_uses_per_user: form.max_uses_per_user ? Number(form.max_uses_per_user) : 1,
      visibility: form.visibility,
      is_auto_applied: form.is_auto_applied,
      display_label: form.display_label.trim() || null,
      display_priority: Number(form.display_priority) || 0,
      is_first_purchase_only: form.is_first_purchase_only,
      user_segment: form.user_segment || null,
      min_prev_enrollments: form.min_prev_enrollments ? Number(form.min_prev_enrollments) : null,
      prev_enrolled_within_days: form.prev_enrolled_within_days ? Number(form.prev_enrolled_within_days) : null,
      applicable_course_ids: parseCsvUuids(form.applicable_course_ids).length
        ? parseCsvUuids(form.applicable_course_ids)
        : null,
      applicable_user_ids: parseCsvUuids(form.applicable_user_ids_csv).length
        ? parseCsvUuids(form.applicable_user_ids_csv)
        : null,
    };

    const { error } = editing
      ? await supabase.from("coupons").update(payload).eq("id", editing.id)
      : await supabase.from("coupons").insert(payload);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Coupon updated" : "Coupon created" });
    setOpen(false);
    fetchCoupons();
  };

  const toggleActive = async (c: Coupon) => {
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchCoupons();
  };

  const remove = async (c: Coupon) => {
    if (!confirm(`Delete coupon "${c.code}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("coupons").delete().eq("id", c.id);
    if (error) {
      toast({ title: "Cannot delete", description: error.message, variant: "destructive" });
      return;
    }
    fetchCoupons();
  };

  const filtered = coupons.filter((c) => {
    if (filterVis !== "all" && c.visibility !== filterVis) return false;
    if (search && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const visBadge = (v: Coupon["visibility"]) => {
    const map: Record<string, string> = {
      public: "bg-green-100 text-green-800",
      private: "bg-gray-200 text-gray-800",
      auto_suggest: "bg-purple-100 text-purple-800",
    };
    return <Badge className={map[v]}>{v}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TagIcon className="w-5 h-5" /> Coupons
          </CardTitle>
          <CardDescription>
            Create discount codes. Private codes must be typed; public codes show in
            "Available Offers"; auto-suggest codes show only to eligible users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search codes"
                className="pl-9"
              />
            </div>
            <Select value={filterVis} onValueChange={setFilterVis}>
              <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Visibility" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All visibilities</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="auto_suggest">Auto-suggest</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" /> New coupon</Button>
          </div>

          <div className="space-y-2">
            {filtered.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No coupons match.</p>
            ) : (
              filtered.map((c) => (
                <div key={c.id} className="border rounded-md p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-lg">{c.code}</span>
                      {visBadge(c.visibility)}
                      {!c.is_active && <Badge variant="outline" className="text-gray-500">inactive</Badge>}
                      {c.is_auto_applied && <Badge className="bg-yellow-100 text-yellow-800">auto-apply</Badge>}
                      {c.is_first_purchase_only && <Badge variant="outline">first purchase</Badge>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {c.discount_type === "percent"
                        ? <>{c.discount_value}% off{c.max_discount ? ` · max ₹${c.max_discount}` : ""}</>
                        : <>₹{c.discount_value} off</>}
                      {c.min_order_amount > 0 && <> · min ₹{c.min_order_amount}</>}
                      {" · used "}{c.current_uses}{c.max_total_uses ? `/${c.max_total_uses}` : ""}
                    </div>
                    {c.display_label && <div className="text-xs text-gray-500 mt-1">{c.display_label}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(c)}>
                      {c.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => remove(c)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit coupon" : "New coupon"}</DialogTitle>
            <DialogDescription>
              Only <strong>Code</strong> and <strong>Discount value</strong> are required.
              Everything else has a sensible default. Pick a template below to pre-fill
              common shapes — you can tweak any field after.
            </DialogDescription>
          </DialogHeader>

          {/* Template picker (only on Create, not Edit) */}
          {!editing && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-1">
              <Label className="text-xs font-bold uppercase tracking-wider text-blue-900">Use a template</Label>
              <Select onValueChange={(v) => {
                const tpl = TEMPLATES.find(t => t.key === v);
                if (tpl) setForm(prev => tpl.apply(prev));
              }}>
                <SelectTrigger className="mt-1.5 bg-white"><SelectValue placeholder="Choose a template (or skip)" /></SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map(t => (
                    <SelectItem key={t.key} value={t.key}>
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-gray-500">{t.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ----- SECTION 1: Identity ----- */}
          <SectionHeader title="1. Identity" hint="What students type and what shows in the offer list." />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                className="uppercase"
              />
              <p className="text-[11px] text-gray-500 mt-1">Case doesn't matter — `welcome10` and `WELCOME10` both work.</p>
            </div>
            <div>
              <Label>Display label</Label>
              <Input
                value={form.display_label}
                onChange={(e) => setForm({ ...form, display_label: e.target.value })}
                placeholder="10% off for new students"
              />
              <p className="text-[11px] text-gray-500 mt-1">Shown under the code in the offer list. Optional.</p>
            </div>
          </div>

          {/* ----- SECTION 2: Discount ----- */}
          <SectionHeader title="2. Discount" hint="How much to take off and whether it's a % or a flat ₹." />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Discount type</Label>
              <Select value={form.discount_type} onValueChange={(v: any) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent off (%)</SelectItem>
                  <SelectItem value="flat">Flat ₹ off</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount value *</Label>
              <Input
                type="number"
                value={form.discount_value}
                onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                placeholder={form.discount_type === "percent" ? "10  (= 10%)" : "500  (= ₹500)"}
              />
              <p className="text-[11px] text-gray-500 mt-1">
                {form.discount_type === "percent"
                  ? "A number from 1 to 100. Example: 10 means 10% off."
                  : "Rupees to subtract from the order. Example: 500 means ₹500 off."}
              </p>
            </div>
            {form.discount_type === "percent" && (
              <div className="md:col-span-2">
                <Label>Max discount (₹) <span className="text-red-600">*</span></Label>
                <Input
                  type="number"
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                  placeholder="1000"
                />
                <p className="text-[11px] text-gray-500 mt-1">Required for % coupons. Caps the rupee discount — e.g., 20% off ₹50,000 capped at ₹2000.</p>
              </div>
            )}
            <div className="md:col-span-2">
              <Label>Minimum order amount (₹)</Label>
              <Input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
              />
              <p className="text-[11px] text-gray-500 mt-1">Cart must total at least this before coupon applies. Leave 0 for no minimum.</p>
            </div>
          </div>

          {/* ----- SECTION 3: Time window ----- */}
          <SectionHeader title="3. Time window" hint="When the coupon is valid. Leave both blank for always-valid." />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Valid from</Label>
              <Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} />
              <p className="text-[11px] text-gray-500 mt-1">Coupon won't work before this. Blank = no start limit.</p>
            </div>
            <div>
              <Label>Valid until</Label>
              <Input type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              <p className="text-[11px] text-gray-500 mt-1">Coupon won't work after this. Blank = no end limit.</p>
            </div>
          </div>

          {/* ----- SECTION 4: Usage limits ----- */}
          <SectionHeader title="4. Usage limits" hint="How many times this coupon can be redeemed." />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Max total uses</Label>
              <Input type="number" value={form.max_total_uses} onChange={(e) => setForm({ ...form, max_total_uses: e.target.value })} placeholder="(blank = unlimited)" />
              <p className="text-[11px] text-gray-500 mt-1">Global cap across all users. Blank = unlimited.</p>
            </div>
            <div>
              <Label>Max uses per user</Label>
              <Input type="number" value={form.max_uses_per_user} onChange={(e) => setForm({ ...form, max_uses_per_user: e.target.value })} />
              <p className="text-[11px] text-gray-500 mt-1">Usually 1 — one redemption per student. Don't edit `current_uses` — system updates it automatically.</p>
            </div>
          </div>

          {/* ----- SECTION 5: Who can use it ----- */}
          <SectionHeader title="5. Who can use it" hint="Restrict by user segment or specific user list. Leave blank for everyone." />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                checked={form.is_first_purchase_only}
                onCheckedChange={(v) => setForm({ ...form, is_first_purchase_only: Boolean(v) })}
                id="cpn-first-purchase"
              />
              <div>
                <Label htmlFor="cpn-first-purchase">First purchase only</Label>
                <p className="text-[11px] text-gray-500">Only users with zero prior paid enrollments.</p>
              </div>
            </div>
            <div>
              <Label>User segment</Label>
              <Select value={form.user_segment} onValueChange={(v: any) => setForm({ ...form, user_segment: v })}>
                <SelectTrigger><SelectValue placeholder="Anyone (no segment rule)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Anyone (no segment rule)</SelectItem>
                  <SelectItem value="new">New students (no prior enrollments)</SelectItem>
                  <SelectItem value="prev_enrolled">Returning students (already enrolled before)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.user_segment === "prev_enrolled" && (
              <>
                <div>
                  <Label>Need at least N prior enrollments</Label>
                  <Input type="number" value={form.min_prev_enrollments} onChange={(e) => setForm({ ...form, min_prev_enrollments: e.target.value })} placeholder="1" />
                  <p className="text-[11px] text-gray-500 mt-1">Default 1.</p>
                </div>
                <div>
                  <Label>Enrolled within last N days</Label>
                  <Input type="number" value={form.prev_enrolled_within_days} onChange={(e) => setForm({ ...form, prev_enrolled_within_days: e.target.value })} placeholder="(blank = any time)" />
                  <p className="text-[11px] text-gray-500 mt-1">Example: 180 = "within last 6 months". Blank = any time.</p>
                </div>
              </>
            )}
            <div className="md:col-span-2">
              <Label>Applicable courses (specific courses only)</Label>
              <Textarea
                value={form.applicable_course_ids}
                onChange={(e) => setForm({ ...form, applicable_course_ids: e.target.value })}
                rows={2}
                placeholder="(blank = applies to all courses)"
              />
              <p className="text-[11px] text-gray-500 mt-1">Paste course UUIDs separated by commas. Get them from the Courses tab. Blank = all courses.</p>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <Label>Specific user list (cohort)</Label>
                <label className="inline-flex items-center gap-1 text-xs cursor-pointer text-blue-600">
                  <Upload className="w-3 h-3" /> Upload CSV
                  <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
                </label>
              </div>
              <Textarea
                value={form.applicable_user_ids_csv}
                onChange={(e) => setForm({ ...form, applicable_user_ids_csv: e.target.value })}
                rows={4}
                placeholder="(blank = anyone can use it)&#10;One user UUID per line. Or upload a CSV."
              />
              <p className="text-[11px] text-gray-500 mt-1">Used for personalised codes (e.g., AAYUSH500) and influencer/cohort codes. Get UUIDs from Supabase Auth → Users.</p>
            </div>
          </div>

          {/* ----- SECTION 6: Visibility ----- */}
          <SectionHeader title="6. Where it shows up" hint="Controls whether students see the coupon in the offers list." />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Visibility</Label>
              <Select value={form.visibility} onValueChange={(v: any) => setForm({ ...form, visibility: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — shown to everyone (greyed if ineligible)</SelectItem>
                  <SelectItem value="auto_suggest">Auto-suggest — shown only to users who qualify</SelectItem>
                  <SelectItem value="private">Private — never shown; must be typed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-500 mt-1">
                <strong>Public:</strong> WELCOME10 style. Everyone sees it. &nbsp;|&nbsp;
                <strong>Auto-suggest:</strong> shown quietly to the right segment. &nbsp;|&nbsp;
                <strong>Private:</strong> influencer/SMS codes; invisible until typed.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                checked={form.is_auto_applied}
                onCheckedChange={(v) => setForm({ ...form, is_auto_applied: Boolean(v) })}
                id="cpn-auto-apply"
                disabled={form.visibility === "private"}
              />
              <div>
                <Label htmlFor="cpn-auto-apply" className={form.visibility === "private" ? "text-gray-400" : ""}>Auto-apply on page load</Label>
                <p className="text-[11px] text-gray-500">
                  {form.visibility === "private"
                    ? "Doesn't apply to private codes — they must be typed."
                    : "Fills in for eligible users without them doing anything."}
                </p>
              </div>
            </div>
            <div>
              <Label>Display priority</Label>
              <Input type="number" value={form.display_priority} onChange={(e) => setForm({ ...form, display_priority: e.target.value })} />
              <p className="text-[11px] text-gray-500 mt-1">Higher number = shown first in the offer list. Default 0.</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Save changes" : "Create coupon"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponsManagerTab;
