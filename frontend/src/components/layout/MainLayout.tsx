import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

const MainLayout = ({
  children,
  onLogout,
}: MainLayoutProps) => {

  return (

    <div className="
      min-h-screen
      flex
      flex-col
      bg-[#F4F7FB]
    ">

      {/* Header */}
      <Header onLogout={onLogout} />

      {/* Main Content */}
      <div className="flex flex-1">

        <Sidebar />
      
        {/* Page Content */}
        <main className="
          flex-1
          p-6
          overflow-y-auto
        ">
          {children}
        </main>

      </div>

      {/* Footer */}
      <Footer />

    </div>

  );

};

export default MainLayout;