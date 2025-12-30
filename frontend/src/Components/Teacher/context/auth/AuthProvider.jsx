import AuthContext from "./AuthContext.jsx";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthProvider = (props) => {
  const [adminAuthToken, setAdminAuthToken] = useState(() => {
    const token = localStorage.getItem("Admin_Token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          console.log("Token expired, clearing storage");
          localStorage.removeItem("Admin_Token");
          localStorage.removeItem("Logo");
          localStorage.removeItem("Watermark");
          return null;
        }
        return token;
      } catch (error) {
        console.error("Invalid token:", error);
        localStorage.removeItem("Admin_Token");
        return null;
      }
    }
    return null;
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
  const rawBackendUrl = import.meta.env.VITE_BACKEND_URL;
  const BackendUrl = rawBackendUrl.startsWith("https://") 
  ? rawBackendUrl.replace("https://", "http://") 
  : rawBackendUrl;

  // Auto-logout effect
  useEffect(() => {
    if (!adminAuthToken) return;

    try {
      const decoded = jwtDecode(adminAuthToken);
      const expirationTime = decoded.exp * 1000;
      const currentTime = Date.now();
      const timeRemaining = expirationTime - currentTime;

      if (timeRemaining <= 0) {
        // Already expired
        handleLogout();
      } else {
        console.log(`Auto-logout scheduled in ${timeRemaining / 1000} seconds`);
        const timer = setTimeout(() => {
           console.log("Session expired, logging out...");
           handleLogout();
        }, timeRemaining);

        return () => clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error decoding token for timer:", error);
      handleLogout();
    }
  }, [adminAuthToken]);

  const handleLogout = () => {
    localStorage.removeItem("Admin_Token");
    localStorage.removeItem("Logo");
    localStorage.removeItem("Watermark");
    setAdminAuthToken(null);
    setLogo(null);
    setWatermark(null);
  };

  console.log(adminAuthToken);
  return (
    <AuthContext.Provider
      value={{ adminAuthToken, setAdminAuthToken, BackendUrl, logo, setLogo, watermark, setWatermark, handleLogout }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};  

export default AuthProvider;