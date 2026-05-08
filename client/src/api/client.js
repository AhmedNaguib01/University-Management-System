import axios from "axios";
import { toast } from "sonner";

// Create axios instance
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json",},
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const session = localStorage.getItem("eduverse_session");
    if (session) {
      try {
        const { token } = JSON.parse(session);
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error parsing session:", error);
      }
    }
    return config;
  },
  (error) => {return Promise.reject(error);}
);

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear session and redirect to login
          localStorage.removeItem("eduverse_session");
          if (window.location.pathname !== "/auth") window.location.href = "/auth";
          toast.error(data.error || "Authentication required");
          break;

        case 403:
          toast.error( data.error || "You don't have permission to perform this action" );
          break;

        case 404:
          toast.error(data.error || "Resource not found");
          break;

        case 409:
          toast.error(data.error || "Conflict - resource already exists");
          break;

        case 500:
          toast.error(data.error || "Server error. Please try again later");
          break;

        default:
          toast.error(data.error || "An error occurred");
      }
    } else if (error.request) { toast.error("Network error. Please check your connection");
    } else { toast.error("An unexpected error occurred"); }

    return Promise.reject(error);
  }
);

export default apiClient;