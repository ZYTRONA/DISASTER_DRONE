import { useState, useEffect } from "react";
import {
  Activity,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  Gauge,
  Cpu,
  Database,
  Map,
  Helicopter,
  Plug,
} from "lucide-react";
import { useRequests } from "../context/RequestsContext";
import { api } from "../services/api";
import toast from "react-hot-toast";

function StatCard({ title, value, icon: Icon, color, trend, subtext }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(47, 143, 182, 0.08), rgba(29, 106, 135, 0.04))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(47, 143, 182, 0.15)",
        borderRadius: "16px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "0 10px 30px rgba(47, 143, 182, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
        transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-8px)";
        e.currentTarget.style.boxShadow = "0 20px 50px rgba(47, 143, 182, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)";
        e.currentTarget.style.borderColor = "rgba(47, 143, 182, 0.25)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(47, 143, 182, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
        e.currentTarget.style.borderColor = "rgba(47, 143, 182, 0.15)";
      }}
    >
      {/* Gradient Accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: `radial-gradient(circle, ${color}10, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(40px)",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700, marginBottom: "8px" }}>
            {title}
          </div>
          <div style={{ fontSize: "48px", fontWeight: 900, background: `linear-gradient(135deg, ${color}, ${color}cc)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {value}
          </div>
          {subtext && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>{subtext}</div>}
        </div>
        <div
          style={{
            width: "56px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `${color}15`,
            borderRadius: "12px",
            border: `1px solid ${color}30`,
          }}
        >
          <Icon size={28} color={color} />
        </div>
      </div>

      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: trend > 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>
          <TrendingUp size={14} />
          {trend > 0 ? "+" : ""}{trend}% from last week
        </div>
      )}
    </div>
  );
}

function RecentRequests({ requests }) {
  const recent = requests.slice(0, 8);

  const statusColors = {
    Pending: "#d9a441",
    Assigned: "#247b9f",
    "In Transit": "#b84b2a",
    Delivered: "#2f9e73",
    UserConfirmed: "#2f9e73",
    Urgent: "#ba3a32",
    Critical: "#ba3a32",
  };

  const getStatusGradient = (status) => {
    const gradients = {
      Pending: "rgba(217, 164, 65, 0.08)",
      Assigned: "rgba(47, 143, 182, 0.08)",
      "In Transit": "rgba(217, 95, 58, 0.08)",
      Delivered: "rgba(47, 158, 115, 0.08)",
      UserConfirmed: "rgba(47, 158, 115, 0.08)",
      Urgent: "rgba(217, 74, 63, 0.08)",
      Critical: "rgba(217, 74, 63, 0.08)",
    };
    return gradients[status] || "rgba(47, 143, 182, 0.08)";
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(47, 143, 182, 0.06), rgba(29, 106, 135, 0.02))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(47, 143, 182, 0.1)",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(47, 143, 182, 0.08)",
          fontSize: "14px",
          fontWeight: 800,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
        }}
      >
        <Clock size={18} color="#b84b2a" />
        Active Requests
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        {recent.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)" }}>No active requests</div>
        ) : (
          recent.map((req, idx) => (
            <div
              key={req.id}
              style={{
                padding: "12px",
                marginBottom: "8px",
                background: getStatusGradient(req.status),
                border: `1px solid rgba(47, 143, 182, 0.1)`,
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = getStatusGradient(req.status).replace("0.08", "0.12");
                e.currentTarget.style.borderColor = "rgba(47, 143, 182, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = getStatusGradient(req.status);
                e.currentTarget.style.borderColor = "rgba(47, 143, 182, 0.1)";
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Package size={14} />
                  {req.resource}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span>ID: #{req.id?.toString().slice(-4).toUpperCase()}</span>
                  {req.note && <span>•</span>}
                  {req.note && <span>{req.note.substring(0, 30)}...</span>}
                </div>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 10px",
                  background: statusColors[req.status] || "#2f8fb6",
                  color: "#ffffff",
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                  marginLeft: "12px",
                }}
              >
                {req.status}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SystemStatus({ connected }) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, rgba(29, 106, 135, 0.06), rgba(217, 95, 58, 0.03))",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(29, 106, 135, 0.1)",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: 800, marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <Zap size={18} color="#1d6a87" />
        System Status
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[
          { name: "Backend Connection", status: connected, icon: Plug },
          { name: "Database", status: true, icon: Database },
          { name: "Live Map", status: true, icon: Map },
          { name: "Drone Network", status: true, icon: Helicopter },
        ].map((item) => {
          const IconComponent = item.icon;
          return (
            <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", background: "rgba(47, 143, 182, 0.03)", borderRadius: "8px", border: "1px solid rgba(47, 143, 182, 0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <IconComponent size={18} color="#b84b2a" />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{item.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: item.status ? "#2f9e73" : "#ba3a32",
                    boxShadow: item.status ? "0 0 12px #2f9e73" : "0 0 12px #ba3a32",
                    animation: "pulse 2s infinite",
                  }}
                />
                <span style={{ fontSize: "11px", color: item.status ? "#2f9e73" : "#ba3a32", fontWeight: 700 }}>{item.status ? "Active" : "Down"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { requests, loading } = useRequests();
  const [connected, setConnected] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, urgent: 0, assigned: 0 });

  useEffect(() => {
    async function checkConnection() {
      try {
        await api.getTelemetry();
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }
    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newStats = {
      total: requests.length,
      active: requests.filter((r) => r.status !== "Delivered" && r.status !== "UserConfirmed").length,
      delivered: requests.filter((r) => r.status === "Delivered" || r.status === "UserConfirmed").length,
      urgent: requests.filter((r) => r.status === "Urgent" || r.urgency === "Critical").length,
      assigned: requests.filter((r) => r.status === "Assigned").length,
    };
    setStats(newStats);
  }, [requests]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(47, 143, 182, 0.2)",
            borderTop: "3px solid #2f8fb6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", overflowY: "auto", height: "100%", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "8px" }}>Dashboard</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Real-time overview of disaster response operations</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <StatCard title="Total Requests" value={stats.total} icon={Package} color="#2f8fb6" trend={12} subtext="Across all operations" />
        <StatCard title="Active Requests" value={stats.active} icon={Activity} color="#d9a441" trend={-5} subtext="Pending completion" />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle2} color="#2f9e73" trend={18} subtext="Successfully completed" />
        <StatCard title="Urgent" value={stats.urgent} icon={AlertTriangle} color="#d94a3f" subtext="Require immediate attention" />
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px", marginBottom: "32px" }}>
        <RecentRequests requests={requests} />
        <SystemStatus connected={connected} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
