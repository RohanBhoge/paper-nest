import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import api from "../api";
import AuthContext from "./Teacher/context/auth/AuthContext.jsx";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { BackendUrl, setAdminAuthToken, setLogo, setWatermark } = useContext(AuthContext);

  // 💡 Auto-redirect if already logged in
  React.useEffect(() => {
    const token = localStorage.getItem("Admin_Token");

    if (token) {
      navigate("/admin-dashboard", { replace: true });
    }
  }, [navigate]);

  // Login using axios
  const loginUser = async (userEmail, userPassword) => {
    try {
      setIsLoading(true);
      setError(null);

      const loginUrl = BackendUrl + "/api/v1/auth/login";

      const response = await api.post(
        loginUrl,
        {
          email: userEmail,
          password: userPassword,
        },
        {
          withCredentials: true, // Important for cookies
        }
      );

      api.interceptors.response.use(
        (response) => response, // Pass through successful responses
        (error) => {
          if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            // 1. Clear local storage/state
            localStorage.removeItem('user_data');

            // 2. Redirect to login
            window.location.href = '/login-page';
          }
          return Promise.reject(error);
        }
      );

      return response.data;
    } catch (err) {
      console.error("Login Error Details:", err);
      if (err.response) {
        // Server responded with a status code outside of 2xx
        setError(
          err.response.data.error ||
          err.response.data.message ||
          `Login failed (${err.response.status}). Check credentials.`
        );
      } else if (err.request) {
        // Request was made but no response received (CORS or Network Error)
        console.error("No response received:", err.request);
        setError(
          "Unable to reach the server. This could be a Network Error or CORS issue. Please check console logs."
        );
      } else {
        setError("An unexpected error occurred during login setup.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // 💡 HARDCODED STUDENT LOGIN (Bypass Backend)
    if (email === "student@gmail.com" && password === "student123") {
      const mockToken = "mock-student-token-123";
      localStorage.setItem("Admin_Token", mockToken);
      localStorage.setItem("User_Role", "student");
      setAdminAuthToken(mockToken);
      navigate("/notes-dashboard");
      return;
    }

    const userData = await loginUser(email, password);

    if (!userData) {
      console.log("Login failed user data is null");
      return; // Stop if login failed
    }

    // Save token
    if (userData.token) {
      localStorage.setItem("Admin_Token", userData.token);
      setAdminAuthToken(userData.token);
    }

    // 💡 NEW: Save Class Name and Watermark
    if (userData.data) {
      if (userData.data.logo_url) {
        localStorage.setItem("Class_Name", userData.data.class_name);
        setLogo(userData.data.logo_url);
      }
      if (userData.data.watermark) {
        localStorage.setItem("Watermark", userData.data.watermark);
        setWatermark(userData.data.watermark);
      }
    }
    navigate("/admin-dashboard");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <div className="flex flex-col items-center mb-10">
          <BookOpen size={48} className="text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-blue-600">PAPERNEST</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-7">
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="peer w-full border border-slate-300 rounded-xl px-4 pt-6 pb-2 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white transition-all duration-300"
              disabled={isLoading}
            />
            <label className="absolute left-4 text-slate-500 text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
              Email
            </label>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer w-full border border-slate-300 rounded-xl px-4 pt-6 pb-2 pr-12 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white transition-all duration-300"
              disabled={isLoading}
            />
            <label className="absolute left-4 text-slate-500 text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
              Password
            </label>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-blue-600 transition-all"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-center text-sm font-medium">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 hover:scale-105 transition-transform duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          <p className="text-center text-sm text-slate-500 mt-2">
            Forgot your password?{" "}
            <span className="text-blue-600 cursor-pointer hover:underline">
              Reset
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;