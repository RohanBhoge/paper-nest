import React from 'react';
import { ArrowLeft } from 'lucide-react';

const SubjectsPage = ({
  selectedExam,
  selectedClass,
  examSubjects,
  mode,
  setMode,
  handleSubjectClick,
  setActiveSection,
  setSelectedClass
}) => {
  return (
    <div>
      {/* Back to Classes Button */}
      <button
        onClick={() => {
          setActiveSection('exam'); // go back to Exam Classes
          setSelectedClass(null);    // reset selected class
        }}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg mb-6 hover:bg-slate-200 transition-all duration-200"
      >
        <ArrowLeft size={16} /> Back to Classes
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {selectedExam} - Class {selectedClass}
        </h1>
        <p className="text-slate-600 mb-4">Select mode and subject</p>

        <div className="flex gap-6 mb-6">
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              mode === 'Random'
                ? 'bg-blue-600 text-white'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
            }`}
            onClick={() => setMode('Random')}
          >
            Random
          </button>
          <button
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
              mode === 'Fixed'
                ? 'bg-blue-600 text-white'
                : 'border border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
            }`}
            onClick={() => setMode('Fixed')}
          >
            Fixed
          </button>
        </div>

        <div className={`grid gap-6 ${selectedExam === 'CET' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {examSubjects[selectedExam].map((subject) => (
            <button
              key={subject}
              onClick={() => handleSubjectClick(subject)}
              className="cursor-pointer px-6 py-4 rounded-lg font-medium text-blue-600 border border-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:translate-y-[-2px]"
            >
              {subject}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubjectsPage;
