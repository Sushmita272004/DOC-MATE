import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: "🏠", badge: null, path: "/" },
    { id: "patients", label: "Patient Management", icon: "🧑‍⚕️", badge: "5", path: "/patients" },
    { id: "prescriptions", label: "AI Prescriptions", icon: "💊", badge: "3", path: "/prescriptions" },
    { id: "analytics", label: "Analytics", icon: "📊", badge: "new", path: "/analytics" },
    { id: "settings", label: "Settings", icon: "⚙️", badge: "1", path: "/settings" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const sidebarStyle: React.CSSProperties = {
    width: isCollapsed ? "64px" : "240px",
    height: "100vh",
    background: isDark ? "#121a24" : "#f9f9f9",
    color: isDark ? "#cfd8dc" : "#333",
    borderRight: `1px solid ${isDark ? "#2a3548" : "#ccc"}`,
    transition: "width 0.3s ease",
    display: "flex",
    flexDirection: "column",
  };

  const headerStyle: React.CSSProperties = {
    padding: "16px",
    borderBottom: `1px solid ${isDark ? "#2a3548" : "#ccc"}`,
    display: "flex",
    justifyContent: isCollapsed ? "center" : "space-between",
    alignItems: "center",
  };

  const navStyle: React.CSSProperties = {
    flex: 1,
    padding: "8px",
  };

  const buttonStyle = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    width: "100%",
    border: "none",
    background: isActive
      ? isDark
        ? "rgba(29, 39, 53, 1)"
        : "#d0e2ff"
      : "transparent",
    color: isActive
      ? isDark
        ? "#30cfd0"
        : "#003366"
      : isDark
      ? "#cfd8dc"
      : "#333",
    padding: "10px 12px",
    marginBottom: "6px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background 0.2s ease, color 0.2s ease",
  });

  const hoverStyle = {
    backgroundColor: isDark ? "#2a3548" : "#e3f2fd",
  };

  const badgeStyle = {
    marginLeft: "auto",
    fontSize: "11px",
    padding: "2px 6px",
    borderRadius: "12px",
    backgroundColor: "#e53935",
    color: "#fff",
  };

  return (
    <div style={sidebarStyle}>
      {/* Collapse Toggle */}
      <div style={headerStyle}>
        {!isCollapsed && <h2 style={{ fontSize: "16px" }}>Menu</h2>}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: isDark ? "#cfd8dc" : "#555",
          }}
        >
          ☰
        </button>
      </div>

      {/* Navigation */}
      <div style={navStyle}>
        {navigationItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.id === "dashboard" && location.pathname === "/");

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              style={{
                ...buttonStyle(isActive),
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = hoverStyle.backgroundColor;
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = isActive
                  ? isDark
                    ? "rgba(29, 39, 53, 1)"
                    : "#d0e2ff"
                  : "transparent";
              }}
            >
              <span style={{ marginRight: isCollapsed ? "0" : "12px" }}>{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span>{item.label}</span>
                  {item.badge && (
                    <span style={{ ...badgeStyle, backgroundColor: item.badge === "new" ? "#43a047" : "#e53935" }}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
