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
  CalendarRange,
  ExternalLink,
  Search,
} from "lucide-react";

interface CourseLite {
  id: string;
  title: string;
}
interface ScheduleItem {
  id: string;
  course_id: string;
  batch_name: string;
  subject_name: string;
  file_link: string;
}

const BatchScheduleManagerTab = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState({
    batch_name: "",
    subject_name: "",
    file_link: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .order("title", { ascending: true });
    setCourses((data ?? []) as CourseLite[]);
  };

  const fetchItems = async (courseId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("batch_schedule")
      .select("*")
      .eq("course_id", courseId)
      .order("batch_name", { ascending: true })
      .order("subject_name", { ascending: true });
    if (error) {
      toast({
        title: "Couldn't load schedule",
        description: error.message,
        variant: "destructive",
      });
      setItems([]);
    } else {
      setItems((data ?? []) as ScheduleItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) fetchItems(selectedCourseId);
  }, [selectedCourseId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ batch_name: "", subject_name: "", file_link: "" });
    setDialogOpen(true);
  };

  const openEdit = (it: ScheduleItem) => {
    setEditing(it);
    setForm({
      batch_name: it.batch_name,
      subject_name: it.subject_name,
      file_link: it.file_link,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast({ title: "Pick a course first", variant: "destructive" });
      return;
    }
    if (
      !form.batch_name.trim() ||
      !form.subject_name.trim() ||
      !form.file_link.trim()
    ) {
      toast({ title: "All fields required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      course_id: selectedCourseId,
      batch_name: form.batch_name.trim(),
      subject_name: form.subject_name.trim(),
      file_link: form.file_link.trim(),
    };
    const { error } = editing
      ? await supabase
          .from("batch_schedule")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("batch_schedule").insert([payload]);
    setSaving(false);
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: editing ? "Schedule updated" : "Schedule added" });
    setDialogOpen(false);
    fetchItems(selectedCourseId);
  };

  const handleDelete = async (it: ScheduleItem) => {
    if (!confirm(`Delete ${it.batch_name} – ${it.subject_name}?`)) return;
    const { error } = await supabase
      .from("batch_schedule")
      .delete()
      .eq("id", it.id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Schedule deleted" });
    fetchItems(selectedCourseId);
  };

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const filtered = items.filter((it) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      it.batch_name.toLowerCase().includes(q) ||
      it.subject_name.toLowerCase().includes(q)
    );
  });

  const groupedByBatch = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    filtered.forEach((it) => {
      (map[it.batch_name] ??= []).push(it);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Batch Schedule
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Per-subject schedule documents (PDFs / links) per batch.
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={!selectedCourseId}
          className="bg-royal hover:bg-royal-dark"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Entry
        </Button>
      </header>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-full sm:w-96">
            <SelectValue placeholder="Select a course…" />
          </SelectTrigger>
          <SelectContent className="max-h-80">
            {courses
              .filter((c) => !!c.id)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title || "(untitled)"}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search batch or subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            disabled={!selectedCourseId}
          />
        </div>
      </div>

      {!selectedCourseId ? (
        <EmptyHero
          icon={<CalendarRange className="w-6 h-6 text-slate-500" />}
          title="Pick a course to manage its schedule"
          subtitle="Each entry maps a batch + subject to a file link shown on the course page."
        />
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyHero
          icon={<CalendarRange className="w-6 h-6 text-slate-500" />}
          title={search ? "No matches" : "No schedule entries yet"}
          subtitle={
            search
              ? "Try a different search."
              : `Add the first batch + subject for ${selectedCourse?.title ?? "this course"}.`
          }
          actionLabel={search ? undefined : "Add first entry"}
          onAction={search ? undefined : openCreate}
        />
      ) : (
        <div className="space-y-6">
          {groupedByBatch.map(([batch, rows]) => (
            <section key={batch} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-700">
                  {batch}
                </h3>
                <Badge variant="secondary" className="rounded-full">
                  {rows.length}
                </Badge>
              </div>
              <Card className="overflow-hidden divide-y">
                {rows.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {it.subject_name}
                      </p>
                      <a
                        href={it.file_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-royal-dark hover:underline inline-flex items-center gap-1 mt-0.5 truncate"
                      >
                        {it.file_link}
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(it)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(it)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit schedule entry" : "Add schedule entry"}
            </DialogTitle>
            <DialogDescription>
              For course:{" "}
              <span className="font-medium">{selectedCourse?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batch_name">Batch *</Label>
                <Input
                  id="batch_name"
                  value={form.batch_name}
                  onChange={(e) =>
                    setForm({ ...form, batch_name: e.target.value })
                  }
                  placeholder="May 2026"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subject_name">Subject *</Label>
                <Input
                  id="subject_name"
                  value={form.subject_name}
                  onChange={(e) =>
                    setForm({ ...form, subject_name: e.target.value })
                  }
                  placeholder="Mathematics 1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="file_link">File link *</Label>
              <Input
                id="file_link"
                value={form.file_link}
                onChange={(e) =>
                  setForm({ ...form, file_link: e.target.value })
                }
                placeholder="https://…"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-royal hover:bg-royal-dark"
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Create entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const EmptyHero: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon, title, subtitle, actionLabel, onAction }) => (
  <Card className="p-12 flex flex-col items-center justify-center text-center border-dashed">
    <div className="rounded-full bg-slate-100 p-3 mb-3">{icon}</div>
    <p className="text-lg font-medium text-slate-900">{title}</p>
    <p className="text-sm text-slate-500 mt-1 mb-4">{subtitle}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="bg-royal hover:bg-royal-dark">
        <Plus className="w-4 h-4 mr-2" /> {actionLabel}
      </Button>
    )}
  </Card>
);

export default BatchScheduleManagerTab;
