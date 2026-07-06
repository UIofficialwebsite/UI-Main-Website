import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, ExternalLink } from "lucide-react";

// homepage_popups is newer than the generated Supabase types — cast the client.
const sb = supabase as any;

interface Popup {
  id: string;
  image_url: string | null;
  link_url: string;
  button_text: string;
  is_active: boolean;
  created_at: string;
}

const PopupsManagerTab: React.FC = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ image_url: "", link_url: "", button_text: "Watch Now" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homepage_popups")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Couldn't load popups", description: error.message, variant: "destructive" });
    else setRows((data as Popup[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!form.link_url.trim()) {
      toast({ title: "Link is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await sb.from("homepage_popups").insert({
      image_url: form.image_url.trim() || null,
      link_url: form.link_url.trim(),
      button_text: form.button_text.trim() || "Watch Now",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Failed to add", description: error.message, variant: "destructive" });
      return;
    }
    setForm({ image_url: "", link_url: "", button_text: "Watch Now" });
    toast({ title: "Popup added" });
    load();
  };

  const toggle = async (row: Popup) => {
    const { error } = await supabase
      .from("homepage_popups")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else load();
  };

  const remove = async (id: string) => {
    const { error } = await sb.from("homepage_popups").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Deleted" });
      setRows((r) => r.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="space-y-6 font-['Inter',sans-serif]">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Homepage Popup</h2>
        <p className="text-sm text-slate-500 mt-1">
          Shown once per visitor session on the homepage. Newest first; multiple active popups auto-scroll.
          Leave the poster image empty to embed the link as a YouTube video.
        </p>
      </header>

      {/* Add form */}
      <div className="rounded-xl border border-slate-200 p-5 bg-white space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600">Poster image URL (optional)</label>
            <input
              value={form.image_url}
              onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
              placeholder="https://…/poster.png"
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Link (button target / video) *</label>
            <input
              value={form.link_url}
              onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=…"
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Button text</label>
            <input
              value={form.button_text}
              onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
              placeholder="Watch Now"
              className="mt-1 w-full border border-slate-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
        </div>
        <button
          onClick={add}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-medium px-4 py-2.5 rounded-md hover:bg-[#152a63] disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Add popup
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
      ) : rows.length === 0 ? (
        <p className="text-sm text-slate-500">No popups yet. Add one above.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-3 bg-white">
              <div className="h-16 w-24 shrink-0 rounded-md bg-slate-100 overflow-hidden grid place-items-center">
                {row.image_url ? (
                  <img src={row.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] text-slate-400 px-1 text-center">video embed</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={row.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-800 truncate flex items-center gap-1 hover:underline"
                >
                  <span className="truncate">{row.link_url}</span>
                  <ExternalLink className="w-3 h-3 shrink-0 text-slate-400" />
                </a>
                <p className="text-xs text-slate-500 mt-0.5">Button: “{row.button_text}”</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input type="checkbox" checked={row.is_active} onChange={() => toggle(row)} />
                Active
              </label>
              <button
                onClick={() => remove(row.id)}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                aria-label="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PopupsManagerTab;
