// Environment-based API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const REQUEST_TIMEOUT = 10000; // 10 seconds

console.log("[API] Initialized with URL:", API_URL);

/**
 * Centralized fetch wrapper with error handling, timeouts, and auth support
 * @param {string} endpoint - API endpoint path (e.g., '/requests')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} - Parsed JSON response
 * @throws {Error} - With status code and detailed error message
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const defaultHeaders = {
    "Content-Type": "application/json",
    "User-Agent": "NDRF-GroundStation/1.0",
  };

  // Add auth token if available (for future JWT implementation)
  const token = localStorage.getItem("authToken");
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: res.statusText }));
      const errorMsg = errorData.message || errorData.error || res.statusText;
      const error = new Error(`API Error (${res.status}): ${errorMsg}`);
      error.status = res.status;
      error.data = errorData;
      console.error("[API Error]", url, error);
      throw error;
    }

    return await res.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("[API Timeout]", url, "Request exceeded", REQUEST_TIMEOUT, "ms");
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT}ms`);
    }
    console.error("[API Error]", url, error.message);
    throw error;
  }
}

export const api = {
  /**
   * Fetch all active requests
   */
  async getRequests() {
    return fetchAPI("/requests");
  },

  /**
   * Search requests with filters
   * @param {object} filters - Query filters (status, resource, dateRange, location, radius)
   */
  async searchRequests(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value);
      }
    });
    return fetchAPI(`/requests/search?${params.toString()}`);
  },

  /**
   * Assign request to specific drone
   * @param {string} requestId - Request ID to assign
   * @param {string} droneId - Drone ID to assign to
   */
  async assignRequest(requestId, droneId) {
    return fetchAPI(`/assign/${requestId}`, {
      method: "POST",
      body: JSON.stringify({ drone_id: droneId }),
    });
  },

  /**
   * Auto-assign request to optimal available drone
   * @param {string} requestId - Request ID to auto-assign
   */
  async autoAssignRequest(requestId) {
    return fetchAPI(`/assign/${requestId}/auto`, {
      method: "POST",
    });
  },

  /**
   * Launch drone for delivery (transition to in-transit)
   * @param {string} requestId - Request ID to launch
   */
  async launchDrone(requestId) {
    return fetchAPI(`/in-transit/${requestId}`, {
      method: "POST",
    });
  },

  /**
   * Mark delivery as complete
   * @param {string} requestId - Request ID that was delivered
   */
  async updateRequestStatus(requestId) {
    return fetchAPI(`/deliver/${requestId}`, {
      method: "POST",
    });
  },

  /**
   * Fetch telemetry data for all active drones
   */
  async getTelemetry() {
    return fetchAPI("/telemetry");
  },

  /**
   * Get list of all available drones
   */
  async getDrones() {
    return fetchAPI("/drones");
  },

  /**
   * Get specific drone telemetry stream
   * @param {string} droneId - Drone ID to monitor
   */
  async getDroneTelemetry(droneId) {
    return fetchAPI(`/drones/${droneId}/telemetry`);
  },

  /**
   * ===== AUTHENTICATION ENDPOINTS (Future Implementation) =====
   */

  /**
   * Login user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   */
  async login(email, password) {
    const response = await fetchAPI("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (response.token) {
      localStorage.setItem("authToken", response.token);
    }
    return response;
  },

  /**
   * Logout user (clear local token)
   */
  async logout() {
    localStorage.removeItem("authToken");
    try {
      return await fetchAPI("/auth/logout", { method: "POST" });
    } catch (error) {
      console.warn("Logout API call failed, but token cleared locally");
    }
  },

  /**
   * Get current user info
   */
  async getCurrentUser() {
    return fetchAPI("/auth/me");
  },
};
