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
          <div style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: '#0066cc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,102,204,0.3)' }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1 }}>Z</span>
          </div>
          {!isCollapsed && <span>zydro</span>}
        </div>
        {!isCollapsed && (
          <button
            className="sidebar-toggle"
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
          >
            <X size={20} />
          </button>
        )}
        {isCollapsed && (
          <button
            className="sidebar-toggle"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            style={{ marginTop: 8 }}
          >
            <Menu size={20} />
          </button>
        )}
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
