import React from "react";
import { ArrowLeft, BookOpen } from "lucide-react";

const SubjectsPage = ({ selectedExam, selectedClass, examSubjects, handleSubjectClick, setActiveSection }) => {
  return (
    <div className="p-6">
      <button
        onClick={() => setActiveSection("exam")}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft size={20} /> Back to Classes
      </button>

      <h2 className="text-2xl font-bold text-slate-800 mb-6">
        {selectedExam} - {selectedClass} Subjects
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {examSubjects[selectedExam]?.map((subject, idx) => (
          <div
            key={idx}
            onClick={() => handleSubjectClick(subject)}
            className="p-6 bg-white rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md flex flex-col items-center"
          >
            <BookOpen className="text-blue-600 mb-2" size={24} />
            <span className="text-lg font-semibold text-slate-800">{subject}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubjectsPage;
