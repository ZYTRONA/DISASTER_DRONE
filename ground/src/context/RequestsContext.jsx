import { createContext, useContext, useState, useEffect } from "react";
import { socket } from "../services/socket";
import { api } from "../services/api";

const RequestsContext = createContext(null);

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Load initial requests
    console.log("[API] Fetching requests from backend...");
    api.getRequests()
      .then((data) => {
        console.log("[API] Received requests:", data);
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[API] Failed to load requests:", err);
        setRequests([]);
        setLoading(false);
      });

    // Socket connection status
    socket.on("connect", () => {
      console.log("[Socket] Connected");
      setConnected(true);
      socket.emit("join", { room: "gcs" });
    });
    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    });
    setConnected(socket.connected);
    if (socket.connected) {
      socket.emit("join", { room: "gcs" });
    }

    // Listen for status updates
    socket.on("request_update", (update) => {
      console.log("[Socket] Request update received:", update);
      setRequests((prev) =>
        prev.map((r) =>
          (r.id === update.id || r.id === update._id || r._id === update.id || r._id === update._id)
            ? { ...r, ...update, id: r.id }
            : r
        )
      );
    });

    // Listen for new requests
    socket.on("new_request", (request) => {
      console.log("[Socket] New request received:", request);
      // Normalize: ensure id field is always present
      const normalized = { ...request, id: request.id || request._id };
      setRequests((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r.id === normalized.id || r._id === normalized._id)) return prev;
        return [normalized, ...prev];
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_request");
      socket.off("request_update");
    };
  }, []);

  const updateStatus = async (requestId, status) => {
    try {
      await api.updateRequestStatus(requestId, status);
      socket.emit("status_update", { id: requestId, status });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const acceptRequest = async (requestId, droneId = null) => {
    try {
      if (droneId) {
        await api.assignRequest(requestId, droneId);
      } else {
        await api.autoAssignRequest(requestId);
      }
      socket.emit("status_update", { id: requestId, status: "Assigned" });
      // Update local state immediately for responsiveness
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "Assigned" } : r))
      );
      return true;
    } catch (err) {
      console.error("Failed to accept request:", err);
      return false;
    }
  };

  const setInTransit = async (requestId) => {
    try {
      await api.launchDrone(requestId); // Call API first
      socket.emit("status_update", { id: requestId, status: "In Transit" });
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "In Transit" } : r))
      );
      return true;
    } catch (err) {
      console.error("Failed to set in transit:", err);
      return false;
    }
  };

  const markDelivered = async (requestId) => {
    try {
      await api.updateRequestStatus(requestId, "Delivered");
      socket.emit("status_update", { id: requestId, status: "Delivered" });
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "Delivered" } : r))
      );
      return true;
    } catch (err) {
      console.error("Failed to mark delivered:", err);
      return false;
    }
  };

  return (
    <RequestsContext.Provider
      value={{ requests, loading, connected, updateStatus, acceptRequest, setInTransit, markDelivered }}
    >
      {children}
    </RequestsContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestsContext);
  if (!context) {
    throw new Error("useRequests must be used within RequestsProvider");
  }
  return context;
}
