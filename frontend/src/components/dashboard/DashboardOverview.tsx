import StatisticsCards from "./StatisticsCards";
import ActivityFeed from "./ActivityFeed";
import ScheduleTimeline from "./ScheduleTimeline";
import { useUser } from "@clerk/clerk-react";
import { useUserProfile } from "@/context/UserProfileContext";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const DashboardOverview = () => {
  const { user } = useUser();
  const { profile } = useUserProfile();

  const displayName = (() => {
    if (user) {
      const prefix = `user_${user.id}`;
      if (localStorage.getItem(`${prefix}_initialized`)) {
        return localStorage.getItem(`${prefix}_fullName`) || profile.fullName || user.fullName || "";
      }
    }
    return profile.fullName || user?.fullName || "";
  })();
  const [now, setNow] = useState(new Date());
  const [nextAppointment, setNextAppointment] = useState<Date | null>(null);

  // Tick every second for live clock
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Fetch next upcoming appointment
  useEffect(() => {
    fetchNextAppointment();
    const interval = setInterval(fetchNextAppointment, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchNextAppointment = async () => {
    const { data } = await supabase
      .from("appointments")
      .select("appointment_date")
      .gte("appointment_date", new Date().toISOString())
      .eq("status", "scheduled")
      .order("appointment_date", { ascending: true })
      .limit(1);

    if (data && data.length > 0) {
      setNextAppointment(new Date(data[0].appointment_date));
    } else {
      setNextAppointment(null);
    }
  };

  const getCountdown = () => {
    if (!nextAppointment) return "No upcoming appointments";
    const diffMs = nextAppointment.getTime() - now.getTime();
    if (diffMs <= 0) return "Appointment now";
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMin / 60);
    const remMin = diffMin % 60;
    if (diffHr > 0) return `Next appointment in ${diffHr}h ${remMin}m`;
    return `Next appointment in ${diffMin} min`;
  };

  return (
    <div className="space-y-6">

      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-400 border-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, Dr. {displayName}
            </h1>
            <p className="text-gray-300">
              Today is{" "}
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {getCountdown()}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
        <div>
          <ScheduleTimeline />
        </div>
      </div>

    </div>
  );
};

export default DashboardOverview;