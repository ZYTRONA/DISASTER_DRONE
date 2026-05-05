import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, PathLayer, TextLayer } from "@deck.gl/layers";
import { Map as MapLibreMap } from "react-map-gl/maplibre";
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

// India Districts Database - Organized by State (Comprehensive List)
const INDIA_DISTRICTS = {
  "Andhra Pradesh": [
    { name: "Visakhapatnam", lat: 17.6869, lon: 83.2185 },
    { name: "Vijayawada", lat: 16.5062, lon: 80.6480 },
    { name: "Guntur", lat: 16.3067, lon: 80.4365 },
    { name: "Nellore", lat: 14.4426, lon: 79.9864 },
    { name: "Chittoor", lat: 13.1939, lon: 79.1022 },
    { name: "Tirupati", lat: 13.1939, lon: 79.8941 },
    { name: "Ongole", lat: 14.6348, lon: 79.6296 },
    { name: "Tenali", lat: 16.2471, lon: 80.6485 },
  ],
  "Arunachal Pradesh": [
    { name: "Itanagar", lat: 28.2180, lon: 93.6053 },
    { name: "Papum Pare", lat: 27.8974, lon: 93.6150 },
    { name: "Changlang", lat: 27.4278, lon: 95.9369 },
    { name: "Pasighat", lat: 28.0653, lon: 93.8226 },
  ],
  "Assam": [
    { name: "Guwahati", lat: 26.1445, lon: 91.7362 },
    { name: "Dibrugarh", lat: 27.4891, lon: 95.2972 },
    { name: "Silchar", lat: 24.8154, lon: 92.7979 },
    { name: "Barpeta", lat: 26.3169, lon: 90.2669 },
    { name: "Nagaon", lat: 26.1524, lon: 92.6527 },
    { name: "Tinsukia", lat: 27.4831, lon: 95.3640 },
  ],
  "Bihar": [
    { name: "Patna", lat: 25.5941, lon: 85.1376 },
    { name: "Gaya", lat: 24.7914, lon: 84.9864 },
    { name: "Bhagalpur", lat: 25.2816, lon: 86.4766 },
    { name: "Muzaffarpur", lat: 26.1209, lon: 85.3905 },
    { name: "Darbhanga", lat: 26.1561, lon: 85.8755 },
    { name: "Arrah", lat: 25.5580, lon: 84.6649 },
    { name: "Biharsharif", lat: 25.2031, lon: 85.5307 },
  ],
  "Chhattisgarh": [
    { name: "Raipur", lat: 21.2514, lon: 81.6296 },
    { name: "Durg", lat: 21.1868, lon: 81.2752 },
    { name: "Bilaspur", lat: 22.0796, lon: 82.1581 },
    { name: "Rajnandgaon", lat: 22.6626, lon: 81.0349 },
    { name: "Jabalpur", lat: 23.1815, lon: 79.9864 },
    { name: "Raigarh", lat: 21.8967, lon: 83.4171 },
  ],
  "Goa": [
    { name: "Panaji", lat: 15.4909, lon: 73.8278 },
    { name: "Margao", lat: 15.2993, lon: 73.9567 },
    { name: "Vasco da Gama", lat: 15.3865, lon: 73.8189 },
    { name: "Ponda", lat: 15.3989, lon: 73.9847 },
  ],
  "Gujarat": [
    { name: "Ahmedabad", lat: 23.0225, lon: 72.5714 },
    { name: "Vadodara", lat: 22.3072, lon: 73.1812 },
    { name: "Surat", lat: 21.1702, lon: 72.8311 },
    { name: "Rajkot", lat: 22.3039, lon: 70.8022 },
    { name: "Jamnagar", lat: 22.4707, lon: 70.0577 },
    { name: "Bhavnagar", lat: 21.7645, lon: 71.9520 },
    { name: "Anand", lat: 22.5645, lon: 72.9289 },
    { name: "Gandhinagar", lat: 23.2156, lon: 72.6369 },
    { name: "Junagadh", lat: 21.5230, lon: 70.4606 },
  ],
  "Haryana": [
    { name: "Faridabad", lat: 28.4089, lon: 77.3178 },
    { name: "Gurgaon", lat: 28.4595, lon: 77.0266 },
    { name: "Hisar", lat: 29.1724, lon: 75.7339 },
    { name: "Rohtak", lat: 28.8955, lon: 76.5631 },
    { name: "Panipat", lat: 29.3910, lon: 77.2713 },
    { name: "Kurukshetra", lat: 29.9689, lon: 76.8633 },
  ],
  "Himachal Pradesh": [
    { name: "Shimla", lat: 31.7725, lon: 77.1097 },
    { name: "Mandi", lat: 32.2397, lon: 76.9295 },
    { name: "Solan", lat: 30.9046, lon: 77.1624 },
    { name: "Kangra", lat: 32.2206, lon: 76.2616 },
    { name: "Bilaspur", lat: 31.2863, lon: 76.7660 },
    { name: "Nahan", lat: 30.5526, lon: 77.2558 },
  ],
  "Jharkhand": [
    { name: "Ranchi", lat: 23.3441, lon: 85.3096 },
    { name: "Jamshedpur", lat: 22.8046, lon: 86.1856 },
    { name: "Dhanbad", lat: 23.7957, lon: 86.4304 },
    { name: "Giridih", lat: 24.1767, lon: 85.3235 },
    { name: "Bokaro", lat: 23.6673, lon: 85.3167 },
    { name: "Hazaribagh", lat: 23.9989, lon: 85.3586 },
  ],
  "Karnataka": [
    { name: "Bangalore", lat: 12.9716, lon: 77.5946 },
    { name: "Mysore", lat: 12.2958, lon: 76.6394 },
    { name: "Mangalore", lat: 12.8697, lon: 74.8597 },
    { name: "Belgaum", lat: 15.8601, lon: 74.5028 },
    { name: "Hubballi", lat: 15.3647, lon: 75.1240 },
    { name: "Davangere", lat: 14.4644, lon: 75.9218 },
    { name: "Gulbarga", lat: 17.3297, lon: 76.8343 },
    { name: "Bijapur", lat: 16.8293, lon: 75.7139 },
  ],
  "Kerala": [
    { name: "Thiruvananthapuram", lat: 8.5241, lon: 76.9366 },
    { name: "Kochi", lat: 9.9312, lon: 76.2673 },
    { name: "Kozhikode", lat: 11.2588, lon: 75.7804 },
    { name: "Thrissur", lat: 10.5269, lon: 76.2144 },
    { name: "Kottayam", lat: 9.5941, lon: 76.5214 },
    { name: "Kannur", lat: 12.0193, lon: 75.3696 },
    { name: "Idukki", lat: 10.3788, lon: 76.8593 },
  ],
  "Madhya Pradesh": [
    { name: "Bhopal", lat: 23.1815, lon: 79.9864 },
    { name: "Indore", lat: 22.7196, lon: 75.8577 },
    { name: "Gwalior", lat: 26.2183, lon: 78.1628 },
    { name: "Jabalpur", lat: 23.1815, lon: 79.9864 },
    { name: "Ujjain", lat: 23.1815, lon: 75.7850 },
    { name: "Sagar", lat: 22.7368, lon: 78.7641 },
    { name: "Ratlam", lat: 23.3365, lon: 75.0417 },
  ],
  "Maharashtra": [
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "Pune", lat: 18.5204, lon: 73.8567 },
    { name: "Nagpur", lat: 21.1458, lon: 79.0882 },
    { name: "Nashik", lat: 19.9975, lon: 73.7898 },
    { name: "Aurangabad", lat: 19.8762, lon: 75.3433 },
    { name: "Kolhapur", lat: 16.7050, lon: 74.2388 },
    { name: "Solapur", lat: 17.6599, lon: 75.9064 },
    { name: "Amravati", lat: 20.9337, lon: 77.7597 },
    { name: "Thane", lat: 19.2183, lon: 72.9781 },
  ],
  "Manipur": [
    { name: "Imphal", lat: 24.8170, lon: 94.9036 },
    { name: "Senapati", lat: 25.0241, lon: 94.4742 },
    { name: "Ukhrul", lat: 24.5628, lon: 94.8204 },
  ],
  "Meghalaya": [
    { name: "Shillong", lat: 25.5788, lon: 91.8933 },
    { name: "Tura", lat: 25.5148, lon: 90.2391 },
    { name: "Cherrapunji", lat: 25.2727, lon: 91.7346 },
  ],
  "Mizoram": [
    { name: "Aizawl", lat: 23.7271, lon: 93.3162 },
    { name: "Lunglei", lat: 22.8833, lon: 92.7833 },
    { name: "Saiha", lat: 22.4280, lon: 92.9831 },
  ],
  "Nagaland": [
    { name: "Kohima", lat: 25.6114, lon: 94.1086 },
    { name: "Dimapur", lat: 25.9050, lon: 93.7263 },
    { name: "Mokokchung", lat: 26.0835, lon: 94.4803 },
  ],
  "Odisha": [
    { name: "Bhubaneswar", lat: 20.2961, lon: 85.8245 },
    { name: "Cuttack", lat: 20.4625, lon: 85.8830 },
    { name: "Rourkela", lat: 22.2263, lon: 84.8540 },
    { name: "Balasore", lat: 21.4885, lon: 86.9270 },
    { name: "Berhampur", lat: 19.3150, lon: 84.7941 },
    { name: "Sambalpur", lat: 21.4684, lon: 83.9973 },
  ],
  "Punjab": [
    { name: "Chandigarh", lat: 30.7333, lon: 76.8167 },
    { name: "Amritsar", lat: 31.6340, lon: 74.8723 },
    { name: "Ludhiana", lat: 30.9010, lon: 75.8573 },
    { name: "Jalandhar", lat: 31.8254, lon: 75.5762 },
    { name: "Patiala", lat: 30.3398, lon: 76.3869 },
    { name: "Bathinda", lat: 30.2156, lon: 74.9421 },
    { name: "Mohali", lat: 30.6394, lon: 76.7462 },
  ],
  "Rajasthan": [
    { name: "Jaipur", lat: 26.9124, lon: 75.7873 },
    { name: "Jodhpur", lat: 26.2389, lon: 73.0243 },
    { name: "Udaipur", lat: 24.5854, lon: 73.7125 },
    { name: "Bikaner", lat: 28.0229, lon: 71.8315 },
    { name: "Ajmer", lat: 26.4499, lon: 74.6399 },
    { name: "Kota", lat: 25.2183, lon: 75.8245 },
    { name: "Alwar", lat: 27.5673, lon: 76.6249 },
    { name: "Bhilwara", lat: 25.3424, lon: 74.6288 },
  ],
  "Tamil Nadu": [
    { name: "Chennai", lat: 13.0827, lon: 80.2707 },
    { name: "Coimbatore", lat: 11.0168, lon: 76.9558 },
    { name: "Madurai", lat: 9.9252, lon: 78.1198 },
    { name: "Salem", lat: 11.6643, lon: 78.1460 },
    { name: "Tiruchirappalli", lat: 10.7905, lon: 78.7047 },
    { name: "Erode", lat: 11.3919, lon: 77.7173 },
    { name: "Karur", lat: 10.9352, lon: 78.1389 },
    { name: "Tiruppur", lat: 11.1085, lon: 77.3411 },
    { name: "Kanyakumari", lat: 8.0883, lon: 77.5385 },
    { name: "Villupuram", lat: 12.9606, lon: 79.8953 },
    { name: "Ranipet", lat: 12.9252, lon: 79.8847 },
  ],
  "Telangana": [
    { name: "Hyderabad", lat: 17.3850, lon: 78.4867 },
    { name: "Warangal", lat: 17.9689, lon: 79.5941 },
    { name: "Nizamabad", lat: 19.2746, lon: 78.1379 },
    { name: "Khammam", lat: 17.2687, lon: 80.6189 },
    { name: "Suryapet", lat: 17.1408, lon: 79.6278 },
  ],
  "Tripura": [
    { name: "Agartala", lat: 23.8103, lon: 91.2788 },
    { name: "Udaipur", lat: 23.5342, lon: 91.4871 },
    { name: "Dharmanagar", lat: 23.6000, lon: 91.2700 },
  ],
  "Uttar Pradesh": [
    { name: "Lucknow", lat: 26.8467, lon: 80.9462 },
    { name: "Kanpur", lat: 26.4499, lon: 80.3319 },
    { name: "Agra", lat: 27.1767, lon: 78.0081 },
    { name: "Varanasi", lat: 25.3200, lon: 82.9855 },
    { name: "Meerut", lat: 28.9845, lon: 77.7064 },
    { name: "Ghaziabad", lat: 28.6692, lon: 77.4538 },
    { name: "Noida", lat: 28.5355, lon: 77.3910 },
    { name: "Allahabad", lat: 25.4358, lon: 81.8463 },
    { name: "Mathura", lat: 27.4924, lon: 77.6737 },
  ],
  "Uttarakhand": [
    { name: "Dehradun", lat: 30.3165, lon: 78.0322 },
    { name: "Haridwar", lat: 29.9457, lon: 78.1642 },
    { name: "Rudraprayag", lat: 30.2833, lon: 78.9833 },
    { name: "Almora", lat: 29.5880, lon: 79.6447 },
    { name: "Nainital", lat: 29.3804, lon: 79.4555 },
  ],
  "West Bengal": [
    { name: "Kolkata", lat: 22.5726, lon: 88.3639 },
    { name: "Darjeeling", lat: 27.0360, lon: 88.2605 },
    { name: "Siliguri", lat: 26.5312, lon: 88.4120 },
    { name: "Asansol", lat: 23.6834, lon: 86.9649 },
    { name: "Durgapur", lat: 23.7957, lon: 87.3163 },
    { name: "Howrah", lat: 22.5958, lon: 88.2636 },
  ],
  "Delhi": [
    { name: "New Delhi", lat: 28.6139, lon: 77.2090 },
    { name: "East Delhi", lat: 28.5921, lon: 77.3055 },
    { name: "West Delhi", lat: 28.6432, lon: 77.0316 },
    { name: "South Delhi", lat: 28.5221, lon: 77.2047 },
    { name: "North Delhi", lat: 28.7314, lon: 77.2316 },
  ],
};

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

// Find nearest district/area name from coordinates
function getNearestAreaName(lat, lon) {
  if (!lat || !lon) return "Unknown";

  let nearestDistrict = null;
  let minDistance = Infinity;

  Object.entries(INDIA_DISTRICTS).forEach(([state, districts]) => {
    districts.forEach(district => {
      const dist = calculateDistance(lat, lon, district.lat, district.lon);
      if (dist < minDistance) {
        minDistance = dist;
        nearestDistrict = { name: district.name, state, distance: dist };
      }
    });
  });

  // If within 50km of a district, return it
  if (nearestDistrict && nearestDistrict.distance <= 50) {
    return `${nearestDistrict.name}, ${nearestDistrict.state}`;
  }

  return "Unknown";
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

// Get elapsed time from timestamp
function getElapsedTime(timestamp) {
  if (!timestamp) return "Unknown";
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return "Unknown";
  }
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

function formatDateTime(timestamp) {
  if (!timestamp) return "N/A";
  try {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    hours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
  } catch (e) {
    return "Invalid date";
  }
}

function normalizeViewState(vs) {
  return {
    longitude: Number(vs?.longitude ?? INDIA_CENTER[0]),
    latitude: Number(vs?.latitude ?? INDIA_CENTER[1]),
    zoom: Number(vs?.zoom ?? INDIA_ZOOM),
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
  Pending: [234, 140, 85],
  Assigned: [0, 102, 204],
  "In Transit": [0, 102, 204],
  Delivered: [22, 163, 74],
  UserConfirmed: [22, 163, 74],
};

const priorityConfig = {
  Urgent:   { bg: "#fef2f2", color: "#dc2626", border: "#fca5a5" },
  High:     { bg: "#fff7ed", color: "#ea580c", border: "#fdba74" },
  Normal:   { bg: "#f0fdf4", color: "#16a34a", border: "#86efac" },
};

const PRIORITY_ORDER = { Urgent: 0, High: 1, Normal: 2 };
const PRIORITY_ALIASES = {
  urgent: "Urgent",
  critical: "Urgent",
  sos: "Urgent",
  emergency: "Urgent",
  high: "High",
  normal: "Normal",
  medium: "Normal",
  low: "Normal",
};

function normalizePriority(value) {
  if (!value) return "Normal";
  const key = String(value).trim().toLowerCase();
  return PRIORITY_ALIASES[key] || "Normal";
}

function getRequestPriority(request) {
  return normalizePriority(request?.requested_urgency || request?.priority);
}

function getPriorityRank(request) {
  return PRIORITY_ORDER[getRequestPriority(request)] ?? 99;
}

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

function RequestDetailsModal({ isOpen, onClose, request, gsLocation }) {
  if (!isOpen || !request) return null;

  const coords = getRequestCoordinates(request);
  const distance = coords ? calculateDistance(gsLocation.lat, gsLocation.lon, coords.lat, coords.lon) : null;
  const bearing = coords ? calculateBearing(gsLocation.lat, gsLocation.lon, coords.lat, coords.lon) : null;
  const direction = bearing ? getDirection(parseFloat(bearing)) : null;
  const areaName = coords ? getNearestAreaName(coords.lat, coords.lon) : "Unknown";
  const formattedId = `#${request.id?.toString().slice(-6).toUpperCase()}`;
  const createdDate = formatDateTime(request.timestamp || request.created_at);

  const detailRows = [
    { label: "Request ID", value: formattedId },
    { label: "Full ID", value: request.id },
    { label: "Resource", value: request.resource },
    { label: "Status", value: request.status },
    { label: "Location", value: request.state || request.location || areaName },
    { label: "Latitude", value: coords?.lat?.toFixed(6) || "N/A" },
    { label: "Longitude", value: coords?.lon?.toFixed(6) || "N/A" },
    { label: "Distance from GS", value: distance ? `${distance.toFixed(2)} km` : "N/A" },
    { label: "Bearing", value: bearing ? `${bearing}° ${direction}` : "N/A" },
    { label: "Description", value: request.note || "No notes" },
    { label: "Created", value: createdDate },
    { label: "Urgency", value: getRequestPriority(request) },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.98))",
          border: "1px solid rgba(0, 102, 204, 0.2)",
          borderRadius: "16px",
          maxWidth: "500px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid rgba(0, 102, 204, 0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "inherit" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "48px", height: "48px", background: "linear-gradient(135deg, #0066cc, #004a99)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <AlertCircle size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Request Details</h2>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>#{request.id?.toString().slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(0, 102, 204, 0.15)", border: "1px solid rgba(0, 102, 204, 0.3)", borderRadius: "8px", padding: "8px", cursor: "pointer" }}>
            <X size={20} color="#0066cc" />
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {detailRows.map((row, idx) => (
              <div key={idx} style={{ gridColumn: row.label === "Description" || row.label === "Requested By" ? "1 / -1" : "auto" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  {row.label}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-primary)", padding: "10px", background: "rgba(0, 102, 204, 0.05)", borderRadius: "8px", border: "1px solid rgba(0, 102, 204, 0.1)", wordBreak: "break-word" }}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GSSettingsModal({ isOpen, onClose, gsLocation, setGsLocation }) {
  const [customLat, setCustomLat] = useState(gsLocation.lat.toString());
  const [customLon, setCustomLon] = useState(gsLocation.lon.toString());
  const [customName, setCustomName] = useState(gsLocation.name);
  const [selectedState, setSelectedState] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");

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

  const handleDistrictSelect = (district) => {
    setCustomLat(district.lat.toString());
    setCustomLon(district.lon.toString());
    setCustomName(district.name);
    setDistrictSearch("");
    setSelectedState("");
  };

  // Get filtered districts
  const states = Object.keys(INDIA_DISTRICTS);
  const filteredStates = states.filter(state => {
    if (!selectedState && !districtSearch) return false;
    if (selectedState) return state === selectedState;
    return state.toLowerCase().includes(districtSearch.toLowerCase());
  });

  let filteredDistricts = [];
  if (selectedState) {
    filteredDistricts = INDIA_DISTRICTS[selectedState].filter(district =>
      district.name.toLowerCase().includes(districtSearch.toLowerCase())
    );
  } else if (districtSearch) {
    states.forEach(state => {
      INDIA_DISTRICTS[state].forEach(district => {
        if (district.name.toLowerCase().includes(districtSearch.toLowerCase())) {
          filteredDistricts.push(district);
        }
      });
    });
  }

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
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.98))",
          border: "1px solid rgba(0, 102, 204, 0.2)",
          borderRadius: "20px",
          maxWidth: "500px",
          width: "100%",
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
              Search by District
            </label>
            <div style={{ marginBottom: "12px" }}>
              <input
                type="text"
                placeholder="Search district..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  background: "rgba(0, 102, 204, 0.08)",
                  border: "1px solid rgba(0, 102, 204, 0.2)",
                  borderRadius: "10px",
                  color: "var(--text-primary)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                  marginBottom: "8px"
                }}
              />
              {districtSearch && !selectedState && (
                <select
                  onChange={(e) => setSelectedState(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "rgba(0, 102, 204, 0.06)",
                    border: "1px solid rgba(0, 102, 204, 0.15)",
                    borderRadius: "8px",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    outline: "none",
                    boxSizing: "border-box",
                    marginBottom: "8px"
                  }}
                  value=""
                >
                  <option value="">Select State</option>
                  {filteredStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              )}
              {selectedState && (
                <button
                  onClick={() => setSelectedState("")}
                  style={{
                    width: "100%",
                    padding: "8px",
                    background: "rgba(0, 102, 204, 0.1)",
                    border: "1px solid rgba(0, 102, 204, 0.2)",
                    borderRadius: "8px",
                    color: "#0066cc",
                    fontSize: "12px",
                    outline: "none",
                    cursor: "pointer",
                    marginBottom: "8px"
                  }}
                >
                  ← Back to States
                </button>
              )}
            </div>
            {districtSearch && filteredDistricts.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", maxHeight: "200px", overflowY: "auto", paddingRight: "4px" }}>
                {filteredDistricts.map((district) => (
                  <button
                    key={`${district.name}-${district.lat}`}
                    onClick={() => handleDistrictSelect(district)}
                    style={{
                      padding: "10px",
                      background: customName === district.name ? "linear-gradient(135deg, rgba(0, 102, 204, 0.15), rgba(0, 102, 204, 0.08))" : "rgba(0, 102, 204, 0.06)",
                      border: `1px solid ${customName === district.name ? "rgba(0, 102, 204, 0.4)" : "rgba(0, 102, 204, 0.15)"}`,
                      borderRadius: "8px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>{district.name}</div>
                    <div style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {district.lat.toFixed(4)}°N, {district.lon.toFixed(4)}°E
                    </div>
                  </button>
                ))}
              </div>
            )}
            {districtSearch && filteredDistricts.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                No districts found
              </div>
            )}
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

export default function LiveRequests() {
  const { requests, loading, acceptRequest, setInTransit, markDelivered } = useRequests();
  const latestRequestIdRef = useRef(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsRequest, setDetailsRequest] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [gsLocation, setGsLocation] = useState(loadGSLocation);
  const [showGSSettings, setShowGSSettings] = useState(false);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [roadRoute, setRoadRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [viewState, setViewState] = useState(() => normalizeViewState());

  // Zoom to ground station on mount
  useEffect(() => {
    setViewState((prev) => ({
      ...prev,
      longitude: gsLocation.lon,
      latitude: gsLocation.lat,
      zoom: 12, // Good zoom level for ground station
    }));
  }, [gsLocation]);

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
    // Handle both DeckGL and MapLibreMap formats
    const vs = event?.viewState || event;
    const next = normalizeViewState(vs);
    setViewState((prev) => (hasViewStateChanged(prev, next) ? next : prev));
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

  // Filter active requests (for sidebar list)
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
      filtered = filtered.filter((r) => getRequestPriority(r) === "Urgent");
    } else if (filter === "pending") {
      filtered = filtered.filter((r) => r.status === "Pending");
    } else if (filter === "assigned") {
      filtered = filtered.filter((r) => r.status === "Assigned" || r.status === "In Transit");
    }

    return filtered;
  }, [requests, filter, search]);

  // Add distance and bearing
  // Add distance and bearing (include all requests for map)
  const requestsWithDistance = useMemo(() => {
    return requests
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
  }, [requests, gsLocation]);

  // Active requests with distance (for sidebar display)
  const activeRequestsWithDistance = useMemo(() => {
    const active = requestsWithDistance.filter(
      (r) => r.status !== "Delivered" && r.status !== "UserConfirmed"
    );

    return active.sort((a, b) => {
      const priorityDiff = getPriorityRank(a) - getPriorityRank(b);
      if (priorityDiff !== 0) return priorityDiff;
      const aDist = Number.isFinite(a.distance) ? a.distance : Number.POSITIVE_INFINITY;
      const bDist = Number.isFinite(b.distance) ? b.distance : Number.POSITIVE_INFINITY;
      return aDist - bDist;
    });
  }, [requestsWithDistance]);

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

      // Ground station label
      markerLayers.push(
        new TextLayer({
          id: "gs-label",
          data: [{
            position: [gsLocation.lon, gsLocation.lat],
            name: gsLocation.name
          }],
          getPosition: d => d.position,
          getText: d => d.name,
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getTextAnchor: "middle",
          getAlignmentBaseline: "bottom",
          getPixelOffset: [0, -30],
          pickable: false,
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

      // Add text labels for requests
      markerLayers.push(
        new TextLayer({
          id: "request-labels",
          data: requestMarkers,
          getPosition: d => d.position,
          getText: d => `${d.data.resource}\n${d.data.distance?.toFixed(1) || '?'} km`,
          getSize: 12,
          getColor: [255, 255, 255, 255],
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getPixelOffset: [0, 0],
          pickable: false,
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
          getColor: [34, 197, 94, 110],
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
          getColor: [34, 197, 94, 255],
          getWidth: 4,
          widthMinPixels: 2,
          widthMaxPixels: 9,
          capRounded: true,
          jointRounded: true,
          pickable: false,
        })
      );

      // Start and End point circles with glow for selected route
      const endpointData = [
        { position: [gsLocation.lon, gsLocation.lat], type: "start", distance: routeDistanceKm },
        { position: [selectedRequest.lon, selectedRequest.lat], type: "end", distance: routeDistanceKm }
      ];

      // Glow effect
      markerLayers.push(
        new ScatterplotLayer({
          id: "route-endpoints-glow",
          data: endpointData,
          getPosition: d => d.position,
          getRadius: 20,
          radiusUnits: 'pixels',
          getFillColor: d => d.type === "start" ? [0, 153, 204, 60] : [52, 211, 153, 60],
          pickable: false,
        })
      );

      // Main circle
      markerLayers.push(
        new ScatterplotLayer({
          id: "route-endpoints",
          data: endpointData,
          getPosition: d => d.position,
          getRadius: 12,
          radiusUnits: 'pixels',
          getFillColor: d => d.type === "start" ? [0, 153, 204, 255] : [52, 211, 153, 255],
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 3,
          lineWidthUnits: 'pixels',
          stroked: true,
          pickable: false,
        })
      );

      // Labels for endpoints
      markerLayers.push(
        new TextLayer({
          id: "endpoint-labels",
          data: endpointData,
          getPosition: d => d.position,
          getText: d => d.type === "start" ? "GS" : "DST",
          getSize: 11,
          getColor: [255, 255, 255, 255],
          getTextAnchor: "middle",
          getAlignmentBaseline: "center",
          getPixelOffset: [0, 0],
          fontWeight: 'bold',
          pickable: false,
        })
      );

      // Labels below endpoints
      markerLayers.push(
        new TextLayer({
          id: "endpoint-distance-labels",
          data: endpointData,
          getPosition: d => d.position,
          getText: d => `${d.type === "start" ? "START" : "END"} - ${d.distance.toFixed(1)}km`,
          getSize: 12,
          getColor: [15, 23, 42, 255],
          getTextAnchor: "middle",
          getAlignmentBaseline: "top",
          getPixelOffset: [0, 18],
          fontWeight: 'bold',
          background: true,
          getBorderColor: [255, 255, 255, 255],
          getBorderWidth: 2,
          backgroundPadding: [4, 2],
          getBackgroundColor: [255, 255, 255, 220],
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

  const isModalOpen = detailsRequest !== null || showGSSettings;

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--bg-primary)", overflow: "hidden" }}>
      {/* Left Panel */}
      <div style={{ width: "420px", flexShrink: 0, display: isModalOpen ? "none" : "flex", flexDirection: "column", borderRight: "1px solid rgba(0, 102, 204, 0.1)", height: "100%", overflowY: "auto" }}>
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
          {activeRequestsWithDistance.length === 0 ? (
            <div style={{ padding: "48px 24px", textAlign: "center" }}>
              <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.3, color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No active requests</p>
            </div>
          ) : (
            activeRequestsWithDistance.map((req, idx) => {
              const statusColor = statusColors[req.status] || [108, 125, 141];
              const statusColorHex = `rgb(${statusColor[0]}, ${statusColor[1]}, ${statusColor[2]})`;

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    if (!selectedRequest) {
                      handleSelectRequest(req);
                    }
                  }}
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
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailsRequest(req);
                        }}
                        style={{
                          background: "rgba(0, 102, 204, 0.1)",
                          border: "1px solid rgba(0, 102, 204, 0.2)",
                          borderRadius: "6px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.2s ease",
                        }}
                        title="View details"
                      >
                        <AlertCircle size={14} color="#0066cc" />
                      </button>
                      {(() => {
                        const urg = getRequestPriority(req);
                        const cfg = priorityConfig[urg] || priorityConfig.Normal;
                        return (
                          <span style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "4px 8px",
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.border}`,
                            borderRadius: "6px",
                            whiteSpace: "nowrap",
                          }}>
                            {urg}
                          </span>
                        );
                      })()}
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
                  </div>

                  {selectedRequest?.id === req.id && selectedRouteDistanceKm !== null ? null : req.distance !== null && (
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
                      {getElapsedTime(req.timestamp || req.created_at)}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {req.status === "Pending" && (
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
      <div style={{ flex: 1, position: "relative", height: "100%", filter: isModalOpen ? "blur(5px)" : "none" }}>
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
          onViewStateChange={({ viewState: vs }) => handleMapMove({ viewState: vs })}
          controller={true}
          layers={layers}
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
            attributionControl={true}
            style={{ width: "100%", height: "100%" }}
          />
        </DeckGL>

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
              <div style={{ width: "16px", height: "4px", background: "#22c55e", borderRadius: "999px" }} />
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

        {/* Zoom Controls */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 1000,
        }}>
          <button
            onClick={() => setViewState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 1, 20) }))}
            style={{
              width: "44px",
              height: "44px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))",
              border: "1px solid rgba(0, 102, 204, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: "#0066cc",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1))";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            +
          </button>
          <button
            onClick={() => setViewState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 1, 1) }))}
            style={{
              width: "44px",
              height: "44px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))",
              border: "1px solid rgba(0, 102, 204, 0.3)",
              borderRadius: "8px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              color: "#0066cc",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 1), rgba(255, 255, 255, 1))";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 102, 204, 0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95))";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            −
          </button>
        </div>

        {/* Stats Overlay - Removed */}
      </div>

      {/* Ground Station Settings Modal */}
      <GSSettingsModal
        isOpen={showGSSettings}
        onClose={() => setShowGSSettings(false)}
        gsLocation={gsLocation}
        setGsLocation={setGsLocation}
      />

      {/* Request Details Modal */}
      <RequestDetailsModal
        isOpen={detailsRequest !== null}
        onClose={() => setDetailsRequest(null)}
        request={detailsRequest}
        gsLocation={gsLocation}
      />

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
