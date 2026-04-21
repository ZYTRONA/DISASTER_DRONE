import { LayoutDashboard, Map, History, Radio, Zap, Menu, X, Gamepad2 } from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "requests", label: "Live Requests", icon: Zap },
  { id: "map", label: "Live Map", icon: Map },
  { id: "operations", label: "Drone Ops", icon: Gamepad2 },
  { id: "history", label: "History", icon: History },
];

export default function Sidebar({ activeView, setActiveView, connected, isCollapsed, onToggleCollapse }) {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <Radio size={24} />
          {!isCollapsed && <span>NDRF GCS</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => setActiveView(item.id)}
              title={isCollapsed ? item.label : ""}
            >
              <Icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className={`connection-status ${connected ? "online" : "offline"}`}>
          <div className="status-dot" />
          {!isCollapsed && <span>{connected ? "Connected" : "Offline"}</span>}
        </div>
      </div>
    </aside>
  );
}
