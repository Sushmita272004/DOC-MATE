import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface FeedItem {
  id: string;
  type: "patient" | "appointment" | "prescription";
  title: string;
  description: string;
  timestamp: Date;
}

const ActivityFeed = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivity = async () => {
    const [{ data: patients }, { data: appointments }, { data: prescriptions }] =
      await Promise.all([
        supabase
          .from("patients")
          .select("id, name, disease, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("appointments")
          .select("id, appointment_type, doctor_name, status, appointment_date, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("prescriptions")
          .select("id, medication_name, status, created_at, patient_id")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    const items: FeedItem[] = [];

    (patients ?? []).forEach((p) => {
      items.push({
        id: `p-${p.id}`,
        type: "patient",
        title: "New patient added",
        description: `${p.name} was registered${p.disease ? ` — ${p.disease}` : ""}`,
        timestamp: new Date(p.created_at),
      });
    });

    (appointments ?? []).forEach((a) => {
      items.push({
        id: `a-${a.id}`,
        type: "appointment",
        title: "Appointment scheduled",
        description: `${a.appointment_type ?? "Appointment"} with Dr. ${a.doctor_name} — ${a.status}`,
        timestamp: new Date(a.created_at),
      });
    });

    (prescriptions ?? []).forEach((pr) => {
      items.push({
        id: `pr-${pr.id}`,
        type: "prescription",
        title: "Prescription created",
        description: `${pr.medication_name} — status: ${pr.status}`,
        timestamp: new Date(pr.created_at),
      });
    });

    // Sort all by most recent first, take top 8
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    setFeed(items.slice(0, 8));
    setLoading(false);
  };

  const timeAgo = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getStyle = (type: FeedItem["type"]) => {
    switch (type) {
      case "patient":
        return {
          bg: "bg-blue-500/10 border border-blue-500/30",
          icon: "text-blue-400",
          path: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
        };
      case "appointment":
        return {
          bg: "bg-green-500/10 border border-green-500/30",
          icon: "text-green-400",
          path: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        };
      case "prescription":
        return {
          bg: "bg-emerald-500/10 border border-emerald-500/30",
          icon: "text-emerald-400",
          path: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
        };
    }
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Real-Time Activity Feed</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          // Skeleton loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-800/50 animate-pulse">
              <div className="w-9 h-9 rounded-lg bg-gray-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/3" />
                <div className="h-3 bg-gray-700 rounded w-2/3" />
              </div>
            </div>
          ))
        ) : feed.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No recent activity yet.</p>
            <p className="text-xs mt-1">Add patients, appointments or prescriptions to see activity here.</p>
          </div>
        ) : (
          feed.map((item) => {
            const style = getStyle(item.type);
            return (
              <div
                key={item.id}
                className="flex items-start space-x-4 p-4 rounded-lg bg-gray-800/50 hover:bg-gray-800/80 transition-all duration-200"
              >
                <div className={`p-2 rounded-lg flex-shrink-0 ${style.bg}`}>
                  <svg className={`w-5 h-5 ${style.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {style.path}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-white font-medium text-sm">{item.title}</h4>
                    <span className="text-gray-500 text-xs flex-shrink-0">{timeAgo(item.timestamp)}</span>
                  </div>
                  <p className="text-gray-400 text-sm mt-0.5 truncate">{item.description}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <button
          onClick={fetchActivity}
          className="w-full text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
        >
          Refresh Activity
        </button>
      </div>
    </Card>
  );
};

export default ActivityFeed;