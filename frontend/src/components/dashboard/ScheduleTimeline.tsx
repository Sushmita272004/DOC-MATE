import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_type: string;
  doctor_name: string;
  status: string;
  notes: string;
  patient_id: string;
  patientName?: string;
}

const ScheduleTimeline = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    fetchToday();
    // Tick every minute to update "current" status live
    const tick = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(tick);
  }, []);

  const fetchToday = async () => {
    setLoading(true);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: appts } = await supabase
      .from("appointments")
      .select("*")
      .gte("appointment_date", todayStart.toISOString())
      .lte("appointment_date", todayEnd.toISOString())
      .order("appointment_date", { ascending: true });

    if (!appts || appts.length === 0) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    // Fetch patient names for each appointment
    const patientIds = [...new Set(appts.map((a) => a.patient_id))];
    const { data: patients } = await supabase
      .from("patients")
      .select("id, name")
      .in("id", patientIds);

    const nameMap: Record<string, string> = {};
    (patients ?? []).forEach((p) => { nameMap[p.id] = p.name; });

    const enriched = appts.map((a) => ({
      ...a,
      patientName: nameMap[a.patient_id] ?? "Unknown Patient",
    }));

    setAppointments(enriched);
    setLoading(false);
  };

  // Determine display status based on appointment_date vs current time
  const getDisplayStatus = (appt: Appointment) => {
    // Always respect what is saved in Supabase
    if (appt.status === "completed") return "completed";
    if (appt.status === "cancelled") return "completed"; // treat cancelled as done

    // For scheduled appointments, check if it is currently happening
    const apptTime = new Date(appt.appointment_date);
    const diffMin = (now.getTime() - apptTime.getTime()) / 60000;

    if (diffMin >= 0 && diffMin <= 60) return "current";  // happening now (within 60 min window)
    return "upcoming";                                       // future or not yet started
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed": return { dot: "bg-green-500 border-green-400", badge: "bg-green-500/20 text-green-400", label: "Completed" };
      case "current":   return { dot: "bg-cyan-500 border-cyan-400 animate-pulse", badge: "bg-cyan-500/20 text-cyan-400", label: "In Progress" };
      default:          return { dot: "bg-blue-500 border-blue-400", badge: "bg-blue-500/20 text-blue-400", label: "Scheduled" };
    }
  };

  const completed = appointments.filter((a) => getDisplayStatus(a) === "completed").length;
  const remaining = appointments.filter((a) => getDisplayStatus(a) === "upcoming").length;

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Today's Schedule</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-cyan-400 hover:text-cyan-300"
          onClick={fetchToday}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="relative pl-8 animate-pulse">
              <div className="absolute left-0 top-2 w-4 h-4 rounded-full bg-gray-700" />
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-700 rounded w-1/3" />
              </div>
            </div>
          ))
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No appointments today</p>
            <p className="text-xs mt-1">Go to Patient Management to add appointments</p>
          </div>
        ) : (
          appointments.map((appt, index) => {
            const status = getDisplayStatus(appt);
            const style = getStatusStyle(status);
            return (
              <div key={appt.id} className="relative pl-8">
                {/* Timeline line */}
                {index < appointments.length - 1 && (
                  <div className="absolute left-2 top-8 w-0.5 h-16 bg-gray-700" />
                )}
                {/* Timeline dot */}
                <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 ${style.dot}`} />

                {/* Card */}
                <div className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800/80 transition-all duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-mono text-lg">
                        {formatTime(appt.appointment_date)}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(appt.appointment_date)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${style.badge}`}>
                      {style.label}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="text-white font-medium">{appt.patientName}</h4>
                    <p className="text-gray-300 text-sm">{appt.appointment_type}</p>
                    <p className="text-gray-500 text-xs">Dr. {appt.doctor_name}</p>
                    {appt.notes && (
                      <p className="text-gray-500 text-xs truncate">{appt.notes}</p>
                    )}
                  </div>

                  {status === "current" && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs">
                        In Progress
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">{completed} completed</span>
          <span className="text-gray-400">{remaining} remaining</span>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleTimeline;