import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const StatisticsCards = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Real data state
  const [todayPatients, setTodayPatients] = useState(0);
  const [weekPatients, setWeekPatients] = useState(0);
  const [monthPatients, setMonthPatients] = useState(0);

  const [todayScheduled, setTodayScheduled] = useState(0);
  const [weekScheduled, setWeekScheduled] = useState(0);
  const [monthScheduled, setMonthScheduled] = useState(0);
  const [nextAppointmentTime, setNextAppointmentTime] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  // Date range helpers
  const getRanges = () => {
    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return { todayStart, todayEnd, weekStart, monthStart, monthEnd, now };
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { todayStart, todayEnd, weekStart, monthStart, monthEnd, now } = getRanges();

    const fmt = (d: Date) => d.toISOString();

    // ── Patients (by created_at) ──────────────────────────────────────────
    const [
      { count: pToday },
      { count: pWeek },
      { count: pMonth },
    ] = await Promise.all([
      supabase.from("patients").select("*", { count: "exact", head: true })
        .gte("created_at", fmt(todayStart)).lte("created_at", fmt(todayEnd)),
      supabase.from("patients").select("*", { count: "exact", head: true })
        .gte("created_at", fmt(weekStart)).lte("created_at", fmt(todayEnd)),
      supabase.from("patients").select("*", { count: "exact", head: true })
        .gte("created_at", fmt(monthStart)).lte("created_at", fmt(monthEnd)),
    ]);

    setTodayPatients(pToday ?? 0);
    setWeekPatients(pWeek ?? 0);
    setMonthPatients(pMonth ?? 0);

    // ── Appointments (by appointment_date) ───────────────────────────────
    const [
      { count: aToday },
      { count: aWeek },
      { count: aMonth },
      { data: upcoming },
    ] = await Promise.all([
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .gte("appointment_date", fmt(todayStart)).lte("appointment_date", fmt(todayEnd)),
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .gte("appointment_date", fmt(weekStart)).lte("appointment_date", fmt(todayEnd)),
      supabase.from("appointments").select("*", { count: "exact", head: true })
        .gte("appointment_date", fmt(monthStart)).lte("appointment_date", fmt(monthEnd)),
      // Next upcoming appointment today
      supabase.from("appointments").select("appointment_date")
        .gte("appointment_date", fmt(now))
        .lte("appointment_date", fmt(todayEnd))
        .eq("status", "scheduled")
        .order("appointment_date", { ascending: true })
        .limit(1),
    ]);

    setTodayScheduled(aToday ?? 0);
    setWeekScheduled(aWeek ?? 0);
    setMonthScheduled(aMonth ?? 0);

    if (upcoming && upcoming.length > 0) {
      const t = new Date(upcoming[0].appointment_date);
      setNextAppointmentTime(t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } else {
      setNextAppointmentTime(null);
    }

    setLoading(false);
  };

  const announcements = [
    "New COVID-19 protocols in effect from Monday",
    "Emergency contact updated: +91-9876543210",
    "Staff meeting scheduled for 3 PM today",
  ];

  const holidays = [
    new Date(2026, 0, 26),
    new Date(2026, 7, 15),
    new Date(2026, 9, 2),
  ];

  const Skeleton = () => (
    <div className="h-8 w-12 bg-gray-700 rounded animate-pulse mx-auto" />
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

      {/* Patients Visited */}
      <Card className="group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center dark:text-white">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Patients Visited
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg dark:bg-gray-700">
              {loading ? <Skeleton /> : <div className="text-2xl font-bold dark:text-cyan-400">{todayPatients}</div>}
              <div className="text-xs dark:text-gray-400 mt-1">Today</div>
            </div>
            <div className="p-3 rounded-lg dark:bg-gray-700">
              {loading ? <Skeleton /> : <div className="text-2xl font-bold dark:text-green-400">{weekPatients}</div>}
              <div className="text-xs dark:text-gray-400 mt-1">This Week</div>
            </div>
            <div className="p-3 rounded-lg dark:bg-gray-700">
              {loading ? <Skeleton /> : <div className="text-2xl font-bold dark:text-purple-400">{monthPatients}</div>}
              <div className="text-xs dark:text-gray-400 mt-1">This Month</div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm dark:text-gray-400">Status</span>
            <Badge className="bg-green-500 text-white">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Appointments */}
      <Card className="group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center dark:text-white">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Scheduled Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg dark:bg-gray-700">
              {loading ? <Skeleton /> : <div className="text-2xl font-bold dark:text-orange-400">{todayScheduled}</div>}
              <div className="text-xs dark:text-gray-400 mt-1">Today</div>
            </div>
            <div className="p-3 rounded-lg dark:bg-gray-700">
              {loading ? <Skeleton /> : <div className="text-2xl font-bold dark:text-blue-400">{weekScheduled}</div>}
              <div className="text-xs dark:text-gray-400 mt-1">This Week</div>
            </div>
            <div className="p-3 rounded-lg dark:bg-gray-700">
              {loading ? <Skeleton /> : <div className="text-2xl font-bold dark:text-indigo-400">{monthScheduled}</div>}
              <div className="text-xs dark:text-gray-400 mt-1">This Month</div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm dark:text-gray-400">Next Appointment</span>
            {nextAppointmentTime
              ? <Badge className="bg-blue-500 text-white">{nextAppointmentTime}</Badge>
              : <Badge className="bg-gray-600 text-white">None today</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Office Announcements */}
      <Card className="group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center dark:text-white">
            <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Office Announcements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {announcements.map((announcement, index) => (
              <div key={index} className="p-3 rounded-lg dark:bg-gray-700 border-l-4 border-purple-500">
                <p className="text-sm dark:text-gray-300">{announcement}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm dark:text-gray-400">Front Desk Chat</span>
            <Badge className="bg-purple-500 text-white">3 New</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="group hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 dark:border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center dark:text-white">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar & Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="scale-75 origin-top-left">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border dark:border-gray-600 p-2 dark:bg-gray-750"
              modifiers={{ holiday: holidays, today: new Date() }}
              modifiersStyles={{
                holiday: { backgroundColor: "#ef4444", color: "white", borderRadius: "50%" },
                today: { backgroundColor: "#3b82f6", color: "white", borderRadius: "50%" },
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm dark:text-gray-400">Working Days</span>
            <Badge className="bg-green-500 text-white">Mon-Sat</Badge>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default StatisticsCards;