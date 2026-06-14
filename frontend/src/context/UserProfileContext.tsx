import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";

interface Profile {
  fullName: string;
  specialization: string;
  email: string;
}

interface UserProfileContextType {
  profile: Profile;
  updateProfile: (data: Profile) => void;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();

  const [profile, setProfile] = useState<Profile>({
    fullName: "",
    specialization: "",
    email: "",
  });

  useEffect(() => {
    if (user) {
      const prefix = `user_${user.id}`;
      const isInitialized = localStorage.getItem(`${prefix}_initialized`);

      if (isInitialized) {
        // ── Returning user → always load from localStorage ──
        const storedName = localStorage.getItem(`${prefix}_fullName`) || user.fullName || "";
        const storedSpec = localStorage.getItem(`${prefix}_specialization`) || "";
        const storedEmail = localStorage.getItem(`${prefix}_email`) || user.primaryEmailAddress?.emailAddress || "";

        setProfile({
          fullName: storedName,
          specialization: storedSpec,
          email: storedEmail,
        });
      } else {
        // ── First-time login → use Clerk data ──
        setProfile({
          fullName: user.fullName || "",
          specialization: "",
          email: user.primaryEmailAddress?.emailAddress || "",
        });
      }
    }
  }, [user]);

  const updateProfile = (data: Profile) => {
    setProfile(data);
  };

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error("useUserProfile must be used within UserProfileProvider");
  return context;
};