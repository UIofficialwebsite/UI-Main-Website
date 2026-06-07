import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bell, Send, Users, Globe } from "lucide-react";

type Target = "all" | "authenticated";

const PushNotificationsManagerTab = () => {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [target, setTarget] = useState<Target>("all");
  const [sending, setSending] = useState(false);

  const [totalSubs, setTotalSubs] = useState<number | null>(null);
  const [authedSubs, setAuthedSubs] = useState<number | null>(null);

  const loadCounts = async () => {
    const [all, authed] = await Promise.all([
      supabase.from("push_subscriptions").select("id", { count: "exact", head: true }),
      supabase
        .from("push_subscriptions")
        .select("id", { count: "exact", head: true })
        .not("user_id", "is", null),
    ]);
    setTotalSubs(all.count ?? 0);
    setAuthedSubs(authed.count ?? 0);
  };

  useEffect(() => {
    loadCounts();
  }, []);

  const audienceCount = target === "authenticated" ? authedSubs : totalSubs;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Enter a notification title before sending.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Send this notification to ${audienceCount ?? "all"} subscriber(s)?`)) return;

    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        title: title.trim(),
        body: body.trim(),
        url: url.trim() || "/",
        target,
      },
    });
    setSending(false);

    if (error) {
      toast({
        title: "Send failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const res = data as {
      sent?: number;
      failed?: number;
      removed?: number;
      total?: number;
      disabled?: boolean;
    };

    if (res?.disabled) {
      toast({
        title: "Sending is not active yet",
        description:
          "Push sending is switched off on the server. Set PUSH_ENABLED=true to activate it.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Notification sent",
      description: `Delivered to ${res?.sent ?? 0} of ${res?.total ?? 0} subscribers${
        res?.removed ? ` · pruned ${res.removed} dead` : ""
      }${res?.failed ? ` · ${res.failed} failed` : ""}.`,
    });
    loadCounts();
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
          Push Notifications
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Send a Web Push notification to everyone who has enabled notifications
          in their browser.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={<Globe className="w-5 h-5 text-royal" />}
          label="Total subscribers"
          value={totalSubs}
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-royal" />}
          label="Signed-in subscribers"
          value={authedSubs}
        />
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <Label htmlFor="np-title">Title *</Label>
            <Input
              id="np-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="New batch enrolling now!"
              maxLength={120}
              required
            />
          </div>

          <div>
            <Label htmlFor="np-body">Message</Label>
            <Textarea
              id="np-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Seats are filling fast for the upcoming JEE batch. Tap to explore."
              maxLength={400}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="np-url">Open URL on click</Label>
            <Input
              id="np-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/courses"
            />
            <p className="text-xs text-slate-500 mt-1">
              Relative path (e.g. <code>/courses</code>) or full URL.
            </p>
          </div>

          <div>
            <Label>Audience</Label>
            <Select value={target} onValueChange={(v) => setTarget(v as Target)}>
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone (all devices)</SelectItem>
                <SelectItem value="authenticated">Signed-in users only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <NotificationPreview title={title} body={body} />

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-slate-500">
              {audienceCount === null
                ? "Loading audience…"
                : `Will reach ${audienceCount} subscriber${audienceCount === 1 ? "" : "s"}.`}
            </p>
            <Button
              type="submit"
              disabled={sending || !title.trim()}
              className="bg-royal hover:bg-royal-dark"
            >
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending…" : "Send notification"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number | null;
}> = ({ icon, label, value }) => (
  <Card className="p-5 flex items-center gap-4">
    <div className="rounded-lg bg-royal/10 p-2.5">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-900">
        {value === null ? "—" : value.toLocaleString()}
      </p>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  </Card>
);

const NotificationPreview: React.FC<{ title: string; body: string }> = ({
  title,
  body,
}) => (
  <div>
    <Label className="text-slate-500">Preview</Label>
    <div className="mt-1.5 rounded-lg border bg-slate-50 p-3 flex gap-3">
      <div className="rounded-md bg-royal/10 p-2 h-fit">
        <Bell className="w-4 h-4 text-royal" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900 truncate">
          {title || "Notification title"}
        </p>
        <p className="text-sm text-slate-600 line-clamp-2">
          {body || "Your message body will appear here."}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">Unknown IITians</p>
      </div>
    </div>
  </div>
);

export default PushNotificationsManagerTab;
