import { useState, useEffect } from "react";
import { Search, Filter, Package, MapPin, Clock, ChevronDown, Calendar, TrendingUp, X, User, AlertTriangle, Navigation, BarChart3, CheckCircle, Hourglass, Utensils, Pill, Tent, Clipboard } from "lucide-react";
import { useRequests } from "../context/RequestsContext";
import toast from "react-hot-toast";

export default function History() {
  const { requests, loading } = useRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const statusColors = {
    Pending: "#fcd34d",
    Assigned: "#60a5fa",
    "In Transit": "#a78bfa",
    Delivered: "#34d399",
    UserConfirmed: "#34d399",
    Urgent: "#f87171",
    Critical: "#f87171",
  };

  const statusBgGradients = {
    Pending: "rgba(252, 211, 77, 0.12)",
    Assigned: "rgba(96, 165, 250, 0.12)",
    "In Transit": "rgba(167, 139, 250, 0.12)",
    Delivered: "rgba(52, 211, 153, 0.12)",
    UserConfirmed: "rgba(52, 211, 153, 0.12)",
    Urgent: "rgba(248, 113, 113, 0.12)",
    Critical: "rgba(248, 113, 113, 0.12)",
  };

  // Filter and sort requests
  let filtered = [...requests];

  if (search) {
    const query = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.resource?.toLowerCase().includes(query) ||
        r.note?.toLowerCase().includes(query) ||
        r.id?.toString().includes(query)
    );
  }

  if (statusFilter !== "all") {
    filtered = filtered.filter((r) => r.status === statusFilter);
  }

  if (sortBy === "newest") {
    filtered.sort((a, b) => new Date(b.timestamp || b.created_at) - new Date(a.timestamp || a.created_at));
  } else if (sortBy === "oldest") {
    filtered.sort((a, b) => new Date(a.timestamp || a.created_at) - new Date(b.timestamp || b.created_at));
  }

  const deliveredCount = requests.filter((r) => r.status === "Delivered" || r.status === "UserConfirmed").length;
  const pendingCount = requests.filter((r) => r.status !== "Delivered" && r.status !== "UserConfirmed").length;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(167, 139, 250, 0.2)",
            borderTop: "3px solid #a78bfa",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading history...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", overflowY: "auto", minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Calendar size={32} color="#a78bfa" />
          Request History
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          Total: <strong>{requests.length}</strong> requests • <strong style={{ color: "#34d399" }}>{deliveredCount}</strong> delivered • <strong style={{ color: "#f87171" }}>{pendingCount}</strong> pending
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {[
          { label: "Total Requests", value: requests.length, Icon: Package, color: "#60a5fa" },
          { label: "Completed", value: deliveredCount, Icon: CheckCircle, color: "#34d399" },
          { label: "In Progress", value: pendingCount, Icon: Hourglass, color: "#fcd34d" },
          { label: "Success Rate", value: requests.length > 0 ? Math.round((deliveredCount / requests.length) * 100) + "%" : "0%", Icon: BarChart3, color: "#a78bfa" },
        ].map((stat, idx) => (
          <div
            key={idx}
            style={{
              background: "linear-gradient(135deg, rgba(167, 139, 250, 0.08), rgba(6, 182, 212, 0.04))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(167, 139, 250, 0.15)",
              borderRadius: "12px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              transition: "all 0.3s ease",
            }}
          >
            <div style={{
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: `${stat.color}15`,
              borderRadius: "10px",
              border: `1px solid ${stat.color}30`,
            }}>
              <stat.Icon size={24} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{stat.label}</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: stat.color }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: 1,
            minWidth: "250px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(6, 182, 212, 0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            borderRadius: "10px",
            padding: "12px 16px",
            color: "var(--text-muted)",
          }}
        >
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by resource, note, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(6, 182, 212, 0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            borderRadius: "10px",
            padding: "8px 14px",
            color: "var(--text-muted)",
          }}
        >
          <Filter size={16} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="UserConfirmed">Confirmed</option>
          </select>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(6, 182, 212, 0.02))",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            borderRadius: "10px",
            padding: "8px 14px",
            color: "var(--text-muted)",
          }}
        >
          <Clock size={16} />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-primary)",
              fontSize: "13px",
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(6, 182, 212, 0.02))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(167, 139, 250, 0.15)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Table Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.5fr 1fr 1fr 0.8fr",
            gap: "16px",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(167, 139, 250, 0.1)",
            background: "rgba(167, 139, 250, 0.05)",
            fontWeight: 700,
            fontSize: "12px",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          <span>Resource</span>
          <span>Details</span>
          <span>Status</span>
          <span>Date</span>
          <span>Action</span>
        </div>

        {/* Table Body */}
        <div>
          {filtered.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No requests found matching your filters</p>
            </div>
          ) : (
            filtered.map((request, idx) => (
              <div
                key={request.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1.5fr 1fr 1fr 0.8fr",
                  gap: "16px",
                  padding: "16px 20px",
                  borderBottom: "1px solid rgba(167, 139, 250, 0.08)",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                  background: idx % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(167, 139, 250, 0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = idx % 2 === 0 ? "rgba(255, 255, 255, 0.01)" : "transparent";
                }}
              >
                {/* Resource */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Package size={16} color="#a78bfa" />
                  <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>{request.resource}</span>
                </div>

                {/* Details */}
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  <div>ID: #{request.id?.toString().slice(-6).toUpperCase()}</div>
                  {request.note && <div style={{ marginTop: "2px", opacity: 0.7 }}>{request.note.substring(0, 50)}{request.note.length > 50 ? "..." : ""}</div>}
                </div>

                {/* Status */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "6px 10px",
                      background: statusBgGradients[request.status] || "rgba(124, 139, 201, 0.12)",
                      color: statusColors[request.status] || "#7c8bc9",
                      borderRadius: "6px",
                      border: `1px solid ${statusColors[request.status]}30` || "rgba(124, 139, 201, 0.3)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {request.status}
                  </span>
                </div>

                {/* Date */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <Clock size={14} />
                  {new Date(request.timestamp || request.created_at).toLocaleDateString("en-IN")}
                </div>

                {/* Action */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setSelectedRequest(request)}
                    style={{
                      background: "rgba(167, 139, 250, 0.15)",
                      border: "1px solid rgba(167, 139, 250, 0.3)",
                      color: "#a78bfa",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(167, 139, 250, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(167, 139, 250, 0.15)";
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 14, 39, 0.9)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: "20px",
            animation: "fadeIn 0.2s ease-out",
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(26, 31, 58, 0.98), rgba(37, 45, 72, 0.98))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(167, 139, 250, 0.3)",
              borderRadius: "20px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: "0 30px 80px rgba(0, 0, 0, 0.5)",
              animation: "slideUp 0.3s ease-out",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", background: statusColors[selectedRequest.status], borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selectedRequest.resource === "Food" ? (
                    <Utensils size={24} color="white" />
                  ) : selectedRequest.resource === "Medical" ? (
                    <Pill size={24} color="white" />
                  ) : selectedRequest.resource === "Shelter" ? (
                    <Tent size={24} color="white" />
                  ) : (
                    <Package size={24} color="white" />
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>{selectedRequest.resource}</h2>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Request #{selectedRequest.id?.toString().slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  background: "rgba(248, 113, 113, 0.15)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  borderRadius: "8px",
                  padding: "8px",
                  cursor: "pointer",
                }}
              >
                <X size={20} color="#f87171" />
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: "24px" }}>
              {/* Status Badge */}
              <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "8px 16px",
                    background: statusBgGradients[selectedRequest.status] || "rgba(124, 139, 201, 0.12)",
                    color: statusColors[selectedRequest.status] || "#7c8bc9",
                    borderRadius: "8px",
                    border: `1px solid ${statusColors[selectedRequest.status]}50`,
                  }}
                >
                  {selectedRequest.status}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  {new Date(selectedRequest.timestamp || selectedRequest.created_at).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Details Grid */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedRequest.state && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "rgba(167, 139, 250, 0.05)", borderRadius: "10px", border: "1px solid rgba(167, 139, 250, 0.1)" }}>
                    <MapPin size={18} color="#a78bfa" />
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>State</div>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, marginTop: "2px" }}>{selectedRequest.state}</div>
                    </div>
                  </div>
                )}

                {selectedRequest.people_affected && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "rgba(248, 113, 113, 0.05)", borderRadius: "10px", border: "1px solid rgba(248, 113, 113, 0.1)" }}>
                    <User size={18} color="#f87171" />
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>People Affected</div>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, marginTop: "2px" }}>{selectedRequest.people_affected}</div>
                    </div>
                  </div>
                )}

                {selectedRequest.disaster_type && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "rgba(252, 211, 77, 0.05)", borderRadius: "10px", border: "1px solid rgba(252, 211, 77, 0.1)" }}>
                    <AlertTriangle size={18} color="#fcd34d" />
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Disaster Type</div>
                      <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, marginTop: "2px" }}>{selectedRequest.disaster_type}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px", background: "rgba(6, 182, 212, 0.05)", borderRadius: "10px", border: "1px solid rgba(6, 182, 212, 0.1)" }}>
                  <Clock size={18} color="#06b6d4" />
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Requested At</div>
                    <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, marginTop: "2px" }}>
                      {new Date(selectedRequest.timestamp || selectedRequest.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {selectedRequest.note && (
                  <div style={{ padding: "14px", background: "rgba(167, 139, 250, 0.05)", borderRadius: "10px", border: "1px solid rgba(167, 139, 250, 0.1)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Note</div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.6" }}>{selectedRequest.note}</div>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              {selectedRequest.cart_items && selectedRequest.cart_items.length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Requested Items ({selectedRequest.cart_items.length})
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedRequest.cart_items.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "12px",
                          background: "rgba(167, 139, 250, 0.05)",
                          border: "1px solid rgba(167, 139, 250, 0.1)",
                          borderRadius: "10px",
                        }}
                      >
                        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{item.name || item}</span>
                        {item.quantity && (
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#a78bfa", background: "rgba(167, 139, 250, 0.15)", padding: "4px 10px", borderRadius: "6px" }}>
                            x{item.quantity}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* GPS Coordinates */}
              {selectedRequest.lat && selectedRequest.lon && (
                <div style={{ marginTop: "24px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    GPS Coordinates
                  </label>
                  <div style={{ padding: "12px", background: "rgba(52, 211, 153, 0.05)", border: "1px solid rgba(52, 211, 153, 0.15)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <code style={{ fontSize: "12px", color: "#34d399" }}>
                      {selectedRequest.lat.toFixed(6)}, {selectedRequest.lon.toFixed(6)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${selectedRequest.lat}, ${selectedRequest.lon}`);
                        toast.success("Coordinates copied!", { icon: <Clipboard size={16} /> });
                      }}
                      style={{
                        background: "rgba(52, 211, 153, 0.15)",
                        border: "1px solid rgba(52, 211, 153, 0.3)",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#34d399",
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "24px", borderTop: "1px solid rgba(167, 139, 250, 0.15)" }}>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
