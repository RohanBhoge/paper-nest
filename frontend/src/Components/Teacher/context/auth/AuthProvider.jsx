import AuthContext from "./AuthContext.jsx";
import { useState } from "react";

const AuthProvider = (props) => {
  const [adminAuthToken, setAdminAuthToken] = useState(
    localStorage.getItem("Admin_Token")
      ? localStorage.getItem("Admin_Token")
      : null
  );

  const [userClassName, setUserClassName] = useState(
    localStorage.getItem("Class_Name")
      ? localStorage.getItem("Class_Name")
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
      value={{ adminAuthToken, setAdminAuthToken, BackendUrl, userClassName, setUserClassName, watermark, setWatermark }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};  

export default AuthProvider;