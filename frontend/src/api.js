import axios from "axios";

// Create a configured axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:8080", // Fallback if env var missing
    withCredentials: true,
});

// Variable to hold the navigate function
let navigate = null;

// Function to inject navigate from a component (AuthProvider)
export const setupInterceptors = (navigateFn) => {
    navigate = navigateFn;
};

// Add response interceptor
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("[API] 401 Unauthorized detected. Logging out...");

            // Clear local storage
            localStorage.removeItem("isAuthenticated");
            localStorage.removeItem("User_Role");
            localStorage.removeItem("Logo");
            localStorage.removeItem("Watermark");
            localStorage.removeItem("user_data"); // Added this as user was using it

            // Redirect if navigate function is available
            if (navigate) {
                navigate("/login-page");
            } else {
                // Fallback if navigate isn't set yet (rare)
                window.location.href = "/login-page";
            }
        }
        return Promise.reject(error);
    }
);

export default api;