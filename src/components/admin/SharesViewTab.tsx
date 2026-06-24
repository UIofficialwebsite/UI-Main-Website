import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Share2, MousePointerClick, Users } from "lucide-react";

interface RecentShare {
  id: string;
  title: string | null;
  content_type: string;
  channel: string | null;
  created_at: string;
  clicks: number;
  shared_by: string | null;
}

interface RecentClick {
  created_at: string;
  source: string;
  clicked_by: string | null;
  title: string | null;
}

interface Analytics {
  total_shares: number;
  total_clicks: number;
  human_clicks: number;
  by_channel: Record<string, number>;
  by_source: Record<string, number>;
  recent: RecentShare[];
  recent_clicks: RecentClick[];
}

const channelTone = (c: string) => {
  if (c === "whatsapp") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (c === "telegram") return "bg-sky-100 text-sky-800 border-sky-200";
  if (c === "copy") return "bg-slate-100 text-slate-700 border-slate-200";
  if (c === "webshare") return "bg-violet-100 text-violet-800 border-violet-200";
  if (c === "x") return "bg-zinc-200 text-zinc-800 border-zinc-300";
  return "bg-amber-100 text-amber-800 border-amber-200";
};

const SharesViewTab = () => {
  const { toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.rpc("get_share_analytics");
    if (error) {
      toast({ title: "Couldn't load share analytics", description: error.message, variant: "destructive" });
      setData(null);
    } else {
      setData(res as unknown as Analytics);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />;
  }
  if (!data || (data as unknown as { error?: string }).error) {
    return <p className="text-sm text-slate-500">No share data available.</p>;
  }

  const ratio = data.total_shares > 0 ? (data.human_clicks / data.total_shares).toFixed(1) : "0";
  const channels = Object.entries(data.by_channel || {}).sort((a, b) => b[1] - a[1]);
  const sources = Object.entries(data.by_source || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Shares</h2>
        <p className="text-sm text-slate-500 mt-1">
          Personalized share links and the clicks they drove. Bot/preview hits are excluded from click counts.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Share2 className="w-5 h-5 text-royal" />} label="Total shares" value={data.total_shares} />
        <StatCard icon={<MousePointerClick className="w-5 h-5 text-royal" />} label="Link clicks" value={data.human_clicks} />
        <StatCard icon={<Users className="w-5 h-5 text-royal" />} label="Clicks / share" value={ratio} />
        <StatCard
          icon={<Share2 className="w-5 h-5 text-royal" />}
          label="Top channel"
          value={channels[0] ? channels[0][0] : "—"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.length > 0 && (
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-1">Shares by channel</p>
            <p className="text-xs text-slate-400 mb-3">How it was shared (native sheet = "webshare").</p>
            <div className="flex flex-wrap gap-2">
              {channels.map(([c, n]) => (
                <Badge key={c} variant="outline" className={channelTone(c)}>
                  {c} · {n}
                </Badge>
              ))}
            </div>
          </Card>
        )}
        {sources.length > 0 && (
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-700 mb-1">Clicks by source</p>
            <p className="text-xs text-slate-400 mb-3">Where clicks came from (WhatsApp/Telegram strip referrer → "direct").</p>
            <div className="flex flex-wrap gap-2">
              {sources.map(([c, n]) => (
                <Badge key={c} variant="outline" className={channelTone(c)}>
                  {c} · {n}
                </Badge>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">When</th>
                <th className="text-left px-4 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold">Shared by</th>
                <th className="text-left px-4 py-3 font-semibold">Channel</th>
                <th className="text-right px-4 py-3 font-semibold">Clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.recent || []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No shares yet.
                  </td>
                </tr>
              ) : (
                data.recent.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <p className="text-slate-900 truncate" title={s.title ?? ""}>{s.title ?? "—"}</p>
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">{s.content_type}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate" title={s.shared_by ?? ""}>
                      {s.shared_by ?? "Anonymous"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={channelTone(s.channel ?? "unknown")}>
                        {s.channel ?? "—"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-slate-900">{s.clicks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Who clicked */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b bg-slate-50">
          <p className="text-sm font-semibold text-slate-700">Recent clicks</p>
          <p className="text-xs text-slate-400">Who opened a shared link (logged-in users are named; others are anonymous).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">When</th>
                <th className="text-left px-4 py-3 font-semibold">Opened by</th>
                <th className="text-left px-4 py-3 font-semibold">Source</th>
                <th className="text-left px-4 py-3 font-semibold">Content</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data.recent_clicks || []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">No clicks yet.</td>
                </tr>
              ) : (
                data.recent_clicks.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(c.created_at).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={c.clicked_by ?? ""}>
                      {c.clicked_by ?? "Anonymous"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={channelTone(c.source)}>{c.source}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[240px] truncate" title={c.title ?? ""}>
                      {c.title ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <Card className="p-4 flex items-center gap-3">
    <div className="rounded-lg bg-royal/10 p-2.5">{icon}</div>
    <div>
      <p className="text-2xl font-bold text-slate-900 capitalize">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </Card>
);

export default SharesViewTab;
