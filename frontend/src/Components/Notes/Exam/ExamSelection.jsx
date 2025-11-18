import React from 'react';

const ExamSelection = ({ selectedExam, examSubjects, setActiveSection, handleSubjectClick }) => {
  const SubjectButton = ({ subject }) => (
    <button
      onClick={() => handleSubjectClick(subject)}
      className="cursor-pointer px-6 py-4 rounded-lg font-medium text-blue-600 border border-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:translate-y-[-2px]"
    >
      {subject}
    </button>
  );

  // Set grid columns based on exam
  const getGridCols = () => {
    if (selectedExam === 'CET') return 'grid grid-cols-2 gap-6';
    if (selectedExam === 'JEE' || selectedExam === 'NEET') return 'grid grid-cols-3 gap-6';
    return 'grid grid-cols-1 gap-6'; // fallback
  };

  return (
    <div>
      <button
        onClick={() => setActiveSection('dashboard')}
        className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg mb-6 hover:bg-slate-200 transition-all duration-200"
      >
        Back to Dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">{selectedExam}</h1>
        <p className="text-slate-600">Select a subject to continue</p>
      </div>

      <div className={getGridCols()}>
        {examSubjects[selectedExam].map(subject => (
          <SubjectButton key={subject} subject={subject} />
        ))}
      </div>
    </div>
  );
};

export default ExamSelection;
