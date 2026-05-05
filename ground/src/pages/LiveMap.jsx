import { useState } from "react";
import { MapPin, X, Package, Clock, User } from "lucide-react";
import { useRequests } from "../context/RequestsContext";
import RequestMap from "../components/Map";
import { formatDateTime } from "../utils/dateTime";

function RequestDetails({ request, onClose, onUpdateStatus }) {
  if (!request) return null;

  const statusOptions = ["Pending", "Assigned", "In Transit", "Delivered"];

  const statusColors = {
    Pending: "#d9a441",
    Assigned: "#247b9f",
    "In Transit": "#b84b2a",
    Delivered: "#2f9e73",
    Urgent: "#ba3a32",
  };

  return (
    <div className="request-details-panel">
      <div className="panel-header">
        <h3>Request Details</h3>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="panel-content">
        <div className="detail-row">
          <Package size={18} />
          <div>
            <label>Resource</label>
            <span>{request.resource}</span>
          </div>
        </div>

        <div className="detail-row">
          <MapPin size={18} />
          <div>
            <label>Location</label>
            <span>{request.location}</span>
          </div>
        </div>

        <div className="detail-row">
          <Clock size={18} />
          <div>
            <label>Requested</label>
            <span>{formatDateTime(request.created_at_ist || request.timestamp_ist || request.created_at || request.timestamp)}</span>
          </div>
        </div>

        {request.quantity && (
          <div className="detail-row">
            <User size={18} />
            <div>
              <label>Quantity</label>
              <span>{request.quantity}</span>
            </div>
          </div>
        )}

        <div className="status-section">
          <label>Status</label>
          <div className="status-options">
            {statusOptions.map((status) => (
              <button
                key={status}
                className={`status-btn ${request.status === status ? "active" : ""}`}
                style={{
                  "--status-color": statusColors[status],
                }}
                onClick={() => onUpdateStatus(request.id, status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveMap() {
  const { requests, updateStatus } = useRequests();
  const [selectedRequest, setSelectedRequest] = useState(null);

  const activeRequests = requests.filter(
    (r) => r.status !== "Delivered" && r.status !== "UserConfirmed"
  );

  return (
    <div className="live-map-page">
      <header className="page-header">
        <div>
          <h1>Live Map</h1>
          <p>{activeRequests.length} active requests</p>
        </div>
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#d9a441" }} />
            Pending
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#2f8fb6" }} />
            Assigned
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#c8653d" }} />
            In Transit
          </span>
          <span className="legend-item">
            <span className="legend-dot" style={{ background: "#d94a3f" }} />
            Urgent
          </span>
        </div>
      </header>

      <div className="map-container">
        <RequestMap
          requests={requests}
          onSelectRequest={setSelectedRequest}
        />

        {selectedRequest && (
          <RequestDetails
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onUpdateStatus={updateStatus}
          />
        )}
      </div>
    </div>
  );
}
