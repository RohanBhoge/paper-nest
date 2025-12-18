import AuthContext from "./AuthContext.jsx";
import { useState } from "react";

const AuthProvider = (props) => {
  const [adminAuthToken, setAdminAuthToken] = useState(
    localStorage.getItem("Admin_Token")
      ? localStorage.getItem("Admin_Token")
      : null
  );

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
  const BackendUrl = import.meta.env.VITE_BACKEND_URL;

  console.log(adminAuthToken);
  return (
    <AuthContext.Provider
      value={{ adminAuthToken, setAdminAuthToken, BackendUrl, logo, setLogo, watermark, setWatermark }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};  

export default AuthProvider;