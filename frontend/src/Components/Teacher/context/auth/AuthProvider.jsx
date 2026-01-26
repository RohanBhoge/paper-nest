import AuthContext from "./AuthContext.jsx";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setupInterceptors } from "../../../../api";

const AuthProvider = (props) => {
  // For cookie auth, we use isAuthenticated flag
  const [adminAuthToken, setAdminAuthToken] = useState(() => {
    const isAuth = localStorage.getItem("isAuthenticated");
    return isAuth === "true" ? "cookie-auth" : null;
  });

  const [logo, setLogo] = useState(
    localStorage.getItem("Logo")
      ? localStorage.getItem("Logo")
      : null
  );

  const [watermark, setWatermark] = useState(
    localStorage.getItem("Watermark")
      ? localStorage.getItem("Watermark")
      : null
  );

  const BackendUrl = import.meta.env.VITE_BACKEND_URL || "https://notes-app-plum-three.vercel.app";

  // Sync logo changes to localStorage
  useEffect(() => {
    if (logo) {
      localStorage.setItem("Logo", logo);
    }
  }, [logo]);

  // Sync watermark changes to localStorage
  useEffect(() => {
    if (watermark) {
      localStorage.setItem("Watermark", watermark);
    }
  }, [watermark]);

  const navigate = useNavigate();

  // 🔄 Initialize Interceptors with Navigation
  useEffect(() => {
    setupInterceptors(navigate);
  }, [navigate]); // navigate is stable, but good to include

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("User_Role");
    localStorage.removeItem("Logo");
    localStorage.removeItem("Watermark");
    setAdminAuthToken(null);
    setLogo(null);
    setWatermark(null);
  };

  return (
    <AuthContext.Provider
      value={{ adminAuthToken, setAdminAuthToken, BackendUrl, logo, setLogo, watermark, setWatermark, handleLogout }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;