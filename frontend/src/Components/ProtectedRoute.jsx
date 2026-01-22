import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "./Teacher/context/auth/AuthContext";

const ProtectedRoute = () => {
  const { adminAuthToken } = useContext(AuthContext);

  // For cookie-based auth, check isAuthenticated flag instead of token
  const isAuth = localStorage.getItem("isAuthenticated") === "true";
  const token = adminAuthToken || isAuth;

  if (!token) {
    return <Navigate to="/login-page" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
