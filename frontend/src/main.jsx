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
import  DashboardContent  from "./Components/Teacher/Dashboard/DashboardContent.jsx";
import  SubjectsPage  from "./Components/Teacher/pages/SubjectsPage.jsx";
import  ExamClasses  from "./Components/Teacher/pages/ExamClasses.jsx";
import ChaptersPage from "./Components/Teacher/pages/ChaptersPage.jsx";
import OmrPage from "./Components/Teacher/pages/OmrPage.jsx";
import PaperHistoryPage from "./Components/Teacher/pages/PaperHistoryPage.jsx";
import SettingsPage from "./Components/Teacher/pages/SettingsPage.jsx";

// Notes Imports
import NotesDashboardContent from "./Components/Notes/Dashboard/DashboardContent.jsx";
import ExamSelection from "./Components/Notes/Exam/ExamSelection.jsx";
import NotesChaptersPage from "./Components/Notes/Chapters/ChaptersPage.jsx";
import GeneratedTemplate from "./Components/Teacher/Dashboard/GeneratedTemplate.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ContactPage from "./Components/contactUs.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PaperProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin-dashboard" element={<AdminDashboard1 />} />
            <Route path="/login-page" element={<LoginPage />} />
            <Route path="/teacher-dashboard" element={<TeacherDashboard />}>
                <Route index element={<DashboardContent />} />
                <Route path="exam" element={<ExamClasses />} />
                <Route path="subjects" element={<SubjectsPage />} />
                <Route path="chapters" element={<ChaptersPage />} />
                <Route path="omr" element={<OmrPage />} />
                <Route path="paperHistory" element={<PaperHistoryPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="/notes-dashboard" element={<NotesDashboard />}>
                <Route index element={<NotesDashboardContent />} />
                <Route path="exam" element={<ExamSelection />} />
                <Route path="chapters" element={<NotesChaptersPage />} />
                <Route path="settings" element={<SettingsPage />} />
            </Route>    
            
            
            {/* <Route path="/test" element={<OmrIntegratedPage />} /> */}
            <Route path="/paper-view" element={<GeneratedTemplate />} />
            <Route path="/contact-us" element={<ContactPage />} />
          </Routes>
        </PaperProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);