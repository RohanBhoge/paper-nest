import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import AdminDashboard1 from "./pages/AdminDashboard";
import LoginPage from "./Components/LoginPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import NotesDashboard from "./pages/NotesDashboard";
import OmrIntegratedPage from "./Components/Teacher/pages/test";
import PaperProvider from "./Components/Teacher/context/paper/PaperProvider.jsx";
import AuthProvider from "./Components/Teacher/context/auth/AuthProvider.jsx";
import GeneratedTemplate from "./Components/Teacher/Dashboard/GeneratedTemplate.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PaperProvider>
          <Routes>
            <Route path="/" element={<AdminDashboard1 />} />
            <Route path="/login-page" element={<LoginPage />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
            <Route path="/notes-dashboard" element={<NotesDashboard />} />
            <Route path="/test" element={<OmrIntegratedPage />} />
            <Route path="/paper-view" element={<GeneratedTemplate />} />
          </Routes>
        </PaperProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
