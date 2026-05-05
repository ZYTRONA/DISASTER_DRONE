import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle,
  Clipboard,
  Clock,
  Filter,
  Hourglass,
  MapPin,
  Package,
  Pill,
  Search,
  Tent,
  User,
  Utensils,
  X,
} from "lucide-react";
import { useRequests } from "../context/RequestsContext";
import toast from "react-hot-toast";

const palette = {
  accent: "#0066cc",
  accentDark: "#004a99",
  success: "#16a34a",
  warning: "#ea8c55",
  danger: "#dc2626",
  neutral: "#64748b",
};

const statusTheme = {
  Pending: { color: palette.warning, bg: "rgba(234, 140, 85, 0.1)", label: "Pending" },
  Assigned: { color: palette.accent, bg: "rgba(0, 102, 204, 0.1)", label: "Assigned" },
  "In Transit": { color: "#0891b2", bg: "rgba(8, 145, 178, 0.1)", label: "In Transit" },
  Delivered: { color: palette.success, bg: "rgba(22, 163, 74, 0.1)", label: "Delivered" },
  UserConfirmed: { color: palette.success, bg: "rgba(22, 163, 74, 0.1)", label: "Confirmed" },
  Urgent: { color: palette.danger, bg: "rgba(220, 38, 38, 0.1)", label: "Urgent" },
  Critical: { color: palette.danger, bg: "rgba(220, 38, 38, 0.1)", label: "Critical" },
};

const getRequestTime = (request) => request.timestamp || request.created_at || request.updated_at;
const getTheme = (status) => statusTheme[status] || { color: palette.neutral, bg: "rgba(100, 116, 139, 0.1)", label: status || "Unknown" };

function formatRequestDate(value, mode = "date") {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";

  if (mode === "datetime") {
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getLocationText(request) {
  return [request.district, request.state].filter(Boolean).join(", ") || "Location not available";
}

function getRequestItems(request) {
  if (Array.isArray(request.cart_items) && request.cart_items.length > 0) {
    return request.cart_items;
  }

  if (request.resource) {
    return [{ name: request.resource, quantity: request.quantity }];
  }

  return [];
}

function StatusBadge({ status, compact = false }) {
  const theme = getTheme(status);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: compact ? "auto" : "96px",
        padding: compact ? "5px 9px" : "7px 11px",
        background: theme.bg,
        color: theme.color,
        border: `1px solid ${theme.color}33`,
        borderRadius: "6px",
        fontSize: compact ? "10px" : "11px",
        fontWeight: 800,
        whiteSpace: "nowrap",
      }}
    >
      {theme.label}
    </span>
  );
}

function ResourceIcon({ resource, color = palette.accent }) {
  if (resource === "Food") return <Utensils size={20} color={color} />;
  if (resource === "Medical") return <Pill size={20} color={color} />;
  if (resource === "Shelter") return <Tent size={20} color={color} />;
  return <Package size={20} color={color} />;
}

function DetailLine({ icon: Icon, label, value, color = palette.accent }) {
  if (!value) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "14px",
        background: `${color}0f`,
        border: `1px solid ${color}24`,
        borderRadius: "10px",
      }}
    >
      <Icon size={18} color={color} />
      <div>
        <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
          {label}
        </div>
        <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 650, marginTop: "3px" }}>{value}</div>
      </div>
    </div>
  );
}

export default function History() {
  const { requests, loading } = useRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedRequest, setSelectedRequest] = useState(null);

  const filtered = useMemo(() => {
    let next = [...requests];
    const query = search.toLowerCase().trim();

    if (query) {
      next = next.filter((request) =>
        [
          request.resource,
          request.note,
          request.id?.toString(),
          request.status,
          request.state,
          request.district,
          request.disaster_type,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== "all") {
      next = next.filter((request) => request.status === statusFilter);
    }

    next.sort((a, b) => {
      const aTime = new Date(getRequestTime(a) || 0).getTime();
      const bTime = new Date(getRequestTime(b) || 0).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });

    return next;
  }, [requests, search, statusFilter, sortBy]);

  const deliveredCount = requests.filter((request) => request.status === "Delivered" || request.status === "UserConfirmed").length;
  const activeCount = requests.length - deliveredCount;
  const successRate = requests.length > 0 ? Math.round((deliveredCount / requests.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(0, 102, 204, 0.18)",
            borderTop: "3px solid #0066cc",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading request history...</span>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", overflowY: "auto", height: "100%", background: "var(--bg-primary)" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, color: "var(--text-primary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "12px" }}>
          <Calendar size={32} color={palette.accent} />
          Request History
        </h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
          {requests.length} total requests - <strong style={{ color: palette.success }}>{deliveredCount}</strong> completed - <strong style={{ color: palette.warning }}>{activeCount}</strong> active
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total Requests", value: requests.length, Icon: Package, color: palette.accent },
          { label: "Completed", value: deliveredCount, Icon: CheckCircle, color: palette.success },
          { label: "Active", value: activeCount, Icon: Hourglass, color: palette.warning },
          { label: "Success Rate", value: `${successRate}%`, Icon: BarChart3, color: "#0891b2" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "linear-gradient(135deg, rgba(0, 102, 204, 0.06), rgba(0, 102, 204, 0.02))",
              border: "1px solid rgba(0, 102, 204, 0.1)",
              borderRadius: "10px",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              boxShadow: "0 4px 12px rgba(0, 102, 204, 0.08)",
            }}
          >
            <div style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: `${stat.color}14`, borderRadius: "10px", border: `1px solid ${stat.color}2e` }}>
              <stat.Icon size={24} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>{stat.label}</div>
              <div style={{ fontSize: "24px", fontWeight: 900, color: stat.color }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "260px", display: "flex", alignItems: "center", gap: "12px", background: "var(--bg-card)", border: "1px solid rgba(0, 102, 204, 0.14)", borderRadius: "8px", padding: "12px 14px", color: "var(--text-muted)" }}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search resource, ID, location, disaster, or note"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "13px", outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "rgba(0, 102, 204, 0.1)", border: "none", borderRadius: "6px", padding: "4px", cursor: "pointer", display: "flex" }}>
              <X size={14} color={palette.accent} />
            </button>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid rgba(0, 102, 204, 0.14)", borderRadius: "8px", padding: "9px 12px", color: "var(--text-muted)" }}>
          <Filter size={16} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "13px", outline: "none", cursor: "pointer" }}>
            <option value="all">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Assigned">Assigned</option>
            <option value="In Transit">In Transit</option>
            <option value="Delivered">Delivered</option>
            <option value="UserConfirmed">Confirmed</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid rgba(0, 102, 204, 0.14)", borderRadius: "8px", padding: "9px 12px", color: "var(--text-muted)" }}>
          <Clock size={16} />
          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} style={{ background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "13px", outline: "none", cursor: "pointer" }}>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid rgba(0, 102, 204, 0.12)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 4px 12px rgba(0, 102, 204, 0.08)" }}>
        <div className="request-history-grid history-heading" style={{ padding: "14px 18px", borderBottom: "1px solid rgba(0, 102, 204, 0.1)", background: "rgba(0, 102, 204, 0.04)", fontWeight: 800, fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>
          <span>Resource</span>
          <span>Location / Details</span>
          <span>Status</span>
          <span>Requested</span>
          <span>Action</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.28, color: "var(--text-muted)" }} />
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No requests found matching your filters</p>
          </div>
        ) : (
          filtered.map((request) => {
            const theme = getTheme(request.status);
            return (
              <div key={request.id} className="request-history-grid history-row">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div style={{ width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0, 102, 204, 0.1)", border: "1px solid rgba(0, 102, 204, 0.14)", borderRadius: "8px", flexShrink: 0 }}>
                    <ResourceIcon resource={request.resource} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{request.resource || "Resource"}</div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>#{request.id?.toString().slice(-6).toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 650, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <MapPin size={14} color={palette.accent} />
                    {getLocationText(request)}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {request.disaster_type || request.note || "No extra details recorded"}
                  </div>
                </div>

                <StatusBadge status={request.status} />

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <Clock size={14} color={theme.color} />
                  {formatRequestDate(getRequestTime(request))}
                </div>

                <button
                  onClick={() => setSelectedRequest(request)}
                  style={{
                    justifySelf: "end",
                    background: "rgba(0, 102, 204, 0.1)",
                    border: "1px solid rgba(0, 102, 204, 0.22)",
                    color: palette.accent,
                    padding: "7px 12px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  View
                </button>
              </div>
            );
          })
        )}
      </div>

      {selectedRequest && (
        <div className="history-modal-shell" onClick={() => setSelectedRequest(null)}>
          <div className="history-modal" onClick={(event) => event.stopPropagation()}>
            <div style={{ padding: "22px 24px", borderBottom: "1px solid rgba(0, 102, 204, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div style={{ width: "48px", height: "48px", background: getTheme(selectedRequest.status).color, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ResourceIcon resource={selectedRequest.resource} color="#ffffff" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>{selectedRequest.resource || "Request"}</h2>
                  <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Request #{selectedRequest.id?.toString().slice(-8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedRequest(null)} style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.22)", borderRadius: "8px", padding: "8px", cursor: "pointer", display: "flex" }}>
                <X size={20} color={palette.danger} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{ marginBottom: "22px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <StatusBadge status={selectedRequest.status} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{formatRequestDate(getRequestTime(selectedRequest), "datetime")}</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <DetailLine icon={MapPin} label="Location" value={getLocationText(selectedRequest)} />
                <DetailLine icon={User} label="People Affected" value={selectedRequest.people_affected} color={palette.danger} />
                <DetailLine icon={AlertTriangle} label="Disaster Type" value={selectedRequest.disaster_type} color={palette.warning} />
                <DetailLine icon={Clock} label="Requested At" value={formatRequestDate(getRequestTime(selectedRequest), "datetime")} color="#0891b2" />
                {selectedRequest.note && (
                  <div style={{ padding: "14px", background: "rgba(0, 102, 204, 0.06)", borderRadius: "10px", border: "1px solid rgba(0, 102, 204, 0.14)" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800, marginBottom: "8px" }}>Note</div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: 1.6 }}>{selectedRequest.note}</div>
                  </div>
                )}
              </div>

              {getRequestItems(selectedRequest).length > 0 && (
                <div style={{ marginTop: "24px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase" }}>
                    Requested Items ({getRequestItems(selectedRequest).length})
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {getRequestItems(selectedRequest).map((item, index) => (
                      <div key={`${item.name || item}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "rgba(0, 102, 204, 0.05)", border: "1px solid rgba(0, 102, 204, 0.1)", borderRadius: "8px" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{item.name || item}</span>
                        {item.quantity && <span style={{ fontSize: "12px", fontWeight: 800, color: palette.accent, background: "rgba(0, 102, 204, 0.1)", padding: "4px 10px", borderRadius: "6px" }}>x{item.quantity}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedRequest.lat && selectedRequest.lon && (
                <div style={{ marginTop: "24px" }}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase" }}>
                    GPS Coordinates
                  </label>
                  <div style={{ padding: "12px", background: "rgba(22, 163, 74, 0.06)", border: "1px solid rgba(22, 163, 74, 0.16)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                    <code style={{ fontSize: "12px", color: palette.success, overflowWrap: "anywhere" }}>
                      {selectedRequest.lat.toFixed(6)}, {selectedRequest.lon.toFixed(6)}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${selectedRequest.lat}, ${selectedRequest.lon}`);
                        toast.success("Coordinates copied!", { icon: <Clipboard size={16} /> });
                      }}
                      style={{ background: "rgba(22, 163, 74, 0.12)", border: "1px solid rgba(22, 163, 74, 0.26)", borderRadius: "6px", padding: "6px 10px", cursor: "pointer", fontSize: "10px", fontWeight: 800, color: palette.success }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(0, 102, 204, 0.1)" }}>
              <button onClick={() => setSelectedRequest(null)} style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentDark})`, border: "none", borderRadius: "8px", color: "#ffffff", fontSize: "13px", fontWeight: 800, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .request-history-grid {
          display: grid;
          grid-template-columns: minmax(150px, 1fr) minmax(220px, 1.6fr) minmax(110px, 0.8fr) minmax(130px, 0.8fr) minmax(76px, 0.4fr);
          gap: 16px;
          align-items: center;
        }

        .history-row {
          padding: 15px 18px;
          border-bottom: 1px solid rgba(0, 102, 204, 0.08);
          transition: background 0.2s ease, border-color 0.2s ease;
        }

        .history-row:hover {
          background: rgba(0, 102, 204, 0.04);
        }

        .history-row:last-child {
          border-bottom: none;
        }

        .history-modal-shell {
          position: fixed;
          inset: 0;
          background: rgba(15, 20, 25, 0.34);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          animation: fadeIn 0.2s ease-out;
        }

        .history-modal {
          background: #ffffff;
          border: 1px solid rgba(0, 102, 204, 0.14);
          border-radius: 12px;
          max-width: 560px;
          width: 100%;
          max-height: 84vh;
          overflow-y: auto;
          box-shadow: 0 30px 80px rgba(15, 20, 25, 0.18);
          animation: slideUp 0.25s ease-out;
        }

        @media (max-width: 920px) {
          .history-heading {
            display: none;
          }

          .request-history-grid.history-row {
            grid-template-columns: 1fr;
            gap: 10px;
            align-items: start;
          }

          .history-row button {
            justify-self: stretch !important;
          }
        }

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
            transform: translateY(24px) scale(0.98);
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
