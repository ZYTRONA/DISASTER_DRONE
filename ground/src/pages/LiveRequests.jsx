import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Navigation, Package, Clock, AlertTriangle, Radio, Filter, Zap, Settings, X, Crosshair, Save, Search, CheckCircle, Truck, Send, Utensils, Pill, Tent, Helicopter, Hourglass, Plane, Building2, Plus, Minus, Info } from "lucide-react";
import { useRequests } from "../context/RequestsContext";
import toast from "react-hot-toast";

// India Boundaries (Lon/Lat for deck.gl)
const INDIA_BOUNDS = [68.2, 8.4, 97.4, 35.6]; // [minLon, minLat, maxLon, maxLat]
const INDIA_CENTER = [78.9629, 20.5937]; // [lon, lat]
const INDIA_ZOOM = 5;
const MAP_MIN_ZOOM = 3;
const MAP_MAX_ZOOM = 18;

// Default Ground Station Location
const DEFAULT_GS = {
  lat: 11.0168,
  lon: 76.9558,
  name: "NDRF Ground Station"
};

// Preset Ground Station Locations
const POPULAR_INDIAN_LOCATIONS = [
  { name: "Coimbatore HQ", lat: 11.0168, lon: 76.9558 },
  { name: "Chennai Base", lat: 13.0827, lon: 80.2707 },
  { name: "Bangalore Center", lat: 12.9716, lon: 77.5946 },
  { name: "Mumbai Station", lat: 19.0760, lon: 72.8777 },
  { name: "Delhi Command", lat: 28.6139, lon: 77.2090 },
  { name: "Kolkata Unit", lat: 22.5726, lon: 88.3639 },
];

function formatIndianPlace(place) {
  const address = place?.address || {};
  const street =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.path ||
    address.neighbourhood ||
    address.suburb ||
    address.quarter ||
    place?.name;
  const locality =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.city_district ||
    address.county ||
    address.state_district;
  const parts = [street, locality, address.state, "India"].filter(Boolean);
  return [...new Set(parts)].join(", ");
}

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

function getRequestCoordinates(request) {
  const lat = Number(request?.lat ?? request?.latitude);
  const lon = Number(request?.lon ?? request?.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  // Some records can carry placeholder coordinates (0, 0) before device GPS is ready.
  const isPlaceholder = Math.abs(lat) < 0.000001 && Math.abs(lon) < 0.000001;
  if (isPlaceholder) {
    return null;
  }

  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}

function getFocusZoom(distanceKm) {
  if (distanceKm <= 2) return 12;
  if (distanceKm <= 5) return 11;
  if (distanceKm <= 15) return 10;
  if (distanceKm <= 50) return 9;
  if (distanceKm <= 150) return 8;
  if (distanceKm <= 400) return 7;
  return 6;
}

const priorityStyles = {
  Critical: { color: "#d94a3f", background: "rgba(217, 74, 63, 0.12)", border: "rgba(217, 74, 63, 0.3)" },
  High: { color: "#c8653d", background: "rgba(200, 101, 61, 0.12)", border: "rgba(200, 101, 61, 0.3)" },
  Urgent: { color: "#0066cc", background: "rgba(0, 102, 204, 0.12)", border: "rgba(0, 102, 204, 0.3)" },
  Normal: { color: "#2f9e73", background: "rgba(47, 158, 115, 0.12)", border: "rgba(47, 158, 115, 0.3)" },
};

function getRequestPriority(request) {
  const value = String(request?.priority || request?.urgency || "Urgent").trim().toLowerCase();
  const priorityMap = {
    critical: "Critical",
    high: "High",
    urgent: "Urgent",
    normal: "Normal",
  };
  return priorityMap[value] || "Urgent";
}

function getPriorityStyle(priority) {
  return priorityStyles[priority] || priorityStyles.Urgent;
}

function normalizeViewState(vs) {
  return {
    longitude: Number(vs?.longitude ?? INDIA_CENTER[0]),
    latitude: Number(vs?.latitude ?? INDIA_CENTER[1]),
    zoom: Math.max(MAP_MIN_ZOOM, Math.min(MAP_MAX_ZOOM, Number(vs?.zoom ?? INDIA_ZOOM))),
    pitch: Number(vs?.pitch ?? 0),
    bearing: Number(vs?.bearing ?? 0),
  };
}

function hasViewStateChanged(prev, next) {
  const EPSILON = 0.0000001;
  return (
    Math.abs(prev.longitude - next.longitude) > EPSILON ||
    Math.abs(prev.latitude - next.latitude) > EPSILON ||
    Math.abs(prev.zoom - next.zoom) > EPSILON ||
    Math.abs(prev.pitch - next.pitch) > EPSILON ||
    Math.abs(prev.bearing - next.bearing) > EPSILON
  );
}

const statusColors = {
  Pending: [234, 140, 85],      // #ea8c55
  Assigned: [0, 102, 204],     // #0066cc
  "In Transit": [0, 102, 204], // #0066cc
  Delivered: [22, 163, 74],    // #16a34a
  UserConfirmed: [22, 163, 74], // #16a34a
  Urgent: [220, 38, 38],      // #dc2626
  Critical: [220, 38, 38],    // #dc2626
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

const OSRM_ROUTE_BASE = "https://router.project-osrm.org/route/v1/driving";

function GSSettingsModal({ isOpen, onClose, gsLocation, setGsLocation }) {
  const [customLat, setCustomLat] = useState(gsLocation.lat.toString());
  const [customLon, setCustomLon] = useState(gsLocation.lon.toString());
  const [customName, setCustomName] = useState(gsLocation.name);
  const [locationSearch, setLocationSearch] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (!isOpen) return undefined;

    const query = locationSearch.trim();
    if (query.length < 2) {
      setLocationResults([]);
      setSearchLoading(false);
      setSearchError("");
      return undefined;
    }

    const controller = new AbortController();
    const timerId = setTimeout(() => {
      setSearchLoading(true);
      setSearchError("");

      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "in",
        limit: "10",
      });

      fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Search failed");
          }
          return res.json();
        })
        .then((places) => {
          setLocationResults(Array.isArray(places) ? places : []);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setSearchError("Unable to search locations right now");
            setLocationResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSearchLoading(false);
          }
        });
    }, 350);

    return () => {
      clearTimeout(timerId);
      controller.abort();
    };
  }, [isOpen, locationSearch]);

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

  const handleLocationSelect = (location) => {
    const lat = Number(location.lat);
    const lon = Number(location.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    setCustomLat(lat.toString());
    setCustomLon(lon.toString());
    setCustomName(location.name || formatIndianPlace(location));
    setLocationSearch(location.name || formatIndianPlace(location));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.3)",
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
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.98))",
          border: "1px solid rgba(0, 102, 204, 0.2)",
          borderRadius: "20px",
          maxWidth: "640px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(0, 102, 204, 0.15)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #0066cc, #004a99)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Ground Station Location</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Set your command center position</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0, 102, 204, 0.15)", border: "1px solid rgba(0, 102, 204, 0.3)", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
            <X size={20} color="#0066cc" />
          </button>
        </div>

        <div style={{ padding: "24px", maxHeight: "calc(90vh - 98px)", overflowY: "auto" }}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Search Indian Area
            </label>
            <div style={{ position: "relative", marginBottom: "12px" }}>
              <Search size={18} color="#0066cc" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                value={locationSearch}
                onChange={(e) => setLocationSearch(e.target.value)}
                placeholder="Search street, road, area, city, district, or state in India"
                style={{
                  width: "100%",
                  padding: "13px 14px 13px 40px",
                  background: "rgba(0, 102, 204, 0.08)",
                  border: "1px solid rgba(0, 102, 204, 0.2)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {locationSearch.trim().length >= 2 && (
              <div style={{ marginBottom: "14px", border: "1px solid rgba(0, 102, 204, 0.12)", borderRadius: "10px", overflow: "hidden" }}>
                {searchLoading ? (
                  <div style={{ padding: "14px", fontSize: "12px", color: "var(--text-muted)" }}>Searching India locations...</div>
                ) : searchError ? (
                  <div style={{ padding: "14px", fontSize: "12px", color: "#d94a3f" }}>{searchError}</div>
                ) : locationResults.length === 0 ? (
                  <div style={{ padding: "14px", fontSize: "12px", color: "var(--text-muted)" }}>No matching Indian locations found</div>
                ) : (
                  locationResults.map((place) => {
                    const name = formatIndianPlace(place);
                    return (
                      <button
                        key={place.place_id}
                        onClick={() => handleLocationSelect({ ...place, name })}
                        style={{
                          width: "100%",
                          padding: "12px 14px",
                          background: customName === name ? "rgba(0, 102, 204, 0.12)" : "#ffffff",
                          border: "none",
                          borderBottom: "1px solid rgba(0, 102, 204, 0.08)",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-primary)" }}>{name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                          {Number(place.lat).toFixed(4)}°N, {Number(place.lon).toFixed(4)}°E
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}

            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Popular Bases
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {POPULAR_INDIAN_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleLocationSelect(preset)}
                  style={{
                    padding: "12px",
                    background: customName === preset.name ? "linear-gradient(135deg, rgba(0, 102, 204, 0.15), rgba(0, 102, 204, 0.08))" : "rgba(0, 102, 204, 0.06)",
                    border: `1px solid ${customName === preset.name ? "rgba(0, 102, 204, 0.4)" : "rgba(0, 102, 204, 0.15)"}`,
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
                  background: "rgba(0, 102, 204, 0.08)",
                  border: "1px solid rgba(0, 102, 204, 0.2)",
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
                    background: "rgba(0, 102, 204, 0.08)",
                    border: "1px solid rgba(0, 102, 204, 0.2)",
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
                    background: "rgba(0, 102, 204, 0.08)",
                    border: "1px solid rgba(0, 102, 204, 0.2)",
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
                background: "rgba(0, 102, 204, 0.1)",
                border: "1.5px solid #0066cc",
                borderRadius: "10px",
                color: "#0066cc",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "14px",
                background: "#0066cc",
                border: "none",
                borderRadius: "10px",
                color: "#ffffff",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: "0 2px 8px rgba(0, 102, 204, 0.25)",
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

function RequestDetailsModal({ request, onClose }) {
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  useEffect(() => {
    if (!request || !Number.isFinite(request.lat) || !Number.isFinite(request.lon)) {
      setResolvedAddress(null);
      return undefined;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({
      lat: String(request.lat),
      lon: String(request.lon),
      format: "jsonv2",
      addressdetails: "1",
    });

    setAddressLoading(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Reverse geocode failed");
        return res.json();
      })
      .then((place) => {
        setResolvedAddress(place?.address || null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setResolvedAddress(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setAddressLoading(false);
        }
      });

    return () => controller.abort();
  }, [request?.id, request?.lat, request?.lon]);

  if (!request) return null;

  const priority = getRequestPriority(request);
  const priorityStyle = getPriorityStyle(priority);
  const statusColor = statusColors[request.status] || [108, 125, 141];
  const areaName =
    request.area_name ||
    request.area ||
    request.locality ||
    request.neighbourhood ||
    request.street ||
    resolvedAddress?.road ||
    resolvedAddress?.neighbourhood ||
    resolvedAddress?.suburb ||
    resolvedAddress?.quarter ||
    resolvedAddress?.village ||
    resolvedAddress?.town ||
    resolvedAddress?.city ||
    (addressLoading ? "Finding area..." : "Not available");
  const districtName =
    request.district ||
    request.state_district ||
    request.city_district ||
    resolvedAddress?.state_district ||
    resolvedAddress?.county ||
    resolvedAddress?.city_district ||
    (addressLoading ? "Finding district..." : "Not available");
  const stateName =
    request.state ||
    resolvedAddress?.state ||
    (addressLoading ? "Finding state..." : "Not available");
  const cartItems = Array.isArray(request.cart)
    ? request.cart
    : Array.isArray(request.items)
      ? request.items
      : Array.isArray(request.cart?.items)
        ? request.cart.items
        : null;
  const createdAt = request.timestamp || request.created_at;
  const updatedAt = request.updated_at;

  const detailRows = [
    ["Request ID", request.ref_id || `#${request.id?.toString().slice(-6).toUpperCase()}`],
    ["Resource", request.resource || "Relief"],
    ["Status", request.status || "Pending"],
    ["Priority", `${priority} Priority`],
    ["People Affected", request.people_affected || request.people || "Not specified"],
    ["State", stateName],
    ["District", districtName],
    ["Area Name", areaName],
    ["Disaster Type", request.disaster_type || request.disaster || "Not specified"],
    ["Distance", Number.isFinite(request.distance) ? `${request.distance.toFixed(1)} km` : "Not available"],
    ["Bearing", request.bearing ? `${request.bearing}° ${request.direction || ""}` : "Not available"],
    ["Coordinates", Number.isFinite(request.lat) && Number.isFinite(request.lon) ? `${request.lat.toFixed(6)}, ${request.lon.toFixed(6)}` : "Not available"],
    ["Assigned Drone", request.assigned_drone_id || "Not assigned"],
    ["Requested At", createdAt ? new Date(createdAt).toLocaleString("en-IN") : "Not available"],
    ["Updated At", updatedAt ? new Date(updatedAt).toLocaleString("en-IN") : "Not available"],
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        zIndex: 2200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(720px, 100%)",
          maxHeight: "90vh",
          background: "#ffffff",
          border: "1px solid rgba(0, 102, 204, 0.18)",
          borderRadius: "14px",
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "20px 22px", borderBottom: "1px solid rgba(0, 102, 204, 0.12)", display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "10px", background: "rgba(0, 102, 204, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Info size={24} color="#0066cc" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 900, color: "var(--text-primary)" }}>{request.resource || "Request Details"}</h2>
              <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", fontWeight: 800, padding: "6px 10px", background: `rgba(${statusColor[0]}, ${statusColor[1]}, ${statusColor[2]}, 0.12)`, color: `rgb(${statusColor[0]}, ${statusColor[1]}, ${statusColor[2]})`, borderRadius: "8px" }}>
                  {request.status || "Pending"}
                </span>
                <span style={{ fontSize: "11px", fontWeight: 800, padding: "6px 10px", background: priorityStyle.background, color: priorityStyle.color, border: `1px solid ${priorityStyle.border}`, borderRadius: "8px" }}>
                  {priority} Priority
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Close details"
            style={{
              width: "36px",
              height: "36px",
              border: "1px solid rgba(0, 102, 204, 0.18)",
              borderRadius: "8px",
              background: "rgba(0, 102, 204, 0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color="#0066cc" />
          </button>
        </div>

        <div style={{ padding: "22px", overflowY: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px", marginBottom: "18px" }}>
            {detailRows.map(([label, value]) => (
              <div key={label} style={{ padding: "12px", border: "1px solid rgba(0, 102, 204, 0.12)", borderRadius: "10px", background: "rgba(0, 102, 204, 0.04)" }}>
                <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{label}</div>
                <div style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 700, wordBreak: "break-word" }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Note</div>
            <div style={{ padding: "14px", border: "1px solid rgba(0, 102, 204, 0.12)", borderRadius: "10px", background: "#ffffff", color: "var(--text-primary)", fontSize: "13px", lineHeight: 1.6 }}>
              {request.note || "No additional notes"}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Items / Cart</div>
            {cartItems ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {cartItems.map((item, index) => (
                  <div key={`${item.id || item.name || index}`} style={{ padding: "12px", border: "1px solid rgba(0, 102, 204, 0.12)", borderRadius: "10px", display: "flex", justifyContent: "space-between", gap: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{item.name || item.id || `Item ${index + 1}`}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{item.quantity || item.qty || 1} {item.unit || ""}</span>
                  </div>
                ))}
              </div>
            ) : (
              <pre style={{ margin: 0, padding: "14px", border: "1px solid rgba(0, 102, 204, 0.12)", borderRadius: "10px", background: "rgba(0, 102, 204, 0.04)", color: "var(--text-primary)", fontSize: "12px", overflowX: "auto", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(request.cart || request.items || {}, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveRequests() {
  const { requests, loading, acceptRequest, setInTransit, markDelivered } = useRequests();
  const latestRequestIdRef = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailRequest, setDetailRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [gsLocation, setGsLocation] = useState(loadGSLocation);
  const [showGSSettings, setShowGSSettings] = useState(false);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [roadRoute, setRoadRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [viewState, setViewState] = useState(() => normalizeViewState());

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

  const handleShowRequestDetails = useCallback((request, e) => {
    e?.stopPropagation();
    setDetailRequest(request);
  }, []);

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

  const focusOnRequest = useCallback(
    (request) => {
      const coords = getRequestCoordinates(request);
      if (!coords) return;

      const distanceKm = calculateDistance(
        gsLocation.lat,
        gsLocation.lon,
        coords.lat,
        coords.lon
      );

      setViewState((prev) => ({
        ...prev,
        longitude: (gsLocation.lon + coords.lon) / 2,
        latitude: (gsLocation.lat + coords.lat) / 2,
        zoom: getFocusZoom(distanceKm),
      }));
    },
    [gsLocation.lat, gsLocation.lon]
  );

  const handleMapMove = useCallback((event) => {
    const next = normalizeViewState(event?.viewState);
    setViewState((prev) => (hasViewStateChanged(prev, next) ? next : prev));
  }, []);

  const handleMapZoom = useCallback((delta) => {
    setViewState((prev) =>
      normalizeViewState({
        ...prev,
        zoom: prev.zoom + delta,
      })
    );
  }, []);

  const handleSelectRequest = useCallback(
    (request) => {
      const coords = getRequestCoordinates(request);
      if (!coords) {
        setSelectedRequest(request);
        return;
      }

      const normalizedRequest = { ...request, lat: coords.lat, lon: coords.lon };
      setSelectedRequest(normalizedRequest);
      focusOnRequest(normalizedRequest);
    },
    [focusOnRequest]
  );

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
          getRequestPriority(r).toLowerCase().includes(query) ||
          r.state?.toLowerCase().includes(query)
      );
    }

    if (filter === "urgent") {
      filtered = filtered.filter((r) => ["Critical", "High", "Urgent"].includes(getRequestPriority(r)));
    } else if (filter === "pending") {
      filtered = filtered.filter((r) => r.status === "Pending");
    } else if (filter === "assigned") {
      filtered = filtered.filter((r) => r.status === "Assigned" || r.status === "In Transit");
    }

    return filtered;
  }, [requests, filter, search]);

  // Add distance and bearing
  const requestsWithDistance = useMemo(() => {
    return activeRequests
      .map((req) => {
        const coords = getRequestCoordinates(req);
        if (!coords) {
          return { ...req, lat: null, lon: null, distance: null, bearing: null, direction: null };
        }

        const distance = calculateDistance(gsLocation.lat, gsLocation.lon, coords.lat, coords.lon);
        const bearing = calculateBearing(gsLocation.lat, gsLocation.lon, coords.lat, coords.lon);
        const direction = getDirection(parseFloat(bearing));

        return { ...req, lat: coords.lat, lon: coords.lon, distance, bearing, direction };
      })
      .sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }, [activeRequests, gsLocation]);

  // Update selected request
  useEffect(() => {
    if (!selectedRequest) return;

    const updated = requestsWithDistance.find((r) => r.id === selectedRequest.id);
    if (updated) {
      setSelectedRequest(updated);
    } else {
      setSelectedRequest(null);
    }
  }, [requestsWithDistance, selectedRequest]);

  // Keep the info modal synced with live socket updates.
  useEffect(() => {
    if (!detailRequest?.id) return;

    const updated = requestsWithDistance.find((r) => r.id === detailRequest.id);
    if (updated) {
      setDetailRequest(updated);
    } else {
      setDetailRequest(null);
    }
  }, [requestsWithDistance, detailRequest?.id]);

  // Auto-focus the newest incoming request so GS -> user location is visible immediately.
  useEffect(() => {
    const newestActiveWithCoords = activeRequests.find((req) => getRequestCoordinates(req));

    if (!newestActiveWithCoords) {
      latestRequestIdRef.current = null;
      if (selectedRequest) {
        setSelectedRequest(null);
      }
      return;
    }

    const newestId = newestActiveWithCoords.id;
    const hasNewIncomingRequest =
      latestRequestIdRef.current !== null && latestRequestIdRef.current !== newestId;
    const selectedStillVisible = selectedRequest
      ? requestsWithDistance.some((req) => req.id === selectedRequest.id)
      : false;

    if (hasNewIncomingRequest || !selectedStillVisible) {
      const normalizedNewest = requestsWithDistance.find((req) => req.id === newestId);
      if (normalizedNewest) {
        handleSelectRequest(normalizedNewest);
      }
    }

    latestRequestIdRef.current = newestId;
  }, [activeRequests, requestsWithDistance, selectedRequest, handleSelectRequest]);

  // Fetch road route for selected request and render path along roads.
  useEffect(() => {
    const coords = getRequestCoordinates(selectedRequest);

    if (!coords || !Number.isFinite(gsLocation.lat) || !Number.isFinite(gsLocation.lon)) {
      setRoadRoute(null);
      setRouteLoading(false);
      return;
    }

    const from = `${gsLocation.lon.toFixed(6)},${gsLocation.lat.toFixed(6)}`;
    const to = `${coords.lon.toFixed(6)},${coords.lat.toFixed(6)}`;

    if (from === to) {
      setRoadRoute({
        path: [[gsLocation.lon, gsLocation.lat], [coords.lon, coords.lat]],
        distanceKm: 0,
        durationMin: 0,
      });
      setRouteLoading(false);
      return;
    }

    const controller = new AbortController();
    const url = `${OSRM_ROUTE_BASE}/${from};${to}?overview=full&geometries=geojson&alternatives=false&steps=false`;

    setRouteLoading(true);

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Routing request failed (${res.status})`);
        }
        return res.json();
      })
      .then((data) => {
        const route = data?.routes?.[0];
        const path = route?.geometry?.coordinates;

        if (data?.code === "Ok" && Array.isArray(path) && path.length > 1) {
          setRoadRoute({
            path,
            distanceKm: route.distance / 1000,
            durationMin: route.duration / 60,
          });
          return;
        }

        setRoadRoute(null);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Road route unavailable, using direct path:", err.message);
          setRoadRoute(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedRequest?.id, selectedRequest?.lat, selectedRequest?.lon, gsLocation.lat, gsLocation.lon]);

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
          getFillColor: d => [0, 102, 204, 255],
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
          getFillColor: [0, 102, 204, 20],
          getLineColor: [0, 102, 204, 100],
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
        color: statusColors[req.status] || [108, 125, 141],
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
          getFillColor: d => [...d.color, 255],
          onHover: ({ object }) => {
            if (object) {
              document.body.style.cursor = "pointer";
            }
          },
          onClick: ({ object }) => {
            if (object?.data) {
              handleSelectRequest(object.data);
            }
          },
          pickable: true,
        })
      );
    }

    // Connection path from ground station to selected request (road-based when available).
    const hasSelectedCoords = Number.isFinite(selectedRequest?.lat) && Number.isFinite(selectedRequest?.lon);
    if (hasSelectedCoords && Number.isFinite(gsLocation.lat) && Number.isFinite(gsLocation.lon)) {
      const fallbackPath = [
        [gsLocation.lon, gsLocation.lat],
        [selectedRequest.lon, selectedRequest.lat],
      ];
      const hasRoadPath = Array.isArray(roadRoute?.path) && roadRoute.path.length > 1;
      const routePath = hasRoadPath ? roadRoute.path : fallbackPath;
      const routeDistanceKm = Number.isFinite(roadRoute?.distanceKm)
        ? roadRoute.distanceKm
        : Number.isFinite(selectedRequest.distance)
          ? selectedRequest.distance
          : calculateDistance(gsLocation.lat, gsLocation.lon, selectedRequest.lat, selectedRequest.lon);

      markerLayers.push(
        new PathLayer({
          id: "connection-route-glow",
          data: [{ path: routePath }],
          getPath: (d) => d.path,
          getColor: [0, 102, 204, 110],
          getWidth: 9,
          widthMinPixels: 4,
          widthMaxPixels: 13,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        })
      );

      markerLayers.push(
        new PathLayer({
          id: "connection-route",
          data: [{ path: routePath }],
          getPath: (d) => d.path,
          getColor: [217, 95, 58, 225],
          getWidth: 4,
          widthMinPixels: 2,
          widthMaxPixels: 9,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        })
      );

      const labelPosition = routePath[Math.floor(routePath.length / 2)] || fallbackPath[0];

      markerLayers.push(
        new TextLayer({
          id: "connection-distance-label",
          data: [
            {
              position: labelPosition,
              label: `${routeDistanceKm.toFixed(1)} km${hasRoadPath ? " • Road" : " • Direct"}`,
            },
          ],
          getPosition: (d) => d.position,
          getText: (d) => d.label,
          getSize: 13,
          sizeUnits: "pixels",
          getColor: [15, 23, 42, 255],
          background: true,
          getBackgroundColor: [255, 255, 255, 235],
          getBorderColor: [0, 102, 204, 180],
          getBorderWidth: 1,
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          billboard: true,
          pickable: false,
        })
      );
    }

    return markerLayers;
  }, [requestsWithDistance, gsLocation, selectedRequest, handleSelectRequest, roadRoute]);

  const selectedRouteDistanceKm = useMemo(() => {
    if (!selectedRequest) return null;
    if (Number.isFinite(roadRoute?.distanceKm)) return roadRoute.distanceKm;
    return Number.isFinite(selectedRequest.distance) ? selectedRequest.distance : null;
  }, [selectedRequest, roadRoute]);

  const selectedRouteDurationMin = Number.isFinite(roadRoute?.durationMin)
    ? roadRoute.durationMin
    : null;
  const hasRoadRoute = Boolean(roadRoute?.path?.length > 1);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: "16px" }}>
        <div style={{ width: "48px", height: "48px", border: "3px solid rgba(0, 102, 204, 0.2)", borderTop: "3px solid #0066cc", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading live requests...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--bg-primary)", overflow: "hidden" }}>
      {/* Left Panel */}
      <div style={{ width: "420px", flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid rgba(0, 102, 204, 0.1)", height: "100%", overflowY: "auto" }}>
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(0, 102, 204, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #0066cc, #004a99)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
            background: "linear-gradient(135deg, rgba(0, 102, 204, 0.06), rgba(0, 102, 204, 0.02))",
            border: "1px solid rgba(0, 102, 204, 0.15)",
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
                  background: "rgba(0, 102, 204, 0.15)",
                  border: "none",
                  borderRadius: "6px",
                  padding: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} color="#d94a3f" />
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
                  background: filter === f.value ? "linear-gradient(135deg, rgba(0, 102, 204, 0.2), rgba(0, 102, 204, 0.1))" : "rgba(0, 102, 204, 0.05)",
                  border: `1px solid ${filter === f.value ? "rgba(217, 95, 58, 0.4)" : "rgba(0, 102, 204, 0.15)"}`,
                  borderRadius: "8px",
                  color: filter === f.value ? "#0066cc" : "var(--text-muted)",
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
                <f.Icon size={16} color={filter === f.value ? "#0066cc" : "var(--text-muted)"} />
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
              const statusColor = statusColors[req.status] || [108, 125, 141];
              const statusColorHex = `rgb(${statusColor[0]}, ${statusColor[1]}, ${statusColor[2]})`;
              const priority = getRequestPriority(req);
              const priorityStyle = getPriorityStyle(priority);

              return (
                <div
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  style={{
                    padding: "16px",
                    marginBottom: "12px",
                    background: selectedRequest?.id === req.id
                      ? "linear-gradient(135deg, rgba(0, 102, 204, 0.15), rgba(0, 102, 204, 0.08))"
                      : "linear-gradient(135deg, rgba(217, 95, 58, 0.06), rgba(0, 102, 204, 0.02))",
                    border: `1px solid ${selectedRequest?.id === req.id ? "rgba(217, 95, 58, 0.4)" : "rgba(0, 102, 204, 0.1)"}`,
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    animation: idx < 3 ? `fadeInUp 0.5s ease-out backwards ${idx * 0.1}s` : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedRequest?.id !== req.id) {
                      e.currentTarget.style.borderColor = "rgba(217, 95, 58, 0.3)";
                      e.currentTarget.style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedRequest?.id !== req.id) {
                      e.currentTarget.style.borderColor = "rgba(0, 102, 204, 0.1)";
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
                        background: "rgba(0, 102, 204, 0.15)",
                        borderRadius: "8px",
                      }}>
                        {req.resource === "Food" ? (
                          <Utensils size={20} color="#0066cc" />
                        ) : req.resource === "Medical" ? (
                          <Pill size={20} color="#0066cc" />
                        ) : req.resource === "Shelter" ? (
                          <Tent size={20} color="#0066cc" />
                        ) : (
                          <Package size={20} color="#0066cc" />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "14px", color: "var(--text-primary)" }}>{req.resource}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>ID: #{req.id?.toString().slice(-6).toUpperCase()}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
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
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 800,
                          padding: "5px 10px",
                          background: priorityStyle.background,
                          color: priorityStyle.color,
                          border: `1px solid ${priorityStyle.border}`,
                          borderRadius: "6px",
                        }}
                      >
                        {priority} Priority
                      </span>
                    </div>
                  </div>

                  {req.distance !== null && (
                    <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0, 102, 204, 0.1)", padding: "8px 12px", borderRadius: "8px", flex: 1 }}>
                        <Navigation size={16} color="#0066cc" />
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 900, color: "#0066cc" }}>{req.distance.toFixed(1)} km</div>
                          <div style={{ fontSize: "9px", color: "var(--text-muted)" }}>Distance</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "rgba(0, 102, 204, 0.1)", padding: "8px 12px", borderRadius: "8px", flex: 1 }}>
                        <MapPin size={16} color="#0066cc" />
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 900, color: "#0066cc" }}>{req.bearing}° {req.direction}</div>
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
                    <button
                      onClick={(e) => handleShowRequestDetails(req, e)}
                      title="View request details"
                      style={{
                        width: "40px",
                        padding: "10px",
                        background: "rgba(0, 102, 204, 0.1)",
                        border: "1px solid rgba(0, 102, 204, 0.25)",
                        borderRadius: "8px",
                        color: "#0066cc",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Info size={15} />
                    </button>

                    {(req.status === "Pending" || req.status === "Urgent") && (
                      <button
                        onClick={(e) => handleAccept(req.id, e)}
                        disabled={processingId === req.id}
                        style={{
                          flex: 1,
                          padding: "10px",
                          background: "#0066cc",
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
                          boxShadow: "0 2px 8px rgba(0, 102, 204, 0.25)",
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
                          background: "linear-gradient(135deg, #0066cc, #c8653d)",
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
                          background: "linear-gradient(135deg, #0066cc, #0066cc)",
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

        <div style={{ padding: "16px", borderTop: "1px solid rgba(0, 102, 204, 0.1)", background: "rgba(217, 95, 58, 0.03)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #0066cc, #0066cc)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
                background: "rgba(0, 102, 204, 0.15)",
                border: "1px solid rgba(217, 95, 58, 0.3)",
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
              <Settings size={16} color="#0066cc" />
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
            background: "linear-gradient(135deg, #0066cc, #0066cc)",
            color: "white",
            padding: "12px 24px",
            borderRadius: "12px",
            zIndex: 1001,
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 10px 30px rgba(217, 95, 58, 0.4)",
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

        <DeckGL
          viewState={viewState}
          controller={{
            dragPan: true,
            scrollZoom: true,
            doubleClickZoom: true,
            touchZoom: true,
            dragRotate: false,
            touchRotate: false,
          }}
          layers={layers}
          onViewStateChange={handleMapMove}
          onClick={(info) => {
            if (isSelectingOnMap) {
              handleMapClick(info);
            }
          }}
          getCursor={() => (isSelectingOnMap ? "crosshair" : "grab")}
          style={{ width: "100%", height: "100%" }}
        >
          <MapLibreMap
            mapLib={maplibregl}
            mapStyle={OSM_RASTER_STYLE}
            viewState={viewState}
            onMove={handleMapMove}
            attributionControl={true}
            dragPan={true}
            dragRotate={false}
            doubleClickZoom={true}
            scrollZoom={true}
            boxZoom={true}
            touchZoom={true}
            touchPitch={false}
            pitchWithRotate={false}
            style={{ width: "100%", height: "100%" }}
          />
        </DeckGL>

        <div
          style={{
            position: "absolute",
            bottom: "24px",
            left: "16px",
            zIndex: 1001,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "10px",
            border: "1px solid rgba(0, 102, 204, 0.25)",
            background: "rgba(255, 255, 255, 0.96)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.12)",
          }}
        >
          <button
            type="button"
            onClick={() => handleMapZoom(1)}
            title="Zoom in"
            style={{
              width: "42px",
              height: "42px",
              border: "none",
              borderBottom: "1px solid rgba(0, 102, 204, 0.18)",
              background: "transparent",
              color: "#0066cc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            onClick={() => handleMapZoom(-1)}
            title="Zoom out"
            style={{
              width: "42px",
              height: "42px",
              border: "none",
              background: "transparent",
              color: "#0066cc",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Minus size={20} />
          </button>
        </div>

        {selectedRequest && selectedRouteDistanceKm !== null && (
          <div
            style={{
              position: "absolute",
              top: "16px",
              left: "16px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.96))",
              border: "1px solid rgba(0, 102, 204, 0.3)",
              borderRadius: "12px",
              padding: "12px 14px",
              zIndex: 1000,
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              minWidth: "190px",
            }}
          >
            <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
              {routeLoading ? "Finding road route..." : hasRoadRoute ? "Live Road Route" : "Direct Route (Fallback)"}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0066cc", fontWeight: 900, fontSize: "22px", lineHeight: 1 }}>
              <Navigation size={18} />
              {selectedRouteDistanceKm.toFixed(1)} km
            </div>
            <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
              {selectedRouteDurationMin !== null ? `ETA ${Math.round(selectedRouteDurationMin)} min • ` : ""}
              {selectedRequest.bearing ? `Bearing ${selectedRequest.bearing}° ${selectedRequest.direction}` : "Route selected"}
            </div>
          </div>
        )}

        {/* Map Legend */}
        <div style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))",
          border: "1px solid rgba(217, 95, 58, 0.3)",
          borderRadius: "12px",
          padding: "16px",
          zIndex: 1000,
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
        }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span>Map Legend</span>
            <button
              onClick={() => setIsSelectingOnMap(true)}
              style={{
                background: "rgba(0, 102, 204, 0.15)",
                border: "1px solid rgba(0, 102, 204, 0.3)",
                borderRadius: "6px",
                padding: "4px 8px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "10px",
                fontWeight: 700,
                color: "#0066cc",
              }}
              title="Click on map to set Ground Station"
            >
              <Crosshair size={12} />
              Set GS
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "16px", height: "4px", background: "#d95f3a", borderRadius: "999px" }} />
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Road Route</span>
            </div>
            {[
              { label: "Ground Station", color: "#0066cc" },
              { label: "Pending", color: "#d9a441" },
              { label: "Assigned", color: "#0066cc" },
              { label: "In Transit", color: "#0066cc" },
              { label: "Urgent", color: "#d94a3f" },
            ].map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", background: item.color, borderRadius: "50%", border: "2px solid rgba(15, 23, 42, 0.1)", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Ground Station Settings Modal */}
      <GSSettingsModal
        isOpen={showGSSettings}
        onClose={() => setShowGSSettings(false)}
        gsLocation={gsLocation}
        setGsLocation={setGsLocation}
      />

      <RequestDetailsModal
        request={detailRequest}
        onClose={() => setDetailRequest(null)}
      />

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
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
      `}</style>
    </div>
  );
}
