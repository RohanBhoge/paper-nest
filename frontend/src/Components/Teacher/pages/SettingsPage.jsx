import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/auth/AuthContext';

const SettingsPage = () => {
  const { setAdminAuthToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("Admin_Token");
    setAdminAuthToken(null);
    navigate("/login-page");
  };

  return (
    <div className="bg-white rounded-xl p-8 lg:p-12 shadow-sm border border-slate-200 text-center">
      <h1 className="text-2xl lg:text-3xl font-bold mb-4 text-slate-900 capitalize">Settings</h1>
      <p className="text-slate-500 mb-8">This section is under development</p>
      
      <div className="flex justify-center">
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;