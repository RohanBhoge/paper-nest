const SubjectButton = ({ subject, handleSubjectClick }) => (
  <button
    onClick={() => handleSubjectClick(subject)}
    className="cursor-pointer px-6 py-4 rounded-lg font-medium text-blue-600 border border-blue-600 transition-all duration-300 hover:bg-blue-600 hover:text-white hover:translate-y-[-2px]"
  >
    {subject}
  </button>
);

export default SubjectButton;
