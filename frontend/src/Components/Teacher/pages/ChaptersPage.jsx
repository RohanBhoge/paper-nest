import React, { useContext, useEffect, useState, useCallback } from "react"; // 💡 Added useCallback
import { useOutletContext, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { jsPDF } from "jspdf";
import GeneratedTemplate from "../../Teacher/Dashboard/GeneratedTemplate.jsx";
import PaperContext from "../context/paper/PaperContext";
import api from "../../../api";
import AuthContext from "../context/auth/AuthContext";

const STORAGE_KEY = "paper_history_v1";

// Utility functions (Keep as is)
function getPapersFromService() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePapersToService(arr) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    return true;
  } catch {
    return false;
  }
}

const ChaptersPage = () => {
  const navigate = useNavigate();
  const {
    selectedClass,
    selectedExam,
    selectedSubject,
    chapters,
    checkedChapters,
    handleCheckboxChange,
    mode,
    numberOfQuestions,
    setNumberOfQuestions,
    setActiveSection,
    setSelectedSubject,
  } = useOutletContext();

  // 💡 Redirect if state is lost (e.g. on refresh)
  useEffect(() => {
    if (!selectedExam || !selectedClass || !selectedSubject) {
      navigate("/teacher-dashboard/subjects", { replace: true });
    }
  }, [selectedExam, selectedClass, selectedSubject, navigate]);

  if (!selectedExam || !selectedClass || !(selectedSubject || showTemplate)) {
    // Allow render if showTemplate is true (though likely subject is needed)
    // Actually simpler: if critical context is missing, don't render.
    if (!selectedExam || !selectedClass || !selectedSubject) return null;
  }

  // Initialize state using props
  const [className, setClassName] = useState(selectedClass || "");
  const [examName, setExamName] = useState(selectedExam || "");

  const [totalMarks, setTotalMarks] = useState("");
  const [serverError, setServerError] = useState(null);

  const [showTemplate, setShowTemplate] = useState(false);
  const [formErrors, setFormErrors] = useState({}); // 💡 Industry-standard validation state
  const {
    setBackendPaperData,
    backendPaperData,
    examDate,
    setExamDate,
    examDuration,
    setExamDuration,
    setPaperData,
    marks,
    setShowGenerateOptions, // 💡 Clear print options view upon new generation
  } = useContext(PaperContext);

  // const { paperData, setPaperData,marks,
  // setMarks } = useContext(PaperContext);
  // const [backendPaperData, setBackendPaperData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false); // 💡 New loading state
  const { adminAuthToken, BackendUrl } = useContext(AuthContext);

  // 🔄 Sync effect: Log className changes
  useEffect(() => {
  }, [className]);

  // 🔄 Sync effect: Log examName changes
  useEffect(() => {
  }, [examName]);

  // 🔄 Sync effect: Log totalMarks changes
  useEffect(() => {
    if (totalMarks) {
    }
  }, [totalMarks]);

  // 🔄 Sync effect: Log examDate changes
  useEffect(() => {
    if (examDate) {
    }
  }, [examDate]);

  // 🔄 Sync effect: Log examDuration changes
  useEffect(() => {
    if (examDuration) {
    }
  }, [examDuration]);

  // 🔄 Sync effect: Log numberOfQuestions changes
  useEffect(() => {
  }, [numberOfQuestions]);

  // --- Chapter Layout Logic (omitted for brevity) ---

  const isCombinedClass = selectedClass === "11th+12th";
  const isNeetBiology =
    selectedExam === "NEET" && selectedSubject === "Biology";

  let firstColChapters = [];
  let secondColChapters = [];
  let firstColHeader = "";
  let secondColHeader = "";
  let neetColumns = [];

  if (isNeetBiology) {
    if (selectedClass === "11th") {
      neetColumns = [
        { header: "11th Zoology", chapters: chapters?.Zoology?.["11th"] || [] },
        { header: "11th Botany", chapters: chapters?.Botany?.["11th"] || [] },
      ];
    } else if (selectedClass === "12th") {
      neetColumns = [
        { header: "12th Zoology", chapters: chapters?.Zoology?.["12th"] || [] },
        { header: "12th Botany", chapters: chapters?.Botany?.["12th"] || [] },
      ];
    } else {
      neetColumns = [
        { header: "11th Zoology", chapters: chapters?.Zoology?.["11th"] || [] },
        { header: "12th Zoology", chapters: chapters?.Zoology?.["12th"] || [] },
        { header: "11th Botany", chapters: chapters?.Botany?.["11th"] || [] },
        { header: "12th Botany", chapters: chapters?.Botany?.["12th"] || [] },
      ];
    }
  } else if (isCombinedClass) {
    firstColChapters = chapters?.["11th"] || [];
    secondColChapters = chapters?.["12th"] || [];
    firstColHeader = "Class 11th";
    secondColHeader = "Class 12th";
  } else {
    const allChaps =
      chapters && chapters[selectedClass]
        ? chapters[selectedClass]
        : Array.isArray(chapters)
          ? chapters
          : chapters || [];
    const mid = Math.ceil(allChaps.length / 2);
    firstColChapters = allChaps.slice(0, mid);
    secondColChapters = allChaps.slice(mid);
  }

  const renderChapterList = (colKey, list) =>
    list.map((chapter) => (
      <div
        key={`${colKey}-${chapter}`}
        className="bg-white border border-slate-200 p-4 rounded-lg flex items-center hover:shadow-md transition-all duration-300 mb-2"
      >
        <input
          type="checkbox"
          checked={
            (checkedChapters && checkedChapters[`${colKey}-${chapter}`]) ||
            false
          }
          onChange={() =>
            handleCheckboxChange && handleCheckboxChange(`${colKey}-${chapter}`)
          }
          className="mr-3 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
        />
        <span className="text-slate-800 font-medium">{chapter}</span>
      </div>
    ));

  // 💡 CORRECTED: Wrapped API call and state updates in useCallback
  const handleGenerateAndSave = useCallback(async () => {
    if (isGenerating) return;

    // ✅ Industry-Standard Form Validation
    const newErrors = {};

    if (!className || !className.trim()) {
      newErrors.className = "Please enter a Class Name.";
    }
    if (!examName || !examName.trim()) {
      newErrors.examName = "Please enter an Exam Name.";
    }
    if (!examDate) {
      newErrors.examDate = "Please select an Exam Date.";
    }
    if (!examDuration || examDuration <= 0) {
      newErrors.examDuration = "Please enter a valid Exam Duration in minutes.";
    }

    // Validate mode-specific fields
    if (mode === "Random") {
      if (!numberOfQuestions || numberOfQuestions <= 0) {
        newErrors.numberOfQuestions = "Please enter a valid Number of Questions.";
      }

      if (!totalMarks || totalMarks <= 0) {
        newErrors.totalMarks = "Please enter valid Total Marks.";
      }

      // 💡 NEW: Marks distribution validation
      if (numberOfQuestions && totalMarks) {
        if (Number(totalMarks) < Number(numberOfQuestions)) {
          newErrors.totalMarks = "Total Marks must be at least equal to Number of Questions (min 1 mark per question).";
        } else if (Number(totalMarks) % Number(numberOfQuestions) !== 0) {
          newErrors.totalMarks = "Total Marks must be cleanly divisible by the Number of Questions (no remainder).";
        }
      }
    }

    // Validate at least one chapter is selected
    const hasSelectedChapters = Object.values(checkedChapters || {}).some(val => val === true);
    if (!hasSelectedChapters) {
      newErrors.chapters = "Please select at least one chapter.";
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      // Auto-scroll to the first error field
      setTimeout(() => {
        const firstErrorElement = document.querySelector('.has-error');
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setFormErrors({}); // Clear errors if entirely valid
    setIsGenerating(true);
    setBackendPaperData(null); // Clear previous data
    setServerError(null); // Clear previous server errors

    const chaptersArray = Object.keys(checkedChapters || {})
      .filter((key) => checkedChapters[key])
      .map((key) => key.split("-").pop());

    // 1. Prepare Payload
    const payload = {
      class: className,
      exam: examName,
      subject: selectedSubject,
      examDate: examDate || new Date().toISOString().split("T")[0],
      examDuration: examDuration,
      totalMarks: totalMarks,
      count: numberOfQuestions || 20,
      chapters: chaptersArray,
    };
    // 2. Call Backend API
    let generatedData = null;
    try {
      // 🚀 Use centralized API instance
      const response = await api.post(
        BackendUrl + "/api/v1/paper/generate-paper",
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminAuthToken}`,
          },
          withCredentials: true
        }
      );

      generatedData = response.data;
      // 💡 CRITICAL: Set the backend data immediately after a successful response
      setBackendPaperData(generatedData);
    } catch (error) {
      console.error("Paper Generation Error:", error);
      const errorMsg = error.response?.data?.message || error.message || "An unexpected error occurred.";

      if (error.response?.status === 404) {
        setServerError(`No questions found: ${errorMsg}. Try selecting more chapters or different difficulty levels.`);
      } else {
        setServerError(errorMsg);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsGenerating(false);
      return;
    }

    // 💡 IMMEDIATE UI UNBLOCK: Transition to template view instantly
    if (typeof setShowGenerateOptions === "function") {
      setShowGenerateOptions(false); // Reset template to default view (Save/Replace)
    }
    setShowTemplate(true);
    setIsGenerating(false);

    // 3. Generate PDF and Save to History (for the list view) IN BACKGROUND
    setTimeout(() => {
      try {
        const papers = getPapersFromService();
        const nextId = papers.length + 1;
        const paperId = `PAPER-${String(nextId).padStart(3, "0")}`;
        const fileName = `${paperId}.pdf`;

        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const left = 40;
        let y = 60;

        // --- PDF Header Logic (omitted for brevity) ---
        doc.setFontSize(16);
        doc.setFont(undefined, "bold");
        doc.text(paperId, left, y);
        doc.setFontSize(12);
        doc.setFont(undefined, "normal");
        doc.text(`Class: ${className || "-"}`, left + 300, y);
        y += 22;

        doc.setFontSize(12);
        doc.text(`Subject: ${selectedSubject || "-"}`, left, y);
        doc.text(`Exam: ${examName || "-"}`, left + 300, y);
        y += 18;

        doc.text(`Exam Date: ${examDate || "-"}`, left, y);
        doc.text(`Marks: ${totalMarks || "-"}`, left + 300, y);
        y += 24;

        doc.setLineWidth(0.5);
        doc.line(left, y, 555, y);
        y += 18;

        // Placeholder body - The actual question content should come from `GeneratedTemplate` rendering.
        doc.setFontSize(11);
        const placeholder =
          "Questions generated successfully. Template view will show detailed questions.";
        const split = doc.splitTextToSize(placeholder, 515);
        doc.text(split, left, y);
        y += split.length * 14 + 12;

        const blob = doc.output("blob");
        const url = URL.createObjectURL(blob);

        const newEntry = {
          paperId,
          examName,
          examDate,
          className,
          examDuration,
          totalMarks,
          subjectName: selectedSubject,
          fileCount: 1,
          fileNames: [fileName],
          fileUrl: url,
          fileName,
          checkedStatus: "unchecked",
          date: new Date().toISOString(),
        };

        savePapersToService([...papers, newEntry]);
      } catch (error) {
        console.error("PDF/History saving error:", error);
      }
    }, 100);
  }, [
    isGenerating,
    className,
    examName,
    selectedSubject,
    examDate,
    examDuration,
    totalMarks,
    numberOfQuestions,
    checkedChapters,
    adminAuthToken,
    BackendUrl,
    setPaperData,
    setShowGenerateOptions,
  ]);

  const handleQuestionCountChange = (e) => {
    const value = e.target.value;
    setNumberOfQuestions(value);

    setPaperData((prevData) => ({
      ...prevData,
      count: value,
    }));
  };

  return (
    <div>
      {!showTemplate ? (
        <>
          <button
            onClick={() => {
              setActiveSection && setActiveSection("subjects");
              setSelectedSubject && setSelectedSubject(null);
            }}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg mb-6 hover:bg-slate-200 transition-all duration-200"
          >
            <ArrowLeft size={16} /> Back to Subjects
          </button>
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-blue-900">Generate Question Paper</h1>
          </div>

          {serverError && (
            <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded shadow-md animate-pulse">
              <div className="flex items-center">
                <span className="font-bold mr-2">Error:</span>
                <span>{serverError}</span>
              </div>
              <p className="mt-2 text-sm italic">
                Tip: Ensure your chapter selections have enough questions for the requested criteria.
              </p>
            </div>
          )}
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {selectedSubject}
            </h1>
            <p className="text-slate-600">
              Mark chapters to generate questions
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-700 text-sm">
              <div className={formErrors.className ? "has-error" : ""}>
                <label className="font-medium">Class Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    if (formErrors.className) setFormErrors(prev => ({ ...prev, className: null }));
                  }}
                  className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.className ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                  required
                />
                {formErrors.className && <p className="text-red-500 text-xs mt-1">{formErrors.className}</p>}
              </div>
              <div className={formErrors.examName ? "has-error" : ""}>
                <label className="font-medium">Exam Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => {
                    setExamName(e.target.value);
                    if (formErrors.examName) setFormErrors(prev => ({ ...prev, examName: null }));
                  }}
                  className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.examName ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                  required
                />
                {formErrors.examName && <p className="text-red-500 text-xs mt-1">{formErrors.examName}</p>}
              </div>
              <div className={formErrors.examDate ? "has-error" : ""}>
                <label className="font-medium">Exam Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => {
                    setExamDate(e.target.value);
                    if (formErrors.examDate) setFormErrors(prev => ({ ...prev, examDate: null }));
                  }}
                  className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.examDate ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                  required
                />
                {formErrors.examDate && <p className="text-red-500 text-xs mt-1">{formErrors.examDate}</p>}
              </div>
              <div className={formErrors.examDuration ? "has-error" : ""}>
                <label className="font-medium">Exam Duration (Minutes) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={examDuration}
                  onChange={(e) => {
                    setExamDuration(e.target.value);
                    if (formErrors.examDuration) setFormErrors(prev => ({ ...prev, examDuration: null }));
                  }}
                  onWheel={(e) => e.target.blur()}
                  className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.examDuration ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                  placeholder="e.g. 90"
                  min="1"
                  required
                />
                {formErrors.examDuration && <p className="text-red-500 text-xs mt-1">{formErrors.examDuration}</p>}
              </div>

              {/* 💡 Reordered: Number of Questions now appears BEFORE Total Marks */}
              {mode === "Random" && (
                <div className={formErrors.numberOfQuestions ? "has-error" : ""}>
                  <label className="font-medium">Number of Questions <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={numberOfQuestions}
                    onChange={(e) => {
                      handleQuestionCountChange(e);
                      if (formErrors.numberOfQuestions) setFormErrors(prev => ({ ...prev, numberOfQuestions: null }));
                    }}
                    onWheel={(e) => e.target.blur()}
                    className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.numberOfQuestions ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                    min="1"
                    required
                  />
                  {formErrors.numberOfQuestions && <p className="text-red-500 text-xs mt-1">{formErrors.numberOfQuestions}</p>}
                </div>
              )}

              {mode === "Random" && (
                <div className={formErrors.totalMarks ? "has-error" : ""}>
                  <label className="font-medium">Total Marks <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => {
                      setTotalMarks(e.target.value);
                      if (formErrors.totalMarks) setFormErrors(prev => ({ ...prev, totalMarks: null }));
                    }}
                    onWheel={(e) => e.target.blur()}
                    className={`w-full mt-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${formErrors.totalMarks ? 'border-red-500 focus:ring-red-500 bg-red-50' : 'border-slate-300 focus:ring-blue-500'}`}
                    placeholder="e.g. 100"
                    min="1"
                    required
                  />
                  {formErrors.totalMarks && <p className="text-red-500 text-xs mt-1">{formErrors.totalMarks}</p>}
                </div>
              )}
            </div>
          </div>
          <div className={`grid gap-4 md:grid-cols-2 ${formErrors.chapters ? "has-error border border-red-500 rounded-lg p-2" : ""}`}>
            {formErrors.chapters && <div className="col-span-full text-red-500 text-sm font-semibold mb-2">{formErrors.chapters}</div>}
            {isNeetBiology ? (
              neetColumns.map((col) => (
                <div key={col.header}>
                  {col.header && (
                    <h4 className="font-medium text-slate-700 mb-2">
                      {col.header}
                    </h4>
                  )}
                  {renderChapterList(col.header, col.chapters)}
                </div>
              ))
            ) : (
              <>
                <div>
                  {firstColHeader && (
                    <h4 className="font-medium text-slate-700 mb-2">
                      {firstColHeader}
                    </h4>
                  )}
                  {renderChapterList("col1", firstColChapters)}
                </div>
                <div>
                  {secondColHeader && (
                    <h4 className="font-medium text-slate-700 mb-2">
                      {secondColHeader}
                    </h4>
                  )}
                  {renderChapterList("col2", secondColChapters)}
                </div>
              </>
            )}
          </div>
          <div className="flex justify-center mt-6">
            <button
              onClick={handleGenerateAndSave}
              disabled={isGenerating}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300 disabled:bg-green-400"
            >
              {isGenerating ? "Generating..." : "Generate"}
            </button>
          </div>
        </>
      ) : (
        <GeneratedTemplate
          className={className}
          examName={examName}
          subjectName={selectedSubject}
          examDate={examDate}
          examDuration={examDuration}
          totalMarks={totalMarks}
          numberOfQuestions={numberOfQuestions}
          mode={mode} // Pass the mode (e.g., "Random" for Custom Selection)
          onBack={() => setShowTemplate(false)}
          generatedPaper={backendPaperData}
        />
      )}
    </div>
  );
};

export default ChaptersPage;
