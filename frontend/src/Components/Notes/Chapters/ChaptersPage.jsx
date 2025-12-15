import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Eye, Download, ArrowLeft, List, LayoutGrid } from 'lucide-react';

const ChaptersPage = () => {
  const navigate = useNavigate();
  const { selectedExam, selectedSubject, chapters, setActiveSection, openNotesModal } = useOutletContext();

  // 💡 Redirect if state is lost
  useEffect(() => {
    if (!selectedExam || !selectedSubject) {
        navigate("/notes-dashboard/exam", { replace: true });
    }
  }, [selectedExam, selectedSubject, navigate]);

  if (!selectedExam || !selectedSubject) return null;

  const [viewType, setViewType] = useState("grid");

  // ✅ RESPONSIVE GRID VIEW
  const renderGridView = (chapterList) => (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {chapterList.map((chapter) => (
        <div
          key={chapter}
          className="flex flex-col justify-between p-4 sm:p-5 h-40 sm:h-44 bg-white border border-slate-200 
                     rounded-xl sm:rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 
                     transition-all duration-200"
        >
          {/* Chapter Name - 2 lines max */}
          <h3 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg mb-3 line-clamp-2 leading-snug">
            {chapter}
          </h3>

          {/* Action Buttons (Stack on mobile) */}
          <div className="flex flex-col sm:flex-row gap-2 mt-auto">
            <button
              onClick={() => openNotesModal(chapter)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 
                         text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition"
            >
              <Eye size={14} /> Notes
            </button>
            <button
              className="flex items-center justify-center gap-1 px-3 py-2 bg-slate-100 
                         text-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-200 transition"
            >
              <Download size={14} /> Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  // ✅ RESPONSIVE LIST VIEW
  const renderListView = (chapterList) => (
    <div className="space-y-3 sm:space-y-4">
      {chapterList.map((chapter) => (
        <div
          key={chapter}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 
                     p-3 sm:p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition"
        >
          <span className="font-medium text-slate-800 text-sm sm:text-base">{chapter}</span>

          <div className="flex gap-2">
            <button
              onClick={() => openNotesModal(chapter)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded 
                         text-xs sm:text-sm hover:bg-blue-700 transition"
            >
              <Eye size={12} /> Notes
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 
                         rounded text-xs sm:text-sm hover:bg-slate-200 transition"
            >
              <Download size={12} /> Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderChapters = (chapterList) =>
    viewType === "grid" ? renderGridView(chapterList) : renderListView(chapterList);

  return (
    <div className="px-3 sm:px-6 md:px-8 py-4 sm:py-6">
                                           
      {/* Back Button */}
      <button
        onClick={() => setActiveSection('exam')}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 rounded-lg mb-6 sm:mb-8 
                   hover:bg-slate-200 transition text-sm sm:text-base"
      >
        <ArrowLeft size={16} />
        <span className="font-medium">Back to Subjects</span>
      </button>
                  
      {/* Header + View Toggle */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-1">{selectedSubject}</h1>
          <p className="text-slate-600 text-xs sm:text-base">Choose a chapter to view notes and materials</p>
        </div>

        <button
          onClick={() => setViewType(viewType === "grid" ? "list" : "grid")}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 rounded-lg 
                     hover:bg-slate-200 transition font-medium text-sm sm:text-base"
        >
          {viewType === "grid" ? <List size={16} /> : <LayoutGrid size={16} />}
          {viewType === "grid" ? "List View" : "Grid View"}
        </button>
      </div>

      {/* 11th */}
      {chapters["11th"] && (
        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-blue-700">11th Standard</h2>
          {renderChapters(chapters["11th"])}
        </div>
      )}

      {/* 12th */}
      {chapters["12th"] && (
        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-blue-700">12th Standard</h2>
          {renderChapters(chapters["12th"])}
        </div>
      )}

      {/* Zoology */}
      {chapters.Zoology && (
        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-blue-700">Zoology</h2>

          {chapters.Zoology["11th"] && (
            <>
              <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3 text-blue-600">11th Standard</h3>
              {renderChapters(chapters.Zoology["11th"])}
            </>
          )}

          {chapters.Zoology["12th"] && (
            <>
              <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3 text-blue-600 mt-4 sm:mt-6">12th Standard</h3>
              {renderChapters(chapters.Zoology["12th"])}
            </>
          )}
        </div>
      )}

      {/* Botany */}
      {chapters.Botany && (
        <div>
          <h2 className="text-lg sm:text-2xl font-semibold mb-3 sm:mb-4 text-blue-700">Botany</h2>

          {chapters.Botany["11th"] && (
            <>
              <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3 text-blue-600">11th Standard</h3>
              {renderChapters(chapters.Botany["11th"])}
            </>
          )}

          {chapters.Botany["12th"] && (
            <>
              <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3 text-blue-600 mt-4 sm:mt-6">12th Standard</h3>
              {renderChapters(chapters.Botany["12th"])}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChaptersPage;
