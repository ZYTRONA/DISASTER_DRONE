import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { socket } from "../services/socket";
import { api } from "../services/api";

const RequestsContext = createContext(null);

function getRequestId(request) {
  return request?.id || request?._id;
}

function sameRequest(left, right) {
  return String(getRequestId(left)) === String(getRequestId(right));
}

export function RequestsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refreshRequests = useCallback(async (reason = "manual") => {
    try {
      const data = await api.getRequests();
      setRequests(Array.isArray(data) ? data : []);
      return true;
    } catch (err) {
      console.error("[API] Failed to load requests:", err);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchRequests = async (reason = "poll") => {
      try {
        if (reason === "initial") setLoading(true);
        const data = await api.getRequests();
        if (cancelled) return;
        setRequests(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        console.error("[API] Failed to load requests:", err);
        // Keep existing list if polling fails
        if (reason === "initial") setRequests([]);
      } finally {
        if (!cancelled && reason === "initial") setLoading(false);
      }
    };

    // Load initial requests
    console.log("[API] Fetching requests from backend...");
    fetchRequests("initial");

    // Poll DB every 30 seconds as a safety net (keeps UI correct even if socket drops)
    const pollId = setInterval(() => fetchRequests("poll"), 30000);

    // Socket connection status
    socket.on("connect", () => {
      console.log("[Socket] Connected");
      setConnected(true);
    });
    socket.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setConnected(false);
    });
    setConnected(socket.connected);

    // Listen for new requests
    socket.on("new_request", (request) => {
      console.log("[Socket] New request received:", request);
      setRequests((prev) => {
        const incomingId = getRequestId(request);
        if (incomingId && prev.some((item) => String(getRequestId(item)) === String(incomingId))) {
          return prev.map((item) => sameRequest(item, request) ? { ...item, ...request } : item);
        }
        return [request, ...prev];
      });
    });

    // Listen for status updates
    socket.on("request_update", (update) => {
      console.log("[Socket] Request update received:", update);
      setRequests((prev) =>
        prev.map((r) => (sameRequest(r, update) ? { ...r, ...update } : r))
      );
    });

    return () => {
      cancelled = true;
      clearInterval(pollId);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("new_request");
      socket.off("request_update");
    };
  }, []);

  const updateStatus = async (requestId, status) => {
    try {
      let result = null;
      if (status === "Delivered") {
        result = await api.updateRequestStatus(requestId);
      } else if (status === "In Transit") {
        result = await api.launchDrone(requestId);
      } else if (status === "Assigned") {
        result = await api.autoAssignRequest(requestId);
      } else {
        // Fallback: let backend socket handler try, but keep UI responsive.
        socket.emit("status_update", { id: requestId, status });
      }

      const serverRow = result?.request || result?.data?.request || result?.request_data;
      if (serverRow) {
        setRequests((prev) =>
          prev.map((r) => (sameRequest(r, serverRow) ? { ...r, ...serverRow } : r))
        );
      } else {
        setRequests((prev) =>
          prev.map((r) => (String(getRequestId(r)) === String(requestId) ? { ...r, status } : r))
        );
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const acceptRequest = async (requestId, droneId = null) => {
    try {
      const result = droneId
        ? await api.assignRequest(requestId, droneId)
        : await api.autoAssignRequest(requestId);

      const serverRow = result?.request;
      if (serverRow) {
        setRequests((prev) =>
          prev.map((r) => (sameRequest(r, serverRow) ? { ...r, ...serverRow } : r))
        );
      } else {
        setRequests((prev) =>
          prev.map((r) => (String(getRequestId(r)) === String(requestId) ? { ...r, status: "Assigned" } : r))
        );
      }
      return true;
    } catch (err) {
      console.error("Failed to accept request:", err);
      return false;
    }
  };

  const setInTransit = async (requestId) => {
    try {
      const result = await api.launchDrone(requestId); // Call API first
      const serverRow = result?.request;
      if (serverRow) {
        setRequests((prev) =>
          prev.map((r) => (sameRequest(r, serverRow) ? { ...r, ...serverRow } : r))
        );
      } else {
        setRequests((prev) =>
          prev.map((r) => (String(getRequestId(r)) === String(requestId) ? { ...r, status: "In Transit" } : r))
        );
      }
      return true;
    } catch (err) {
      console.error("Failed to set in transit:", err);
      return false;
    }
  };

  const markDelivered = async (requestId) => {
    try {
      const result = await api.updateRequestStatus(requestId);
      const serverRow = result?.request;
      if (serverRow) {
        setRequests((prev) =>
          prev.map((r) => (sameRequest(r, serverRow) ? { ...r, ...serverRow } : r))
        );
      } else {
        setRequests((prev) =>
          prev.map((r) => (String(getRequestId(r)) === String(requestId) ? { ...r, status: "Delivered" } : r))
        );
      }
      return true;
    } catch (err) {
      console.error("Failed to mark delivered:", err);
      return false;
    }
  };

  return (
    <RequestsContext.Provider
      value={{ requests, loading, connected, refreshRequests, updateStatus, acceptRequest, setInTransit, markDelivered }}
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
