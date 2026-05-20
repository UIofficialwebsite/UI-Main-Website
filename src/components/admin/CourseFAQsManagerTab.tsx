import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Search,
} from "lucide-react";

interface CourseLite {
  id: string;
  title: string;
}
interface Faq {
  id: string;
  course_id: string;
  question: string;
  answer: string;
  created_at: string;
}

const CourseFAQsManagerTab = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<CourseLite[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [form, setForm] = useState({ question: "", answer: "" });
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title")
      .order("title", { ascending: true });
    setCourses((data ?? []) as CourseLite[]);
  };

  const fetchFaqs = async (courseId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("course_faqs")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });
    if (error) {
      toast({
        title: "Couldn't load FAQs",
        description: error.message,
        variant: "destructive",
      });
      setFaqs([]);
    } else {
      setFaqs((data ?? []) as Faq[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchFaqs(selectedCourseId);
      setExpanded(new Set());
    }
  }, [selectedCourseId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ question: "", answer: "" });
    setDialogOpen(true);
  };

  const openEdit = (f: Faq) => {
    setEditing(f);
    setForm({ question: f.question, answer: f.answer });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      toast({
        title: "Pick a course first",
        variant: "destructive",
      });
      return;
    }
    if (!form.question.trim() || !form.answer.trim()) {
      toast({
        title: "Both fields required",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const payload = {
      course_id: selectedCourseId,
      question: form.question.trim(),
      answer: form.answer.trim(),
    };
    const { error } = editing
      ? await supabase
          .from("course_faqs")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("course_faqs").insert([payload]);
    setSaving(false);
    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: editing ? "FAQ updated" : "FAQ added" });
    setDialogOpen(false);
    fetchFaqs(selectedCourseId);
  };

  const handleDelete = async (f: Faq) => {
    if (!confirm(`Delete this FAQ?\n\n"${f.question}"`)) return;
    const { error } = await supabase.from("course_faqs").delete().eq("id", f.id);
    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "FAQ deleted" });
    fetchFaqs(selectedCourseId);
  };

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCourse = useMemo(
    () => courses.find((c) => c.id === selectedCourseId),
    [courses, selectedCourseId]
  );

  const filteredFaqs = faqs.filter((f) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      f.question.toLowerCase().includes(q) ||
      f.answer.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
            Course FAQs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Question/answer pairs shown on each course detail page.
          </p>
        </div>
        <Button
          onClick={openCreate}
          disabled={!selectedCourseId}
          className="bg-royal hover:bg-royal-dark"
        >
          <Plus className="w-4 h-4 mr-2" /> Add FAQ
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
            placeholder="Search question or answer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            disabled={!selectedCourseId}
          />
        </div>
      </div>

      {!selectedCourseId ? (
        <EmptyHero
          icon={<HelpCircle className="w-6 h-6 text-slate-500" />}
          title="Pick a course to manage its FAQs"
          subtitle="FAQs appear on the course detail page in the order they were added."
        />
      ) : loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredFaqs.length === 0 ? (
        <EmptyHero
          icon={<HelpCircle className="w-6 h-6 text-slate-500" />}
          title={`No FAQs ${search ? "match your search" : "yet"}`}
          subtitle={
            search
              ? "Try a different keyword."
              : `Start adding questions for ${selectedCourse?.title ?? "this course"}.`
          }
          actionLabel={search ? undefined : "Add first FAQ"}
          onAction={search ? undefined : openCreate}
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            <Badge variant="secondary" className="rounded-full mr-2">
              {filteredFaqs.length}
            </Badge>
            {filteredFaqs.length === 1 ? "FAQ" : "FAQs"} for{" "}
            <span className="font-medium text-slate-700">
              {selectedCourse?.title}
            </span>
          </p>
          {filteredFaqs.map((f) => (
            <Card key={f.id} className="overflow-hidden">
              <Collapsible open={expanded.has(f.id)}>
                <div className="flex items-start gap-2 p-4">
                  <CollapsibleTrigger asChild>
                    <button
                      onClick={() => toggle(f.id)}
                      className="flex-1 flex items-start gap-2 text-left min-w-0"
                    >
                      {expanded.has(f.id) ? (
                        <ChevronDown className="w-4 h-4 mt-1 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 mt-1 text-slate-400 shrink-0" />
                      )}
                      <span className="font-medium text-slate-900">
                        {f.question}
                      </span>
                    </button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(f)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(f)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="px-4 pb-4 pl-10 text-sm text-slate-600 whitespace-pre-wrap border-t pt-3">
                    {f.answer}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
            <DialogDescription>
              For course:{" "}
              <span className="font-medium">{selectedCourse?.title}</span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="question">Question *</Label>
              <Input
                id="question"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
                placeholder="What's covered in this batch?"
                required
              />
            </div>
            <div>
              <Label htmlFor="answer">Answer *</Label>
              <Textarea
                id="answer"
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                rows={6}
                placeholder="Write the answer the student will see…"
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
                {saving ? "Saving…" : editing ? "Save changes" : "Create FAQ"}
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

export default CourseFAQsManagerTab;
