import { ArrowLeft } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom"; // Added useNavigate
import { useEffect } from "react";

const ExamClasses = () => {
  const navigate = useNavigate();
  const { selectedExam, handleClassClick, setActiveSection } = useOutletContext();

  // 💡 Redirect if state is lost
  useEffect(() => {
    if (!selectedExam) {
        navigate("/teacher-dashboard", { replace: true });
    }
  }, [selectedExam, navigate]);

  if (!selectedExam) return null;

  return (
  <div>
    <button
      onClick={() => setActiveSection("dashboard")}
      className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg mb-6 hover:bg-slate-200 transition-all duration-200"
    >
      <ArrowLeft size={16} /> Back to Dashboard
    </button>

    <div className="mb-4">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedExam}</h1>
      <p className="text-slate-600 mb-2">Select your class</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <button
        onClick={() => handleClassClick("11th")}
        className="cursor-pointer px-8 py-6 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {" "}
        Class 11th{" "}
      </button>
      <button
        onClick={() => handleClassClick("12th")}
        className="cursor-pointer px-8 py-6 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {" "}
        Class 12th{" "}
      </button>
      <button
        onClick={() => handleClassClick("11th+12th")}
        className="cursor-pointer px-8 py-6 rounded-xl font-semibold text-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      >
        {" "}
        11th + 12th{" "}
      </button>
    </div>
  </div>
);

};

export default ExamClasses;
