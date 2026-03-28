import { useState, useEffect, useMemo, useRef } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, LineLayer } from "@deck.gl/layers";
import { Map as MapLibreMap } from "react-map-gl/dist/esm/exports-maplibre.js";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation, Package, Clock, AlertTriangle, Radio, Filter, Zap, Settings, X, Crosshair, Save, Search, CheckCircle, Truck, Send, User, Phone, Utensils, Pill, Tent, Satellite, Target, Helicopter, AlertCircle, Hourglass, Plane, Ruler, RefreshCw, Building2 } from "lucide-react";
import { useRequests } from "../context/RequestsContext";
import toast from "react-hot-toast";

// India Boundaries (Lon/Lat for deck.gl)
const INDIA_BOUNDS = [68.2, 8.4, 97.4, 35.6]; // [minLon, minLat, maxLon, maxLat]
const INDIA_CENTER = [78.9629, 20.5937]; // [lon, lat]
const INDIA_ZOOM = 5;

// Default Ground Station Location
const DEFAULT_GS = {
  lat: 11.0168,
  lon: 76.9558,
  name: "NDRF Ground Station"
};

// Preset Ground Station Locations
const GS_PRESETS = [
  { name: "Coimbatore HQ", lat: 11.0168, lon: 76.9558 },
  { name: "Chennai Base", lat: 13.0827, lon: 80.2707 },
  { name: "Bangalore Center", lat: 12.9716, lon: 77.5946 },
  { name: "Mumbai Station", lat: 19.0760, lon: 72.8777 },
  { name: "Delhi Command", lat: 28.6139, lon: 77.2090 },
  { name: "Kolkata Unit", lat: 22.5726, lon: 88.3639 },
];

// Load saved GS location from localStorage
function loadGSLocation() {
  try {
    const saved = localStorage.getItem("groundStationLocation");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load GS location:", e);
  }
  return DEFAULT_GS;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate bearing
function calculateBearing(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return ((bearing + 360) % 360).toFixed(0);
}

// Get cardinal direction
function getDirection(bearing) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Clamp coordinate to India bounds
function clampToIndia(lat, lon) {
  const [minLon, minLat, maxLon, maxLat] = INDIA_BOUNDS;
  return {
    lat: Math.max(minLat, Math.min(maxLat, lat)),
    lon: Math.max(minLon, Math.min(maxLon, lon))
  };
}

const statusColors = {
  Pending: [252, 211, 77],      // #fcd34d
  Assigned: [96, 165, 250],     // #60a5fa
  "In Transit": [167, 139, 250], // #a78bfa
  Delivered: [52, 211, 153],    // #34d399
  UserConfirmed: [52, 211, 153], // #34d399
  Urgent: [248, 113, 113],      // #f87171
  Critical: [248, 113, 113],    // #f87171
};

const OSM_RASTER_STYLE = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

function GSSettingsModal({ isOpen, onClose, gsLocation, setGsLocation }) {
  const [customLat, setCustomLat] = useState(gsLocation.lat.toString());
  const [customLon, setCustomLon] = useState(gsLocation.lon.toString());
  const [customName, setCustomName] = useState(gsLocation.name);

  if (!isOpen) return null;

  const handleSave = () => {
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);

    if (isNaN(lat) || isNaN(lon)) {
      alert("Please enter valid coordinates");
      return;
    }

    const newLocation = { lat, lon, name: customName || "Ground Station" };
    localStorage.setItem("groundStationLocation", JSON.stringify(newLocation));
    setGsLocation(newLocation);
    onClose();
  };

  const handlePresetSelect = (preset) => {
    setCustomLat(preset.lat.toString());
    setCustomLon(preset.lon.toString());
    setCustomName(preset.name);
  };

  return (
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
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(26, 31, 58, 0.98), rgba(37, 45, 72, 0.98))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(167, 139, 250, 0.3)",
          borderRadius: "20px",
          maxWidth: "500px",
          width: "100%",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(167, 139, 250, 0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Ground Station Location</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Set your command center position</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(248, 113, 113, 0.15)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
            <X size={20} color="#f87171" />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Preset Locations
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {GS_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePresetSelect(preset)}
                  style={{
                    padding: "12px",
                    background: customName === preset.name ? "linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(6, 182, 212, 0.1))" : "rgba(167, 139, 250, 0.05)",
                    border: `1px solid ${customName === preset.name ? "rgba(167, 139, 250, 0.5)" : "rgba(167, 139, 250, 0.15)"}`,
                    borderRadius: "10px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{preset.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                    {preset.lat.toFixed(4)}°N, {preset.lon.toFixed(4)}°E
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Custom Location
            </label>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>Station Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g., NDRF Base Camp"
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(167, 139, 250, 0.05)",
                  border: "1px solid rgba(167, 139, 250, 0.15)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>Latitude</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="e.g., 11.0168"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(167, 139, 250, 0.05)",
                    border: "1px solid rgba(167, 139, 250, 0.15)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "6px" }}>Longitude</label>
                <input
                  type="text"
                  value={customLon}
                  onChange={(e) => setCustomLon(e.target.value)}
                  placeholder="e.g., 76.9558"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(167, 139, 250, 0.05)",
                    border: "1px solid rgba(167, 139, 250, 0.15)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "14px",
                background: "rgba(167, 139, 250, 0.1)",
                border: "1px solid rgba(167, 139, 250, 0.3)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "14px",
                background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Save size={18} />
              Save Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveRequests() {
  const { requests, loading, acceptRequest, setInTransit, markDelivered } = useRequests();
  const mapRef = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [gsLocation, setGsLocation] = useState(loadGSLocation);
  const [showGSSettings, setShowGSSettings] = useState(false);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [viewState, setViewState] = useState({
    longitude: INDIA_CENTER[0],
    latitude: INDIA_CENTER[1],
    zoom: INDIA_ZOOM,
    pitch: 0,
    bearing: 0,
  });

  const handleAccept = async (requestId, e) => {
    e?.stopPropagation();
    setProcessingId(requestId);
    try {
      const success = await acceptRequest(requestId);
      if (success) {
        toast.success("Request accepted! Drone assigned.", { icon: "✈️" });
      } else {
        toast.error("Failed to accept request");
      }
    } catch (err) {
      toast.error("Server error");
    }
    setProcessingId(null);
  };

  const handleInTransit = async (requestId, e) => {
    e?.stopPropagation();
    setProcessingId(requestId);
    try {
      const success = await setInTransit(requestId);
      if (success) {
        toast.success("Drone en route!", { icon: <Helicopter size={16} /> });
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
    setProcessingId(null);
  };

  const handleDelivered = async (requestId, e) => {
    e?.stopPropagation();
    setProcessingId(requestId);
    try {
      const success = await markDelivered(requestId);
      if (success) {
        toast.success("Delivery confirmed!", { icon: <CheckCircle size={16} /> });
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
        }
      }
    } catch (err) {
      toast.error("Failed to confirm delivery");
    }
    setProcessingId(null);
  };

  const handleMapClick = (info) => {
    if (isSelectingOnMap && info) {
      const { coordinate } = info;
      if (coordinate && coordinate.length >= 2) {
        const [lon, lat] = coordinate;
        const clamped = clampToIndia(lat, lon);
        const newLocation = { lat: clamped.lat, lon: clamped.lon, name: "Custom Location" };
        localStorage.setItem("groundStationLocation", JSON.stringify(newLocation));
        setGsLocation(newLocation);
        setIsSelectingOnMap(false);
        toast.success("Ground station location updated!");
      }
    }
  };

  // Filter active requests
  const activeRequests = useMemo(() => {
    let filtered = requests.filter(
      (r) => r.status !== "Delivered" && r.status !== "UserConfirmed"
    );

    if (search.trim()) {
      const query = search.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.resource?.toLowerCase().includes(query) ||
          r.note?.toLowerCase().includes(query) ||
          r.id?.toString().includes(query) ||
          r.status?.toLowerCase().includes(query) ||
          r.state?.toLowerCase().includes(query)
      );
    }

    if (filter === "urgent") {
      filtered = filtered.filter((r) => r.status === "Urgent" || r.urgency === "Critical");
    } else if (filter === "pending") {
      filtered = filtered.filter((r) => r.status === "Pending" || r.status === "Urgent");
    } else if (filter === "assigned") {
      filtered = filtered.filter((r) => r.status === "Assigned" || r.status === "In Transit");
    }

    return filtered;
  }, [requests, filter, search]);

  // Add distance and bearing
  const requestsWithDistance = useMemo(() => {
    return activeRequests.map((req) => {
      if (!req.lat || !req.lon) return { ...req, distance: null, bearing: null };

      const distance = calculateDistance(gsLocation.lat, gsLocation.lon, req.lat, req.lon);
      const bearing = calculateBearing(gsLocation.lat, gsLocation.lon, req.lat, req.lon);
      const direction = getDirection(parseFloat(bearing));

      return { ...req, distance, bearing, direction };
    }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }, [activeRequests, gsLocation]);

  // Update selected request
  useEffect(() => {
    if (selectedRequest) {
      const updated = requestsWithDistance.find(r => r.id === selectedRequest.id);
      if (updated) {
        setSelectedRequest(updated);
      }
    }
  }, [requestsWithDistance]);

  // Create deck.gl layers
  const layers = useMemo(() => {
    const markerLayers = [];

    // Ground station marker
    if (gsLocation.lat && gsLocation.lon) {
      markerLayers.push(
        new ScatterplotLayer({
          id: "ground-station",
          data: [{
            position: [gsLocation.lon, gsLocation.lat],
            size: 40,
            isGS: true
          }],
          getPosition: d => d.position,
          getRadius: d => d.size,
          getColor: d => [167, 139, 250, 255],
          onHover: ({ object }) => {
            if (object?.isGS) {
              document.body.style.cursor = "pointer";
            }
          },
          onClick: () => {
            setShowGSSettings(true);
          },
        })
      );

      // Range circle
      markerLayers.push(
        new ScatterplotLayer({
          id: "range-circle",
          data: [{
            position: [gsLocation.lon, gsLocation.lat],
            radius: 50000, // 50km in meters
          }],
          getPosition: d => d.position,
          getRadius: d => d.radius,
          getFillColor: [167, 139, 250, 20],
          getLineColor: [167, 139, 250, 100],
          getLineWidth: 2,
          stroked: true,
          filled: true,
          pickable: false,
        })
      );
    }

    // Request markers
    const requestMarkers = requestsWithDistance
      .filter(r => r.lat && r.lon)
      .map((req) => ({
        position: [req.lon, req.lat],
        size: selectedRequest?.id === req.id ? 36 : 28,
        color: statusColors[req.status] || [124, 139, 201],
        id: req.id,
        data: req,
      }));

    if (requestMarkers.length > 0) {
      markerLayers.push(
        new ScatterplotLayer({
          id: "requests",
          data: requestMarkers,
          getPosition: d => d.position,
          getRadius: d => d.size / 2,
          getColor: d => [...d.color, 255],
          onHover: ({ object }) => {
            if (object) {
              document.body.style.cursor = "pointer";
            }
          },
          onClick: ({ object }) => {
            if (object?.data) {
              setSelectedRequest(object.data);
            }
          },
          pickable: true,
        })
      );
    }

    // Connection line from ground station to selected request
    if (selectedRequest && selectedRequest.lat && selectedRequest.lon && gsLocation.lat && gsLocation.lon) {
      markerLayers.push(
        new LineLayer({
          id: "connection-line",
          data: [{
            sourcePosition: [gsLocation.lon, gsLocation.lat],
            targetPosition: [selectedRequest.lon, selectedRequest.lat],
          }],
          getSourcePosition: d => d.sourcePosition,
          getTargetPosition: d => d.targetPosition,
          getColor: [167, 139, 250, 180],
          getWidth: 3,
          widthMinPixels: 2,
          widthMaxPixels: 10,
          pickable: false,
        })
      );

      // Gradient pulse effect layer for the line
      markerLayers.push(
        new LineLayer({
          id: "connection-line-glow",
          data: [{
            sourcePosition: [gsLocation.lon, gsLocation.lat],
            targetPosition: [selectedRequest.lon, selectedRequest.lat],
          }],
          getSourcePosition: d => d.sourcePosition,
          getTargetPosition: d => d.targetPosition,
          getColor: [167, 139, 250, 80],
          getWidth: 8,
          widthMinPixels: 4,
          widthMaxPixels: 16,
          pickable: false,
        })
      );
    }

    return markerLayers;
  }, [requestsWithDistance, gsLocation, selectedRequest]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid rgba(167, 139, 250, 0.2)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading live requests...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg-primary)", overflow: "hidden" }}>
      {/* Left Panel */}
      <div style={{ width: "420px", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(167, 139, 250, 0.1)" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(167, 139, 250, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Radio size={24} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Live Requests</h1>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                {activeRequests.length} active • Real-time tracking
              </p>
            </div>
          </div>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(6, 182, 212, 0.02))",
            border: "1px solid rgba(167, 139, 250, 0.15)",
            borderRadius: "10px",
            padding: "10px 14px",
            marginBottom: "12px",
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by resource, ID, note, status..."
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
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{
                  background: "rgba(248, 113, 113, 0.15)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color="#f87171" />
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { value: "all", label: "All", Icon: MapPin },
              { value: "urgent", label: "Urgent", Icon: AlertTriangle },
              { value: "pending", label: "Pending", Icon: Hourglass },
              { value: "assigned", label: "Assigned", Icon: Plane },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: filter === f.value ? "linear-gradient(135deg, rgba(167, 139, 250, 0.2), rgba(6, 182, 212, 0.1))" : "rgba(167, 139, 250, 0.05)",
                  border: `1px solid ${filter === f.value ? "rgba(167, 139, 250, 0.4)" : "rgba(167, 139, 250, 0.15)"}`,
                  borderRadius: "8px",
                  color: filter === f.value ? "#a78bfa" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <f.Icon size={16} color={filter === f.value ? "#a78bfa" : "var(--text-muted)"} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {requestsWithDistance.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No active requests</p>
            </div>
          ) : (
            requestsWithDistance.map((req, idx) => {
              const statusColor = statusColors[req.status] || [124, 139, 201];
              const statusColorHex = `rgb(${statusColor[0]}, ${statusColor[1]}, ${statusColor[2]})`;

              return (
                <div
                  key={req.id}
                  onClick={() => setSelectedRequest(req)}
                  style={{
                    padding: "16px",
                    marginBottom: "12px",
                    background: selectedRequest?.id === req.id
                      ? "linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(6, 182, 212, 0.08))"
                      : "linear-gradient(135deg, rgba(167, 139, 250, 0.06), rgba(6, 182, 212, 0.02))",
                    border: `1px solid ${selectedRequest?.id === req.id ? "rgba(167, 139, 250, 0.4)" : "rgba(167, 139, 250, 0.1)"}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    animation: idx < 3 ? `fadeInUp 0.5s ease-out backwards ${idx * 0.1}s` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRequest?.id !== req.id) {
                      e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.3)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRequest?.id !== req.id) {
                      e.currentTarget.style.borderColor = "rgba(167, 139, 250, 0.1)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(167, 139, 250, 0.15)",
                        borderRadius: "8px",
                      }}>
                        {req.resource === "Food" ? (
                          <Utensils size={20} color="#a78bfa" />
                        ) : req.resource === "Medical" ? (
                          <Pill size={20} color="#a78bfa" />
                        ) : req.resource === "Shelter" ? (
                          <Tent size={20} color="#a78bfa" />
                        ) : (
                          <Package size={20} color="#a78bfa" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)" }}>{req.resource}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>ID: #{req.id?.toString().slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "5px 10px",
                        background: statusColorHex,
                        color: "#ffffff",
                        borderRadius: "6px",
                      }}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.distance !== null && (
                    <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(6, 182, 212, 0.1)", padding: "8px 12px", borderRadius: "8px", flex: 1 }}>
                        <Navigation size={16} color="#06b6d4" />
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 900, color: "#06b6d4" }}>{req.distance.toFixed(1)} km</div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Distance</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(167, 139, 250, 0.1)", padding: "8px 12px", borderRadius: "8px", flex: 1 }}>
                        <MapPin size={16} color="#a78bfa" />
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 900, color: "#a78bfa" }}>{req.bearing}° {req.direction}</div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Bearing</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {req.note || "No additional notes"}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)", marginLeft: "12px" }}>
                      <Clock size={12} />
                      {new Date(req.timestamp || req.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {(req.status === "Pending" || req.status === "Urgent") && (
                      <button
                        onClick={(e) => handleAccept(req.id, e)}
                        disabled={processingId === req.id}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "linear-gradient(135deg, #34d399, #06b6d4)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: processingId === req.id ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          opacity: processingId === req.id ? 0.6 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {processingId === req.id ? (
                          <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <CheckCircle size={14} />
                        )}
                        Accept & Assign Drone
                      </button>
                    )}

                    {req.status === "Assigned" && (
                      <button
                        onClick={(e) => handleInTransit(req.id, e)}
                        disabled={processingId === req.id}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: processingId === req.id ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          opacity: processingId === req.id ? 0.6 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {processingId === req.id ? (
                          <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Send size={14} />
                        )}
                        Launch Drone
                      </button>
                    )}

                    {req.status === "In Transit" && (
                      <button
                        onClick={(e) => handleDelivered(req.id, e)}
                        disabled={processingId === req.id}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                          border: "none",
                          borderRadius: "8px",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: processingId === req.id ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          opacity: processingId === req.id ? 0.6 : 1,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {processingId === req.id ? (
                          <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Truck size={14} />
                        )}
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(167, 139, 250, 0.1)", background: "rgba(167, 139, 250, 0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #a78bfa, #06b6d4)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{gsLocation.name}</div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {gsLocation.lat.toFixed(4)}°N, {gsLocation.lon.toFixed(4)}°E
              </div>
            </div>
            <button
              onClick={() => setShowGSSettings(true)}
              style={{
                background: "rgba(167, 139, 250, 0.15)",
                border: "1px solid rgba(167, 139, 250, 0.3)",
                borderRadius: "8px",
                padding: "8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
              title="Change Ground Station Location"
            >
              <Settings size={16} color="#a78bfa" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Map */}
      <div style={{ flex: 1, position: "relative", height: "100%" }}>
        {isSelectingOnMap && (
          <div style={{
            position: "absolute",
            top: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 10px 30px rgba(167, 139, 250, 0.4)",
          }}>
            <Crosshair size={20} />
            <span style={{ fontWeight: 700 }}>Click on map to set Ground Station location</span>
            <button
              onClick={() => setIsSelectingOnMap(false)}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        )}

        <MapLibreMap
          reuseMaps
          mapLib={maplibregl}
          mapStyle={OSM_RASTER_STYLE}
          viewState={viewState}
          onMove={({ viewState: vs }) => setViewState(vs)}
          attributionControl={true}
          navigationControl={true}
          dragPan={true}
          dragRotate={false}
          doubleClickZoom={true}
          scrollZoom={true}
          boxZoom={true}
          touchZoom={true}
          touchPitch={false}
          pitchWithRotate={false}
          style={{ width: "100%", height: "100%" }}
        >
          <DeckGL
            ref={mapRef}
            viewState={viewState}
            controller={false}
            layers={layers}
            onClick={(info) => {
              if (isSelectingOnMap) {
                handleMapClick(info);
              }
            }}
            getCursor={() => (isSelectingOnMap ? "crosshair" : "grab")}
          />
        </MapLibreMap>

        {/* Map Legend */}
        <div style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "linear-gradient(135deg, rgba(26, 31, 58, 0.95), rgba(37, 45, 72, 0.95))",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(167, 139, 250, 0.2)",
          borderRadius: "12px",
          padding: "16px",
          zIndex: 1000,
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Map Legend</span>
            <button
              onClick={() => setIsSelectingOnMap(true)}
              style={{
                background: "rgba(6, 182, 212, 0.15)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "6px",
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                fontWeight: 700,
                color: "#06b6d4",
              }}
              title="Click on map to set Ground Station"
            >
              <Crosshair size={12} />
              Set GS
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Ground Station", color: "#a78bfa" },
              { label: "Pending", color: "#fcd34d" },
              { label: "Assigned", color: "#60a5fa" },
              { label: "In Transit", color: "#a78bfa" },
              { label: "Urgent", color: "#f87171" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", background: item.color, borderRadius: "50%", border: "2px solid white", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Overlay */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          left: "16px",
          right: "16px",
          display: "flex",
          gap: "12px",
          zIndex: 1000,
        }}>
          {[
            { label: "Total Active", value: activeRequests.length, Icon: MapPin, color: "#60a5fa" },
            { label: "Urgent", value: activeRequests.filter(r => r.status === "Urgent" || r.urgency === "Critical").length, Icon: AlertCircle, color: "#f87171" },
            { label: "Nearest", value: requestsWithDistance[0]?.distance ? `${requestsWithDistance[0].distance.toFixed(1)} km` : "N/A", Icon: Ruler, color: "#06b6d4" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                flex: 1,
                background: "linear-gradient(135deg, rgba(26, 31, 58, 0.95), rgba(37, 45, 72, 0.95))",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(167, 139, 250, 0.2)",
                borderRadius: "12px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 0.3s ease",
              }}
            >
              <stat.Icon size={24} color={stat.color} />
              <div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{stat.label}</div>
                <div style={{ fontSize: "20px", fontWeight: 900, color: stat.color }}>{stat.value}</div>
              </div>
            </div>
          ))}

          <button
            title="Real-time updates active via Socket.IO"
            style={{
              background: "linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(52, 211, 153, 0.3)",
              borderRadius: "12px",
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "default",
              color: "#34d399",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              animation: "pulse 2s infinite",
            }}
          >
            <RefreshCw size={16} style={{ animation: "spin 3s linear infinite" }} />
            Live
          </button>
        </div>
      </div>

      {/* Ground Station Settings Modal */}
      <GSSettingsModal
        isOpen={showGSSettings}
        onClose={() => setShowGSSettings(false)}
        gsLocation={gsLocation}
        setGsLocation={setGsLocation}
      />

      {/* Selected Request Detail Panel */}
      {selectedRequest && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: "400px",
            height: "100vh",
            background: "linear-gradient(135deg, rgba(26, 31, 58, 0.98), rgba(37, 45, 72, 0.98))",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(167, 139, 250, 0.2)",
            zIndex: 1500,
            display: "flex",
            flexDirection: "column",
            animation: "slideInRight 0.3s ease-out",
          }}
        >
          <div style={{ padding: "20px", borderBottom: "1px solid rgba(167, 139, 250, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", background: `rgb(${statusColors[selectedRequest.status][0]}, ${statusColors[selectedRequest.status][1]}, ${statusColors[selectedRequest.status][2]})`, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>{selectedRequest.resource}</h3>
                <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-muted)" }}>#{selectedRequest.id?.toString().slice(-8).toUpperCase()}</p>
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

          <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Delivery Progress
              </label>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                {["Pending", "Assigned", "In Transit", "Delivered"].map((stage, idx) => {
                  const currentIdx = ["Pending", "Assigned", "In Transit", "Delivered"].indexOf(selectedRequest.status);
                  const isActive = idx <= currentIdx;
                  const isCurrent = selectedRequest.status === stage;
                  const stageIcons = [Satellite, Target, Helicopter, CheckCircle];
                  const StageIcon = stageIcons[idx];

                  return (
                    <div key={stage} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: isActive ? `rgb(${statusColors[stage][0]}, ${statusColors[stage][1]}, ${statusColors[stage][2]})` : "rgba(167, 139, 250, 0.1)",
                          border: isCurrent ? "3px solid white" : "2px solid transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          boxShadow: isCurrent ? "0 0 20px rgba(167, 139, 250, 0.5)" : "none",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <StageIcon size={18} color="white" />
                      </div>
                      <span style={{ fontSize: "9px", color: isActive ? "var(--text-primary)" : "var(--text-muted)", marginTop: "6px", fontWeight: isCurrent ? 700 : 400 }}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedRequest.distance && (
              <div style={{ marginBottom: "24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ padding: "16px", background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.2)", borderRadius: "12px" }}>
                  <Navigation size={20} color="#06b6d4" style={{ marginBottom: "8px" }} />
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#06b6d4" }}>{selectedRequest.distance.toFixed(1)}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Kilometers</div>
                </div>
                <div style={{ padding: "16px", background: "rgba(167, 139, 250, 0.1)", border: "1px solid rgba(167, 139, 250, 0.2)", borderRadius: "12px" }}>
                  <MapPin size={20} color="#a78bfa" style={{ marginBottom: "8px" }} />
                  <div style={{ fontSize: "24px", fontWeight: 900, color: "#a78bfa" }}>{selectedRequest.bearing}°</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Bearing {selectedRequest.direction}</div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Request Details
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {selectedRequest.state && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(167, 139, 250, 0.05)", borderRadius: "10px" }}>
                    <MapPin size={18} color="#a78bfa" />
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>State</div>
                      <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{selectedRequest.state}</div>
                    </div>
                  </div>
                )}

                {selectedRequest.people_affected && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(248, 113, 113, 0.05)", borderRadius: "10px" }}>
                    <User size={18} color="#f87171" />
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>People Affected</div>
                      <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{selectedRequest.people_affected}</div>
                    </div>
                  </div>
                )}

                {selectedRequest.disaster_type && (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(252, 211, 77, 0.05)", borderRadius: "10px" }}>
                    <AlertTriangle size={18} color="#fcd34d" />
                    <div>
                      <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Disaster Type</div>
                      <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>{selectedRequest.disaster_type}</div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", background: "rgba(6, 182, 212, 0.05)", borderRadius: "10px" }}>
                  <Clock size={18} color="#06b6d4" />
                  <div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>Requested At</div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>
                      {new Date(selectedRequest.timestamp || selectedRequest.created_at).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>

                {selectedRequest.note && (
                  <div style={{ padding: "12px", background: "rgba(167, 139, 250, 0.05)", borderRadius: "10px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", marginBottom: "6px" }}>Note</div>
                    <div style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.5" }}>{selectedRequest.note}</div>
                  </div>
                )}
              </div>
            </div>

            {selectedRequest.lat && selectedRequest.lon && (
              <div style={{ marginBottom: "24px" }}>
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
                      toast.success("Coordinates copied!", { icon: "📋" });
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

          <div style={{ padding: "20px", borderTop: "1px solid rgba(167, 139, 250, 0.15)", display: "flex", gap: "12px" }}>
            {(selectedRequest.status === "Pending" || selectedRequest.status === "Urgent") && (
              <button
                onClick={(e) => handleAccept(selectedRequest.id, e)}
                disabled={processingId === selectedRequest.id}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "linear-gradient(135deg, #34d399, #06b6d4)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: processingId === selectedRequest.id ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: processingId === selectedRequest.id ? 0.6 : 1,
                }}
              >
                <CheckCircle size={18} />
                Accept & Assign Drone
              </button>
            )}

            {selectedRequest.status === "Assigned" && (
              <button
                onClick={(e) => handleInTransit(selectedRequest.id, e)}
                disabled={processingId === selectedRequest.id}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: processingId === selectedRequest.id ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: processingId === selectedRequest.id ? 0.6 : 1,
                }}
              >
                <Send size={18} />
                Launch Drone
              </button>
            )}

            {selectedRequest.status === "In Transit" && (
              <button
                onClick={(e) => handleDelivered(selectedRequest.id, e)}
                disabled={processingId === selectedRequest.id}
                style={{
                  flex: 1,
                  padding: "14px",
                  background: "linear-gradient(135deg, #06b6d4, #0ea5e9)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: processingId === selectedRequest.id ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  opacity: processingId === selectedRequest.id ? 0.6 : 1,
                }}
              >
                <Truck size={18} />
                Confirm Delivery
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
