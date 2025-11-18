import AuthContext from "./AuthContext.jsx";
import { useState } from "react";

const AuthProvider = (props) => {
  const [adminAuthToken, setAdminAuthToken] = useState(
    localStorage.getItem("Admin_Token")
      ? localStorage.getItem("Admin_Token")
      : null
  );

  const BackendUrl = "http://localhost:5000";

  console.log(adminAuthToken);
  return (
    <AuthContext.Provider
      value={{ adminAuthToken, setAdminAuthToken, BackendUrl }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};  

export default AuthProvider;
