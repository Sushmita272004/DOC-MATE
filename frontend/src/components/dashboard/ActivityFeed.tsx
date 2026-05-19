
import { Card } from "@/components/ui/card";

const ActivityFeed = () => {
  const activities = [
    {
      id: 1,
      type: "voice_booking",
      title: "Voice appointment booked",
      description: "Patient: Maria Rodriguez - Cardiology consultation scheduled for tomorrow 2:30 PM",
      timestamp: "2 minutes ago",
      icon: "microphone",
      color: "cyan"
    },
    {
      id: 2,
      type: "ai_prescription",
      title: "AI prescription generated",
      description: "Hypertension treatment plan created for John Smith - 95% confidence",
      timestamp: "5 minutes ago",
      icon: "pills",
      color: "green"
    },
    {
      id: 3,
      type: "patient_checkin",
      title: "Patient checked in",
      description: "Emma Johnson arrived for 2:00 PM appointment - Room 205",
      timestamp: "8 minutes ago",
      icon: "user",
      color: "blue"
    },
    {
      id: 4,
      type: "prescription_modified",
      title: "Prescription modified",
      description: "Dr. Chen adjusted dosage for Robert Davis - AI learning updated",
      timestamp: "12 minutes ago",
      icon: "edit",
      color: "amber"
    },
    {
      id: 5,
      type: "voice_command",
      title: "Voice command processed",
      description: "\"Schedule follow-up for Sarah Wilson in 2 weeks\" - Completed successfully",
      timestamp: "15 minutes ago",
      icon: "voice",
      color: "purple"
    },
    {
      id: 6,
      type: "system_update",
      title: "System learning improved",
      description: "AI accuracy increased to 98.5% based on recent doctor modifications",
      timestamp: "20 minutes ago",
      icon: "brain",
      color: "indigo"
    }
  ];

  const getIcon = (iconName: string) => {
    const icons = {
      microphone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />,
      pills: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />,
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      edit: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
      voice: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />,
      brain: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    };
    return icons[iconName as keyof typeof icons];
  };

  const getColorClasses = (color: string) => {
    const colors = {
      cyan: "bg-cyan-500 border-cyan-400",
      green: "bg-green-500 border-green-400",
      blue: "bg-blue-500 border-blue-400",
      amber: "bg-amber-500 border-amber-400",
      purple: "bg-purple-500 border-purple-400",
      indigo: "bg-indigo-500 border-indigo-400"
    };
    return colors[color as keyof typeof colors];
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Real-Time Activity Feed</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.map((activity, index) => (
          <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg bg-gray-800 bg-opacity-50 hover:bg-opacity-70 transition-all duration-200">
            <div className={`p-2 rounded-lg ${getColorClasses(activity.color)} bg-opacity-20 border`}>
              <svg className={`w-5 h-5 text-${activity.color}-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {getIcon(activity.icon)}
              </svg>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-medium">{activity.title}</h4>
                <span className="text-gray-400 text-sm">{activity.timestamp}</span>
              </div>
              <p className="text-gray-300 text-sm mt-1">{activity.description}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <button className="w-full text-center text-cyan-400 hover:text-cyan-300 text-sm font-medium">
          View All Activities
        </button>
      </div>
    </Card>
  );
};

export default ActivityFeed;
