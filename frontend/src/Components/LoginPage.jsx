import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import axios from "axios";
import AuthContext from "./Teacher/context/auth/AuthContext.jsx";

// =====================================================================
// MOCK AUTH CONTEXT DEFINITION
// NOTE: This is a placeholder to resolve the import error.
// Replace AuthContext and its default values with your actual context
// object if it resides in a different file.
// =====================================================================

// Since the original file used 'AuthProvider' in useContext,
// we assume the user intended to use the context object itself (AuthContext).
// If your actual context object is named AuthProvider, change AuthContext below to AuthProvider.
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Destructure context values using the mock/defined context
  const { BackendUrl, setAdminAuthToken } = useContext(AuthContext);

  console.log(BackendUrl);
  // 1. Function using Axios to handle the login request
  const loginUser = async (userEmail, userPassword) => {
    try {
      setIsLoading(true);
      setError(null);

      // Construct the full login URL using the context value
      const loginUrl = BackendUrl + "/api/v1/auth/login";

      // Axios automatically serializes the data to JSON
      const response = await axios.post(loginUrl, {
        email: userEmail,
        password: userPassword,
      });

      // Successful login - returns the response data (which should contain the token)
      return response.data;
    } catch (err) {
      // Axios error handling: 4xx or 5xx status codes
      if (err.response) {
        setError(
          err.response.data.message ||
            "Login failed. Please check your credentials."
        );
      } else if (err.request) {
        // Network error (no response received)
        setError(
          "No response from the server. Please check your network connection."
        );
      } else {
        // Unexpected error
        setError("An unexpected error occurred during login.");
      }
      return null;
    } finally {
      // Ensure loading state is turned off regardless of success or failure
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    // Call the Axios login function
    const userData = await loginUser(email, password);

    if (userData) {
      // --- START OF REQUIRED TOKEN HANDLING LOGIC ---
      // We assume the token is returned in userData.token.
      if (userData.token) {
        // Set the token in localStorage
        localStorage.setItem("Admin_Token", userData.token);

        // Set the token in the context
        setAdminAuthToken(
          localStorage.getItem("Admin_Token") || userData.token
        );
      }
      // --- END OF REQUIRED TOKEN HANDLING LOGIC ---

      // Conditional navigation based on data from the backend
      // In a real application, you should navigate based on the user's role/permissions
      if (userData.user.email === email) {
        // This is a placeholder check
        navigate("/teacher-dashboard");
      } else {
        navigate("/notes-dashboard");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <div className="flex flex-col items-center mb-10">
          <BookOpen size={48} className="text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-blue-600">BISUGEN</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-7">
          <div className="relative">
            <input
              type="email"
              placeholder=" "
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

          {/* Display Error Message */}
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
