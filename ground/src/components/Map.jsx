import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons by status
const createIcon = (color) =>
  new L.DivIcon({
    className: "custom-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const statusColors = {
  Pending: "#fbbf24",
  Assigned: "#3b82f6",
  "In Transit": "#8b5cf6",
  Delivered: "#22c55e",
  Urgent: "#ef4444",
  default: "#6b7280",
};

function FitBounds({ requests }) {
  const map = useMap();

  if (requests.length > 0) {
    const bounds = requests
      .filter((r) => (r.lat ?? r.latitude) && (r.lon ?? r.longitude))
      .map((r) => [r.lat ?? r.latitude, r.lon ?? r.longitude]);

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }

  return null;
}

export default function RequestMap({ requests, onSelectRequest }) {
  const activeRequests = requests.filter(
    (r) => r.status !== "Delivered" && r.status !== "UserConfirmed"
  );

  const defaultCenter = [20.5937, 78.9629]; // India center

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      className="request-map"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds requests={activeRequests} />

      {activeRequests.map((request) => {
        const latitude = request.lat ?? request.latitude;
        const longitude = request.lon ?? request.longitude;

        if (!latitude || !longitude) return null;

        const color = statusColors[request.status] || statusColors.default;
        const locationLabel =
          request.location ||
          request.state ||
          `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;

        return (
          <Marker
            key={request.id}
            position={[latitude, longitude]}
            icon={createIcon(color)}
            eventHandlers={{
              click: () => onSelectRequest?.(request),
            }}
          >
            <Popup>
              <div className="map-popup">
                <h4>{request.resource}</h4>
                <p className="popup-location">{locationLabel}</p>
                <span
                  className="popup-status"
                  style={{ background: color }}
                >
                  {request.status}
                </span>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
