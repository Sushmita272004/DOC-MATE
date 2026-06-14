import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useClerk, useUser } from "@clerk/clerk-react";
import { useUserProfile } from "@/context/UserProfileContext";
import { useTheme } from "@/context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import docmateLogo from "@/components/logo/docmate_logo.png";

interface HeaderProps {
  onLogout: () => void;
}

const Header = ({ onLogout }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [displaySpecialization, setDisplaySpecialization] = useState('');

  const navigate = useNavigate();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { profile } = useUserProfile();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const updateTimeAndDate = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('en-IN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: 'Asia/Kolkata',
      });
      const dateFormatter = new Intl.DateTimeFormat('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      setCurrentTime(timeFormatter.format(now));
      setCurrentDate(dateFormatter.format(now));
    };
    updateTimeAndDate();
    const interval = setInterval(updateTimeAndDate, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      const userId = user.id;
      const prefix = `user_${userId}`;
      const isInitialized = localStorage.getItem(`${prefix}_initialized`);
      if (isInitialized) {
        const storedName = localStorage.getItem(`${prefix}_fullName`) || "";
        const storedSpecialization = localStorage.getItem(`${prefix}_specialization`) || "";
        setDisplayName(storedName);
        setDisplaySpecialization(storedSpecialization);
      } else {
        setDisplayName(user.fullName || "Dr. Unknown");
        setDisplaySpecialization(profile.specialization || "Cardiology");
      }
    }
  }, [user, profile]);

  const handleLogoutClick = async () => {
    try {
      localStorage.removeItem("docmate_auth");
      await signOut();
      onLogout();
      navigate("/login");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  const handleProfileSettingsClick = () => navigate("/settings");

  const initials = (displayName || "DocMate")
    .split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <header className={`h-16 border-b shadow-lg backdrop-blur-lg ${
      theme === "dark"
        ? "bg-gradient-to-r from-gray-800 to-gray-900 border-gray-600"
        : "bg-gradient-to-r from-white to-gray-100 border-gray-200"
    }`}>
      <div className="flex items-center justify-between h-full px-6">

        {/* Left: Logo + status */}
        <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-4">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <img src={docmateLogo} alt="DocMate Logo" className="w-12 h-12 rounded-lg mr-3 shadow-lg object-cover" />
            <div className="flex flex-col leading-tight">
              <h1 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>DocMate</h1>
              <span className={`text-[12px] -mt-1 ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>The Doctor's Ally</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>Online</span>
          </div>

          <div className={`text-sm hidden md:block ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
            N6T Technologies
          </div>
        </div>

        {/* Right: Time + Theme toggle + User */}
        <div className="flex items-center space-x-4 sm:space-x-6">

          {/* Time */}
          <div className="text-right hidden sm:block">
            <div className={`font-mono text-sm sm:text-base ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{currentTime}</div>
            <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{currentDate}</div>
          </div>

          {/* 🌙 / ☀️ Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-yellow-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <div className={`font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>{displayName || "Dr. Unknown"}</div>
              <div className={`text-xs ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>{displaySpecialization || "Cardiologist"}</div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center hover:opacity-80 shadow-lg"
                >
                  <span className="text-white font-semibold">{initials}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}>
                <DropdownMenuItem
                  className={theme === "dark" ? "text-gray-300 hover:text-white hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}
                  onClick={handleProfileSettingsClick}
                >
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-400 hover:text-red-300 hover:bg-gray-700"
                  onClick={handleLogoutClick}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;