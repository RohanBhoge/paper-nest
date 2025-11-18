import React, { useState } from 'react';

const quizData = [
  { question: "Which law explains the relationship between pressure and volume of a gas?", options: ["Boyle's Law", "Charles' Law", "Gay-Lussac's Law", "Avogadro's Law"], correct: 0 },
  { question: "What is the molecular formula of glucose?", options: ["C6H12O6", "C12H22O11", "C2H6O", "CH4"], correct: 0 },
  { question: "Which organelle is known as the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"], correct: 2 },
];

const QuizSection = () => {
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleQuizAnswer = (index) => {
    setSelectedAnswer(index);
    setShowResult(true);
  };

  const nextQuiz = () => {
    setCurrentQuiz((prev) => (prev + 1) % quizData.length);
    setSelectedAnswer(null);
    setShowResult(false);
  };

  const skipQuiz = () => nextQuiz();

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold mb-4 text-slate-900">Quick Quiz</h2>
      <div className="flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-slate-500">
              Question {currentQuiz + 1} of {quizData.length}
            </span>
            <div className="w-32 bg-slate-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                   style={{ width: `${((currentQuiz + 1) / quizData.length) * 100}%` }}></div>
            </div>
          </div>
          <div className="text-slate-800 font-medium leading-relaxed text-lg">
            {quizData[currentQuiz].question}
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {quizData[currentQuiz].options.map((option, index) => (
            <div
              key={index}
              onClick={() => !showResult && handleQuizAnswer(index)}
              className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                showResult
                  ? index === quizData[currentQuiz].correct
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : index === selectedAnswer
                    ? 'bg-red-50 border-red-500 text-red-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                  : selectedAnswer === index
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${
                  showResult
                    ? index === quizData[currentQuiz].correct
                      ? 'border-green-500 bg-green-500 text-white'
                      : index === selectedAnswer
                      ? 'border-red-500 bg-red-500 text-white'
                      : 'border-slate-300'
                    : selectedAnswer === index
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-slate-300'
                }`}>{String.fromCharCode(65 + index)}</div>
                <span>{option}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center">
          {!showResult ? (
            <button onClick={skipQuiz} className="px-4 py-2 cursor-pointer text-slate-600 hover:text-slate-800 transition-all duration-200 font-medium">
              Skip Question
            </button>
          ) : (
            <div className="flex-1"></div>
          )}
          {showResult && (
            <button onClick={nextQuiz} className="cursor-pointer px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all duration-200">
              {currentQuiz === quizData.length - 1 ? 'Restart Quiz' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizSection;
