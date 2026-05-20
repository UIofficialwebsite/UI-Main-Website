import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  Search,
  ExternalLink,
} from "lucide-react";

interface Banner {
  id: string;
  image_url: string;
  page_path: string;
  created_at: string;
}

const COMMON_PATHS = [
  "/",
  "/courses",
  "/exam-preparation/iitm-bs",
  "/exam-preparation/jee",
  "/exam-preparation/neet",
];

const PageBannersManagerTab = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pathFilter, setPathFilter] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState({ image_url: "", page_path: "/" });
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("page_banners")
      .select("*")
      .order("page_path", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) {
      toast({
        title: "Couldn't load banners",
        description: error.message,
        variant: "destructive",
      });
      setBanners([]);
    } else {
      setBanners((data ?? []) as Banner[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ image_url: "", page_path: "/" });
    setDialogOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({ image_url: b.image_url, page_path: b.page_path });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image_url.trim() || !form.page_path.trim()) {
      toast({
        title: "Missing fields",
        description: "Image URL and page path are both required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload = {
      image_url: form.image_url.trim(),
      page_path: form.page_path.trim(),
    };
    const { error } = editing
      ? await supabase.from("page_banners").update(payload).eq("id", editing.id)
      : await supabase.from("page_banners").insert([payload]);
    setSaving(false);
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: editing ? "Banner updated" : "Banner added",
      description: `Saved to ${payload.page_path}`,
    });
    setDialogOpen(false);
    fetchBanners();
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm(`Delete this banner on ${b.page_path}?`)) return;
    const { error } = await supabase.from("page_banners").delete().eq("id", b.id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Banner deleted" });
    fetchBanners();
  };

  const knownPaths = useMemo(
    () =>
      Array.from(
        new Set([
          ...COMMON_PATHS,
          ...banners.map((b) => b.page_path).filter((p) => !!p && p.trim() !== ""),
        ])
      ).sort(),
    [banners]
  );

  const filtered = banners.filter((b) => {
    const matchesPath = pathFilter === "all" || b.page_path === pathFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.page_path.toLowerCase().includes(q) ||
      b.image_url.toLowerCase().includes(q);
    return matchesPath && matchesSearch;
  });

  const grouped = useMemo(() => {
    const groups: Record<string, Banner[]> = {};
    filtered.forEach((b) => {
      (groups[b.page_path] ??= []).push(b);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Page Banners
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Images shown in the hero carousel on each page. Keyed by{" "}
            <code className="px-1 py-0.5 bg-slate-100 rounded text-[12px]">page_path</code>.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-royal hover:bg-royal-dark">
          <Plus className="w-4 h-4 mr-2" /> Add Banner
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by path or image URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={pathFilter} onValueChange={setPathFilter}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="All pages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All pages</SelectItem>
            {knownPaths.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-56 rounded-xl bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="space-y-6">
          {grouped.map(([path, items]) => (
            <section key={path} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-700 tracking-wide">
                  {path}
                </h3>
                <Badge variant="secondary" className="rounded-full">
                  {items.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((b) => (
                  <BannerCard
                    key={b.id}
                    banner={b}
                    onEdit={() => openEdit(b)}
                    onDelete={() => handleDelete(b)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit banner" : "Add banner"}</DialogTitle>
            <DialogDescription>
              The banner shows in the HeroCarousel on the page matching{" "}
              <code className="text-[12px]">page_path</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="page_path">Page path *</Label>
              <Input
                id="page_path"
                value={form.page_path}
                onChange={(e) => setForm({ ...form, page_path: e.target.value })}
                placeholder="/courses"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Common: {COMMON_PATHS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="underline mr-2 hover:text-royal"
                    onClick={() => setForm({ ...form, page_path: p })}
                  >
                    {p}
                  </button>
                ))}
              </p>
            </div>
            <div>
              <Label htmlFor="image_url">Image URL *</Label>
              <Input
                id="image_url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="https://…"
                required
              />
              {form.image_url && (
                <div className="mt-3 aspect-[5/2] rounded-md overflow-hidden bg-slate-100 border">
                  <img
                    src={form.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.opacity = "0.3")
                    }
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-royal hover:bg-royal-dark">
                {saving ? "Saving…" : editing ? "Save changes" : "Create banner"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const BannerCard: React.FC<{
  banner: Banner;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ banner, onEdit, onDelete }) => (
  <Card className="overflow-hidden group hover:shadow-md transition-shadow">
    <div className="relative aspect-[5/2] bg-slate-100 border-b">
      <img
        src={banner.image_url}
        alt={`Banner for ${banner.page_path}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => ((e.target as HTMLImageElement).style.opacity = "0.3")}
      />
      <a
        href={banner.image_url}
        target="_blank"
        rel="noreferrer"
        className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-md p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
        title="Open image"
      >
        <ExternalLink className="w-3.5 h-3.5 text-slate-700" />
      </a>
    </div>
    <div className="p-3 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-slate-400">
          Added {new Date(banner.created_at).toLocaleDateString("en-GB")}
        </p>
        <p className="text-xs text-slate-500 truncate" title={banner.image_url}>
          {banner.image_url}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
          <Edit className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  </Card>
);

const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
    <div className="rounded-full bg-slate-100 p-3 mb-3">
      <ImageIcon className="w-6 h-6 text-slate-500" />
    </div>
    <p className="text-lg font-medium text-slate-900">No banners yet</p>
    <p className="text-sm text-slate-500 mt-1 mb-4">
      Add a banner to start showing imagery in the HeroCarousel.
    </p>
    <Button onClick={onAdd} className="bg-royal hover:bg-royal-dark">
      <Plus className="w-4 h-4 mr-2" /> Add first banner
    </Button>
  </Card>
);

export default PageBannersManagerTab;
