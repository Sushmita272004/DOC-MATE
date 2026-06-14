import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Users, Calendar, Pill, TrendingUp, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient { id: string; age: number; gender: string; disease: string; created_at: string; }
interface Appointment { id: string; status: string; }
interface Prescription { id: string; status: string; }
interface TooltipState { visible: boolean; x: number; y: number; label: string; value: number; }

// ─── Interactive Vertical Bar Chart ──────────────────────────────────────────
function InteractiveBarChart({
  data,
  color,
  height = 200,
}: {
  data: { label: string; value: number }[];
  color: string;
  height?: number;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, label: "", value: 0 });
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const max = Math.max(...data.map((d) => d.value), 1);

  const handleMouseMove = (e: React.MouseEvent, item: { label: string; value: number }, idx: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top - 56, label: item.label, value: item.value });
    setHoveredIdx(idx);
  };

  return (
    <div ref={containerRef} className="relative select-none" style={{ height }}>
      {tooltip.visible && (
        <div
          className="absolute z-20 bg-gray-800 border border-gray-600 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-xl whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          <p className="font-semibold">{tooltip.label}</p>
          <p className="text-gray-300">Count: <span className="text-white font-bold">{tooltip.value}</span></p>
        </div>
      )}
      {/* Y-axis gridlines */}
      <div className="absolute inset-0 flex flex-col justify-between pb-7 pointer-events-none">
        {[max, Math.round(max * 0.5), 0].map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-gray-600 w-4 text-right flex-shrink-0">{v}</span>
            <div className="flex-1 border-t border-gray-800/60" />
          </div>
        ))}
      </div>
      {/* Bars */}
      <div
        className="absolute inset-0 flex items-end gap-2 pt-2 pb-7 pl-7"
        onMouseLeave={() => { setTooltip(t => ({ ...t, visible: false })); setHoveredIdx(null); }}
      >
        {data.map((item, idx) => {
          const pct = (item.value / max) * 100;
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.label}
              className="flex-1 flex flex-col items-center gap-1 cursor-pointer"
              onMouseMove={(e) => handleMouseMove(e, item, idx)}
            >
              <div className="w-full flex items-end" style={{ height: height - 40 }}>
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${color} ${isHovered ? "opacity-100 brightness-125" : "opacity-75"}`}
                  style={{ height: `${Math.max(pct, 2)}%`, transition: "height 0.6s cubic-bezier(0.34,1.56,0.64,1)" }}
                />
              </div>
              <span className="text-gray-500 truncate w-full text-center" style={{ fontSize: "10px" }}>
                {item.label.length > 8 ? item.label.slice(0, 8) + "…" : item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ icon, label, value, sub, colorClass }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; colorClass: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorClass}`}>{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: p }, { data: a }, { data: pr }] = await Promise.all([
      supabase.from("patients").select("*"),
      supabase.from("appointments").select("*"),
      supabase.from("prescriptions").select("*"),
    ]);
    setPatients(p ?? []);
    setAppointments(a ?? []);
    setPrescriptions(pr ?? []);
    setLastRefreshed(new Date());
    setAnimKey(k => k + 1);
    setLoading(false);
  };

  // ── Data transformations ──────────────────────────────────────────────────
  const diseaseCounts = patients.reduce<Record<string, number>>((acc, p) => {
    acc[p.disease] = (acc[p.disease] ?? 0) + 1; return acc;
  }, {});
  const diseaseData = Object.entries(diseaseCounts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([label, value]) => ({ label, value }));

  // Gender as vertical bars
  const genderCounts = patients.reduce<Record<string, number>>((acc, p) => {
    acc[p.gender] = (acc[p.gender] ?? 0) + 1; return acc;
  }, {});
  const genderData = Object.entries(genderCounts).map(([label, value]) => ({ label, value }));

  // Age groups as vertical bars
  const ageData = [
    { label: "0–18", min: 0, max: 18 },
    { label: "19–35", min: 19, max: 35 },
    { label: "36–50", min: 36, max: 50 },
    { label: "51–65", min: 51, max: 65 },
    { label: "65+", min: 66, max: Infinity },
  ].map(({ label, min, max }) => ({ label, value: patients.filter(p => p.age >= min && p.age <= max).length }));

  const apptStatusCounts = appointments.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1; return acc;
  }, {});
  const apptStatusData = Object.entries(apptStatusCounts).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1), value,
  }));

  const prescStatusCounts = prescriptions.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1; return acc;
  }, {});
  const prescStatusData = Object.entries(prescStatusCounts).map(([label, value]) => ({
    label: label.charAt(0).toUpperCase() + label.slice(1), value,
  }));

  const topDisease = diseaseData[0]?.label ?? "—";
  const topGender = [...genderData].sort((a, b) => b.value - a.value)[0]?.label ?? "—";
  const completionRate = appointments.length > 0
    ? Math.round((appointments.filter(a => a.status === "completed").length / appointments.length) * 100) : 0;

  const now = new Date();
  const thisMonth = patients.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const lastMonthCount = patients.filter(p => {
    const d = new Date(p.created_at);
    const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
  }).length;
  const growthRate = lastMonthCount > 0 ? Math.round(((thisMonth - lastMonthCount) / lastMonthCount) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Loading analytics…</p>
      </div>
    </div>
  );

  return (
    <div className="p-6 min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 mt-1 text-sm">Real-time insights from your patient data</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-gray-900 border border-gray-800 px-4 py-2 rounded-lg transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-8">Last updated: {lastRefreshed.toLocaleTimeString()}</p>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <KPICard icon={<Users size={20} className="text-blue-400" />} label="Total Patients" value={patients.length} sub={`${thisMonth} added this month`} colorClass="bg-blue-600/20 border border-blue-600/30" />
        <KPICard icon={<Calendar size={20} className="text-purple-400" />} label="Total Appointments" value={appointments.length} sub={`${appointments.filter(a => a.status === "scheduled").length} scheduled`} colorClass="bg-purple-600/20 border border-purple-600/30" />
        <KPICard icon={<Pill size={20} className="text-emerald-400" />} label="Active Prescriptions" value={prescriptions.filter(p => p.status === "active").length} sub={`${prescriptions.length} total`} colorClass="bg-emerald-600/20 border border-emerald-600/30" />
        <KPICard icon={<TrendingUp size={20} className="text-orange-400" />} label="Monthly Growth" value={`${growthRate > 0 ? "+" : ""}${growthRate}%`} sub={`${thisMonth} new this month`} colorClass="bg-orange-600/20 border border-orange-600/30" />
      </div>

      {/* Disease Distribution — full width */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
        <h3 className="font-semibold text-gray-100 mb-1">Disease Distribution</h3>
        <p className="text-xs text-gray-500 mb-5">Hover over bars for details</p>
        {diseaseData.length === 0
          ? <p className="text-gray-500 text-sm text-center py-12">No patient data yet</p>
          : <InteractiveBarChart key={`d-${animKey}`} data={diseaseData} color="bg-orange-500" height={220} />}
      </div>

      {/* Gender + Age — NOW BOTH VERTICAL BAR CHARTS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-100 mb-1">Gender Distribution</h3>
          <p className="text-xs text-gray-500 mb-5">Hover over bars for details</p>
          {genderData.length === 0
            ? <p className="text-gray-500 text-sm text-center py-8">No data yet</p>
            : <InteractiveBarChart key={`g-${animKey}`} data={genderData} color="bg-blue-500" height={200} />}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-100 mb-1">Age Groups</h3>
          <p className="text-xs text-gray-500 mb-5">Hover over bars for details</p>
          <InteractiveBarChart key={`a-${animKey}`} data={ageData} color="bg-purple-500" height={200} />
        </div>
      </div>

      {/* Appointment Status + Prescription Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-100 mb-1">Appointment Status</h3>
          <p className="text-xs text-gray-500 mb-5">Hover over bars for details</p>
          {apptStatusData.length === 0
            ? <p className="text-gray-500 text-sm text-center py-12">No appointment data yet</p>
            : <InteractiveBarChart key={`ap-${animKey}`} data={apptStatusData} color="bg-emerald-500" height={200} />}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-gray-100 mb-1">Prescription Status</h3>
          <p className="text-xs text-gray-500 mb-5">Hover over bars for details</p>
          {prescStatusData.length === 0
            ? <p className="text-gray-500 text-sm text-center py-8">No prescription data yet</p>
            : <InteractiveBarChart key={`pr-${animKey}`} data={prescStatusData} color="bg-pink-500" height={200} />}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-gray-100 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Most Common Disease", value: topDisease, sub: `${diseaseCounts[topDisease] ?? 0} patients`, color: "text-orange-400" },
            { label: "Appointment Completion", value: `${completionRate}%`, sub: `${appointments.filter(a => a.status === "completed").length} of ${appointments.length} completed`, color: "text-emerald-400" },
            { label: "Predominant Gender", value: topGender, sub: `${genderCounts[topGender] ?? 0} of ${patients.length} patients`, color: "text-blue-400" },
          ].map(item => (
            <div key={item.label} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{item.label}</p>
              <p className={`font-bold text-xl ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}