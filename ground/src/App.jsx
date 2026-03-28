import { useState } from "react";
import { Toaster } from "react-hot-toast";
import { RequestsProvider, useRequests } from "./context/RequestsContext";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import LiveMap from "./pages/LiveMap";
import LiveRequests from "./pages/LiveRequests";
import History from "./pages/History";
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
      <Toaster position="bottom-right" />
      <AppContent />
    </RequestsProvider>
  );
}
