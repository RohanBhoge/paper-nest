import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import RegisterUser from "./components/RegisterUser";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";


const App = () => {
  return (  
    <Router>
      
        <Routes>
          
          <Route path="/" element={<LoginPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      
    </Router>
  );
};

export default App;