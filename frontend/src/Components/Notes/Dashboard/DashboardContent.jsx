import React from "react";
import { useOutletContext } from "react-router-dom";
import { Bell, ChevronRight } from "lucide-react";
import NoticeBoard from "./NoticeBoard";
import QuizSection from "../Quiz/QuizSection";
import Calendercomponent from "./Calendercomponent";

const DashboardContent = () => {
  const { notices, handleExamClick } = useOutletContext();
  const ExamButton = ({ exam }) => {
    const isBoard = exam === "Board";
    return (
      <button
        onClick={() => {
          if (isBoard) {
            alert("This section is Under Development");
          } else {
            handleExamClick(exam);
          }
        }}
        className={`cursor-pointer px-8 py-6 rounded-xl font-semibold text-lg text-white transition-all duration-300 hover:scale-105 hover:shadow-lg bg-gradient-to-r ${
          isBoard
            ? "from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700"
            : "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        }`}
      >
        {exam}
        {isBoard && (
          <span className="block text-xs font-normal text-yellow-300 mt-1">
            Under Development
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row  ">
      <div className="flex-1">
        {/* Header */}
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-600 text-lg">
                Welcome back,👋 <br />
                Here's your learning overview and progress insights.
              </p>
            </div>
            <div className="bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-xl shadow-inner">
              🕒{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Exam Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ExamButton exam="CET" />
          <ExamButton exam="JEE" />
          <ExamButton exam="NEET" />
          <ExamButton exam="Board" />
        </div>

        {/* Notice Board */}
        <NoticeBoard notices={notices} />

        {/* Quick Quiz below Notice Board */}
        <QuizSection />
      </div>
      <div className="w-full lg:w-[380px] mt-8 lg:mt-0">
        <Calendercomponent />
      </div>
    </div>
  );
};

export default DashboardContent;
