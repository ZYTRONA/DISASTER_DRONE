import { io } from "socket.io-client";

// Environment-based Socket.IO configuration
const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
const SOCKET_TRANSPORTS = (import.meta.env.VITE_SOCKET_TRANSPORTS || "polling")
  .split(",")
  .map((transport) => transport.trim())
  .filter(Boolean);

console.log("[Socket] Configured for:", BACKEND_URL);

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: SOCKET_TRANSPORTS,
  // Add auth header when available (for future JWT implementation)
  extraHeaders: {
    "User-Agent": "NDRF-GroundStation/1.0",
  },
  withCredentials: true,  // Allow credentials across origins
});

socket.on("connect", () => {
  console.log("[Socket] ✅ Connected to backend:", socket.id);
  // Join ground-control room so backend can target GCS-only events (e.g. new_request)
  try {
    socket.emit("join", { room: "gcs" });
  } catch (_) {}
});

socket.on("disconnect", (reason) => {
  console.log("[Socket] ⚠️  Disconnected from backend:", reason);
  if (reason === "transport error") {
    console.warn("[Socket] Transport error - reconnecting with polling...");
  }
});

socket.on("connect_error", (error) => {
  console.error("[Socket] ❌ Connection error:", error?.message || error);
  if (error?.message?.includes("transport")) {
    console.warn("[Socket] Switching to polling transport...");
  }
});

socket.on("error", (error) => {
  console.error("[Socket] Socket error:", error);
});

/**
 * Socket event listeners for real-time updates
 */

// Drone telemetry updates
socket.on("telemetry:update", (data) => {
  console.log("[Socket] Telemetry update:", data);
  window.dispatchEvent(
    new CustomEvent("droneUpdate", { detail: data })
  );
});

// Request updates (backend emits request_update + status_update)
socket.on("request_update", (data) => {
  console.log("[Socket] Request update:", data);
  window.dispatchEvent(
    new CustomEvent("requestUpdate", { detail: data })
  );
});

socket.on("status_update", (data) => {
  console.log("[Socket] Status update:", data);
  window.dispatchEvent(
    new CustomEvent("requestStatusUpdate", { detail: data })
  );
});

// General broadcast messages
socket.on("broadcast", (data) => {
  console.log("[Socket] Broadcast message:", data);
  window.dispatchEvent(
    new CustomEvent("socketBroadcast", { detail: data })
  );
});

export default socket;
