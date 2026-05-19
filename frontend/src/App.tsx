import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { createClient } from "@supabase/supabase-js";

import Index from "./pages/Index";
import Patients from "./pages/Patients";
import Prescriptions from "./pages/Prescriptions";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

import { UserProfileProvider } from "@/context/UserProfileContext"; // ✅ Added

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, isSignedIn } = useUser();

  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkApproval = async () => {
      if (!isSignedIn || !user) {
        setLoading(false);
        return;
      }

      const userId = user.id;
      console.log("🔐 Clerk User ID:", userId);

      try {
        const { data, error } = await supabase
          .from("users")
          .select("is_approved")
          .eq("id", userId)
          .single();

        console.log("📥 Supabase response:", { data, error });

        if (error) {
          if (error.code === "PGRST116" || error.message.includes("No rows")) {
            console.warn("ℹ️ User not found in Supabase. Creating default entry...");
            const { error: insertError } = await supabase
              .from("users")
              .insert({ id: userId, is_approved: false });

            if (insertError) {
              console.error("❌ Insert failed:", insertError);
              setErrorMessage("User not registered. Contact admin.");
            } else {
              setIsApproved(false);
            }
          } else {
            console.error("❌ Supabase error:", error);
            setErrorMessage("Error verifying access. Please try again later.");
          }
        } else if (data?.is_approved) {
          setIsApproved(true);
        } else {
          console.warn("⚠️ User exists but not approved.");
          setIsApproved(false);
        }
      } catch (err) {
        console.error("❌ Unexpected error:", err);
        setErrorMessage("Unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    };

    checkApproval();
  }, [isSignedIn, user]);

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "2rem" }}>🔄 Checking access...</div>;
  }

  if (errorMessage) {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem", color: "red" }}>
        {errorMessage}
      </div>
    );
  }

  if (isApproved === false && import.meta.env.MODE !== "development") {
    return (
      <div style={{ textAlign: "center", marginTop: "2rem", color: "orange" }}>
        🚫 Access denied. You're not approved to access this app.
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/prescriptions" element={<Prescriptions />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserProfileProvider> {/* ✅ Inject context here */}
          <AppContent />
        </UserProfileProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
