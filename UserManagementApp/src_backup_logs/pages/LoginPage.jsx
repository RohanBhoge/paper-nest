import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen } from "lucide-react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  // 🔐 Hardcoded credentials
  const VALID_USERNAME = "admin123";
  const VALID_PASSWORD = "password123";

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      if (
        username === VALID_USERNAME &&
        password === VALID_PASSWORD
      ) {
        navigate("/home"); // ⭐ Redirect to Home page
      } else {
        setError("Invalid username or password!");
      }

      setIsLoading(false);
    }, 700); // Fake loading effect
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-blue-200">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md transform transition-all duration-500 hover:scale-105">
        <div className="flex flex-col items-center mb-10">
          <BookOpen size={48} className="text-blue-600 mb-4" />
          <h1 className="text-3xl font-bold text-blue-600">BISUGEN</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-7">
          {/* Username */}
          <div className="relative">
            <input
              type="text"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="peer w-full border border-slate-300 rounded-xl px-4 pt-6 pb-2 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white transition-all duration-300 text-black"
              disabled={isLoading}
            />
            <label className="absolute left-4 text-slate-500 text-sm peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-focus:top-1 peer-focus:text-sm peer-focus:text-blue-600 transition-all">
              Username
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer w-full border border-slate-300 rounded-xl px-4 pt-6 pb-2 pr-12 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white transition-all duration-300 text-black"
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

          {/* Error */}
          {error && (
            <p className="text-red-500 text-center text-sm font-medium">
              ⚠️ {error}
            </p>
          )}

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 hover:scale-105 transition-transform duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
