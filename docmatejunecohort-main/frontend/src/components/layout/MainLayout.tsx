import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
  onLogout: () => void; // 👈 Add this
}

const MainLayout = ({ children, onLogout }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col dark:bg-gradient-to-b dark:from-black dark:to-gray-900 light:bg-gradient-to-b light:from-cream-50 light:to-cream-100">
      <Header onLogout={onLogout} /> {/* 👈 Pass it to Header */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default MainLayout;
