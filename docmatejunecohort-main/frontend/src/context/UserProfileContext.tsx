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
    specialization: "Cardiologist",
    email: "",
  });

  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        email: user.primaryEmailAddress?.emailAddress || "",
      }));
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
