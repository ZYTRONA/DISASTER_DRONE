import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { RequestsProvider, useRequests } from "./context/RequestsContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import LiveRequests from "./pages/LiveRequests";
import History from "./pages/History";
import DroneOperations from "./pages/DroneOperations";
import "./App.css";

function AppContent() {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { connected } = useRequests();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "map":
        return <LiveMap />;
      case "requests":
        return <LiveRequests />;
      case "operations":
        return <DroneOperations />;
      case "history":
        return <History />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app">
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        connected={connected}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <main className="main-content">{renderView()}</main>
    </div>
  );
}

export default function App() {
  return (
    <RequestsProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(249, 244, 233, 0.94))",
            color: "#1f2f3d",
            border: "1px solid rgba(217, 95, 58, 0.24)",
            boxShadow: "0 14px 30px rgba(31, 47, 61, 0.14)",
            fontFamily: "Manrope, sans-serif",
          },
          success: {
            iconTheme: {
              primary: "#2f9e73",
              secondary: "#ffffff",
            },
          },
          error: {
            iconTheme: {
              primary: "#d94a3f",
              secondary: "#ffffff",
            },
          },
        }}
      />
      <AppContent />
    </RequestsProvider>
  );
}
