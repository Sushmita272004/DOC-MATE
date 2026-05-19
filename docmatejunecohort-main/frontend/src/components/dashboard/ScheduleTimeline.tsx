
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ScheduleTimeline = () => {
  const currentTime = new Date();
  const currentHour = currentTime.getHours();
  
  const appointments = [
    {
      id: 1,
      time: "09:00",
      duration: 30,
      patient: "Emma Johnson",
      type: "Consultation",
      status: "completed",
      room: "205"
    },
    {
      id: 2,
      time: "09:30",
      duration: 45,
      patient: "Michael Chen",
      type: "Follow-up",
      status: "completed",
      room: "205"
    },
    {
      id: 3,
      time: "10:30",
      duration: 30,
      patient: "Sarah Williams",
      type: "Check-up",
      status: "completed",
      room: "205"
    },
    {
      id: 4,
      time: "14:30",
      duration: 60,
      patient: "Robert Davis",
      type: "Consultation",
      status: "current",
      room: "205"
    },
    {
      id: 5,
      time: "15:30",
      duration: 30,
      patient: "Maria Rodriguez",
      type: "Follow-up",
      status: "upcoming",
      room: "205"
    },
    {
      id: 6,
      time: "16:00",
      duration: 45,
      patient: "John Smith",
      type: "New Patient",
      status: "upcoming",
      room: "205"
    }
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      completed: "bg-green-500 border-green-400",
      current: "bg-cyan-500 border-cyan-400 animate-pulse",
      upcoming: "bg-blue-500 border-blue-400"
    };
    return colors[status as keyof typeof colors];
  };

  const getStatusText = (status: string) => {
    const texts = {
      completed: "Completed",
      current: "In Progress",
      upcoming: "Scheduled"
    };
    return texts[status as keyof typeof texts];
  };

  return (
    <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Today's Schedule</h3>
        <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add
        </Button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {appointments.map((appointment, index) => (
          <div key={appointment.id} className="relative pl-8">
            {/* Timeline Line */}
            {index < appointments.length - 1 && (
              <div className="absolute left-2 top-8 w-0.5 h-16 bg-gray-600"></div>
            )}
            
            {/* Timeline Dot */}
            <div className={`absolute left-0 top-2 w-4 h-4 rounded-full border-2 ${getStatusColor(appointment.status)}`}></div>
            
            {/* Appointment Card */}
            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-4 hover:bg-opacity-70 transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-cyan-400 font-mono text-lg">{appointment.time}</span>
                  <span className="text-gray-400 text-sm">({appointment.duration}min)</span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  appointment.status === 'completed' ? 'bg-green-500 bg-opacity-20 text-green-400' :
                  appointment.status === 'current' ? 'bg-cyan-500 bg-opacity-20 text-cyan-400' :
                  'bg-blue-500 bg-opacity-20 text-blue-400'
                }`}>
                  {getStatusText(appointment.status)}
                </span>
              </div>
              
              <div className="space-y-1">
                <h4 className="text-white font-medium">{appointment.patient}</h4>
                <p className="text-gray-300 text-sm">{appointment.type}</p>
                <p className="text-gray-400 text-xs">Room {appointment.room}</p>
              </div>
              
              {appointment.status === 'current' && (
                <div className="mt-3 flex space-x-2">
                  <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    Quick Note
                  </Button>
                </div>
              )}
              
              {appointment.status === 'upcoming' && (
                <div className="mt-3 flex space-x-2">
                  <Button variant="ghost" size="sm" className="text-cyan-400 hover:text-cyan-300">
                    Reschedule
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                    Contact
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">
            {appointments.filter(a => a.status === 'completed').length} completed
          </span>
          <span className="text-gray-400">
            {appointments.filter(a => a.status === 'upcoming').length} remaining
          </span>
        </div>
      </div>
    </Card>
  );
};

export default ScheduleTimeline;
