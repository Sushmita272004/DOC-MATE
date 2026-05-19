import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { useUser } from "@clerk/clerk-react";
import { useUserProfile } from "@/context/UserProfileContext";

const Settings = () => {
  const { profile, updateProfile } = useUserProfile();
  const { user } = useUser();

  const [fullName, setFullName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      const userId = user.id;
      const prefix = `user_${userId}`;
      const isInitialized = localStorage.getItem(`${prefix}_initialized`);

      // If first-time login → Initialize from Clerk
      if (!isInitialized) {
        const clerkName = user.fullName || "";
        const clerkEmail = user.primaryEmailAddress?.emailAddress || "";
        const clerkSpecialization = profile.specialization || "";

        // Store in localStorage
        localStorage.setItem(`${prefix}_fullName`, clerkName);
        localStorage.setItem(`${prefix}_email`, clerkEmail);
        localStorage.setItem(`${prefix}_specialization`, clerkSpecialization);
        localStorage.setItem(`${prefix}_initialized`, "true");

        // Set local state (only)
        setFullName(clerkName);
        setEmail(clerkEmail);
        setSpecialization(clerkSpecialization);

        // Update profile context only first time
        updateProfile({
          fullName: clerkName,
          specialization: clerkSpecialization,
          email: clerkEmail,
        });
      } else {
        // For existing users → always load from localStorage
        const storedName = localStorage.getItem(`${prefix}_fullName`) || "";
        const storedEmail = localStorage.getItem(`${prefix}_email`) || "";
        const storedSpecialization = localStorage.getItem(`${prefix}_specialization`) || "";

        // Just set state – DO NOT call updateProfile here
        setFullName(storedName);
        setEmail(storedEmail);
        setSpecialization(storedSpecialization);
      }
    }
  }, [user]);

  const handleUpdate = () => {
    if (!user) return;
    const prefix = `user_${user.id}`;

    localStorage.setItem(`${prefix}_fullName`, fullName);
    localStorage.setItem(`${prefix}_specialization`, specialization);
    localStorage.setItem(`${prefix}_email`, email);
    localStorage.setItem(`${prefix}_initialized`, "true");

    updateProfile({ fullName, specialization, email });
    alert("✅ Profile updated!");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 border border-cyan-400 border-opacity-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
              <p className="text-gray-300">Configure your preferences and system settings.</p>
            </div>
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">1</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Profile Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Specialization</label>
                <input
                  type="text"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Email (can't be changed)</label>
                <input
                  type="email"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white opacity-70 cursor-not-allowed"
                  value={email}
                  readOnly
                  disabled
                />
              </div>
              <button
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg hover:opacity-90"
                onClick={handleUpdate}
              >
                Update Profile
              </button>
            </div>
          </div>

          {/* AI Preferences – unchanged */}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
