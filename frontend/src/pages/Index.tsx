// pages/index.tsx
import { useUser, useSignIn } from "@clerk/clerk-react";
import AuthModal from "@/components/auth/AuthModal";
import MainLayout from "@/components/layout/MainLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { useState } from "react";

const Index = () => {
  const { isSignedIn } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleLogout = async () => {
    window.location.href = "/sign-out"; // Clerk handles logout routing
  };

  const handleGetStarted = () => {
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen relative">
      {!isSignedIn ? (
        <>
          {/* Blurred Dashboard Preview */}
          <div
            className="absolute inset-0 blur-[25px] opacity-30"
            style={{
              background:
                "linear-gradient(135deg, #000000 0%, #001122 50%, #002244 100%)",
            }}
          >
            <div className="p-8">
              <div className="h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl"
                  ></div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-96 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl"></div>
                <div className="h-96 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl"></div>
              </div>
            </div>
          </div>

          {/* Authentication Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-85 flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-8">
              <div className="w-20 h-20 mx-auto relative">
                <svg
                  className="w-20 h-20 text-cyan-400 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <div className="absolute inset-0 w-20 h-20 bg-cyan-400 opacity-20 rounded-full animate-ping"></div>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-4">
              Secure Medical Portal
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Authentication Required
            </p>
            <p className="text-sm text-gray-400 mb-6">
              HIPAA Compliant • End-to-End Encrypted • Medical Professional
              Access Only
            </p>

            <button
              onClick={handleGetStarted}
              className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-700 text-white font-semibold text-lg transition-all duration-200"
            >
              Get Started
            </button>
          </div>

          {/* Auth Modal (optional for custom UI, otherwise Clerk handles auth redirect) */}
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthenticate={() => {
              // Clerk will automatically handle session state.
              setShowAuthModal(false);
            }}
          />
        </>
      ) : (
        <MainLayout onLogout={handleLogout}>
          <DashboardOverview />
        </MainLayout>
      )}
    </div>
  );
};

export default Index;
