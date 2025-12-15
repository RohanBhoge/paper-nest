const ExamButton = ({ exam, handleExamClick }) => (
  <button
    onClick={() => handleExamClick(exam)}
    className="cursor-pointer px-8 py-6 rounded-xl font-semibold text-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
  >
    {exam}
  </button>
);

export default ExamButton; 