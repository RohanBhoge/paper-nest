import React from "react";
import { FileText, BookOpen, Calendar, Lightbulb, Users, GraduationCap, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AdminDashboard1 = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-white px-6 md:px-12 py-8 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 animate-fade-in">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg transform hover:rotate-12 transition-transform duration-300">
              <GraduationCap className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 tracking-tight">
                PAPERNEST
              </h1>
              <p className="text-slate-500 text-sm mt-1 font-medium">Empowering Education Through Innovation</p>
            </div>
          </div>
          
        </header>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-slide-up">
          {/* Paper Generation Card */}
          <div className="relative bg-white/95 backdrop-blur-xl border border-blue-200/30 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-500 p-8 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl group-hover:blur-xl transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md transform group-hover:scale-110 transition-transform duration-300">
                  <FileText className="text-white" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                  Paper Generation
                </h2>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed text-base">
                Create and manage customized question papers effortlessly with advanced randomization and balance.
              </p>
              <button
                onClick={() => navigate("/teacher-dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-2"
              >
                Open
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div className="relative bg-white/95 backdrop-blur-xl border border-blue-200/30 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-500 p-8 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl group-hover:blur-xl transition-all duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md transform group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="text-white" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-300">
                  Notes
                </h2>
              </div>
              <p className="text-slate-600 mb-6 leading-relaxed text-base">
                Upload and share class notes with your students seamlessly, ensuring instant access and collaboration.
              </p>
              <button
                onClick={() => navigate("/notes-dashboard")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-2"
              >
                Open
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mt-12 bg-white/95 backdrop-blur-xl border border-blue-200/30 rounded-2xl shadow-xl p-8 animate-slide-up-delayed">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
              <Calendar className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Upcoming Events
            </h2>
          </div>
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-102">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={20} />
              </div>
              <div>
                <span className="font-semibold text-lg text-slate-800">Parent-Teacher Meeting</span>
                <p className="text-slate-500 text-sm">Sep 30, 2025</p>
              </div>
            </li>
            <li className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-102">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="text-blue-600" size={20} />
              </div>
              <div>
                <span className="font-semibold text-lg text-slate-800">Midterm Exams</span>
                <p className="text-slate-500 text-sm">Oct 10, 2025</p>
              </div>
            </li>
            <li className="flex items-center gap-4 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-102">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Lightbulb className="text-blue-600" size={20} />
              </div>
              <div>
                <span className="font-semibold text-lg text-slate-800">Workshop on AI in Education</span>
                <p className="text-slate-500 text-sm">Oct 15, 2025</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Quick Tips */}
        <div className="mt-10 bg-white/95 backdrop-blur-xl border border-blue-200/30 rounded-2xl shadow-xl p-8 animate-slide-up-delayed">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md">
              <Lightbulb className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">
              Quick Tips
            </h2>
          </div>
          <ul className="space-y-4 text-slate-700">
            <li className="flex items-start gap-4 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-102">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <FileText className="text-blue-600" size={20} />
              </div>
              <div>
                <span className="font-medium text-base text-slate-800">
                  Use <span className="text-blue-600 font-semibold">Paper Generation</span> to create balanced and randomized tests for optimal assessment.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-4 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-102">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <BookOpen className="text-blue-600" size={20} />
              </div>
              <div>
                <span className="font-medium text-base text-slate-800">
                  Share <span className="text-blue-600 font-semibold">Notes</span> quickly after each class to keep students engaged and informed.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-4 p-4 bg-gradient-to-r from-white to-blue-50 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-102">
              <div className="p-2 bg-blue-100 rounded-lg mt-1">
                <Lightbulb className="text-blue-600" size={20} />
              </div>
              <div>
                <span className="font-medium text-base text-slate-800">All data is auto-saved securely in the system for peace of mind.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up-delayed {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 1.2s ease-out;
        }
        .animate-slide-up-delayed {
          animation: slide-up-delayed 1.4s ease-out 0.3s both;
        }
        .transform:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard1;
