import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, BookOpen } from "lucide-react";

const Login = () => {
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
    <div className="min-h-screen w-full bg-blue-600 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 sm:p-10 lg:p-12 border-4 border-blue-200">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl mb-4 shadow-lg">
            <BookOpen size={36} className="text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-900">
            BISUGEN
          </h1>
          <p className="text-gray-600 text-sm mt-2 text-center">Welcome back! Please login to continue</p>
        </div>

        <div onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div className="relative group w-full">
            <input
              type="text"
              placeholder=" "
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="peer w-full border-2 border-blue-200 rounded-xl px-4 pt-6 pb-2 outline-none focus:border-blue-600 shadow-sm bg-white transition-all duration-300 text-black group-hover:border-blue-300"
              disabled={isLoading}
            />
            <label className="absolute left-4 text-gray-500 text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 transition-all pointer-events-none font-medium">
              Username
            </label>
          </div>

          {/* Password */}
          <div className="relative group w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="peer w-full border-2 border-blue-200 rounded-xl px-4 pt-6 pb-2 pr-12 outline-none focus:border-blue-600 shadow-sm bg-white transition-all duration-300 text-black group-hover:border-blue-300"
              disabled={isLoading}
            />
            <label className="absolute left-4 text-gray-500 text-sm peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-blue-600 transition-all pointer-events-none font-medium">
              Password
            </label>

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-all p-1 rounded-lg hover:bg-blue-50"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg w-full">
              <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {error}
              </p>
            </div>
          )}

          {/* Button */}
          <button
            type="submit"
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </div>

        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          <p>Demo: admin123 / password123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;