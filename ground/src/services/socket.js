import { io } from "socket.io-client";

// Environment-based Socket.IO configuration
const BACKEND_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

console.log("[Socket] Configured for:", BACKEND_URL);

export const socket = io(BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,  // Keep trying indefinitely
  reconnectionDelay: 500,
  reconnectionDelayMax: 10000,
  transports: ["websocket", "http_long_polling", "http_polling"],  // Multiple fallback transports
  timeout: 10000,  // Connection timeout
  forceNew: false,
  // Add auth header when available (for future JWT implementation)
  extraHeaders: {
    "User-Agent": "zydro-GroundStation/1.0",
  },
  withCredentials: true,  // Allow credentials across origins
});

socket.on("connect", () => {
  console.log("[Socket] ✅ Connected to backend:", socket.id);
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

// Request status updates
socket.on("request:status", (data) => {
  console.log("[Socket] Request status update:", data);
  window.dispatchEvent(
    new CustomEvent("requestStatusUpdate", { detail: data })
  );
});

// Drone status changes
socket.on("drone:status", (data) => {
  console.log("[Socket] Drone status:", data);
  window.dispatchEvent(
    new CustomEvent("droneStatusUpdate", { detail: data })
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
