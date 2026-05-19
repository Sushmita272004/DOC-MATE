
import StatisticsCards from "./StatisticsCards";
import ActivityFeed from "./ActivityFeed";
import ScheduleTimeline from "./ScheduleTimeline";

const DashboardOverview = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-400 border-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, Dr. Chen
            </h1>
            <p className="text-gray-300">
              Today is {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-cyan-400">14:23</div>
            <div className="text-sm text-gray-400">Next appointment in 37 min</div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatisticsCards />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>

        {/* Schedule Timeline */}
        <div>
          <ScheduleTimeline />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
