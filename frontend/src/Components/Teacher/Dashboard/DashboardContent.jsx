import React from 'react';
import ExamButton from './ExamButton';
import NoticeBoard from './NoticeBoard';
import Calendercomponent from '../../Notes/Dashboard/Calendercomponent';

const DashboardContent = ({ notices, handleExamClick }) => {
  return (
    <div className="flex flex-col lg:flex-row">
      {/* ===== Left Side Content ===== */}
      <div className="flex-1">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-lg">
                Welcome back,  👋 <br />
                Here's your learning overview and progress insights.
              </p>
            </div>
            <div className="bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-xl shadow-inner">
              🕒 {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        </div>

        {/* Exam Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <ExamButton exam="CET" handleExamClick={handleExamClick} />
          <ExamButton exam="JEE" handleExamClick={handleExamClick} />
          <ExamButton exam="NEET" handleExamClick={handleExamClick} />
        </div>

        {/* Notice Board */}
        <NoticeBoard notices={notices} />
      </div>

      {/* ===== Right Side Calendar ===== */}
      <div className="w-full lg:w-[380px] mt-8 lg:mt-0">
        <Calendercomponent />
      </div>
    </div>
  );
};

export default DashboardContent;
