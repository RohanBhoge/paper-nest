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

  const [showTemplate, setShowTemplate] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const {
    setBackendPaperData,
    backendPaperData,
    examDate,
    setExamDate,
    examDuration,
    setExamDuration,
    setPaperData,
    marks,
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
    if (savedOnce) {
      setShowTemplate(true);
      return;
    }

    // ✅ Form Validation
    if (!className || !className.trim()) {
      alert("Please enter a Class Name.");
      return;
    }
    if (!examName || !examName.trim()) {
      alert("Please enter an Exam Name.");
      return;
    }
    if (!examDate) {
      alert("Please select an Exam Date.");
      return;
    }
    if (!examDuration || examDuration <= 0) {
      alert("Please enter a valid Exam Duration in minutes.");
      return;
    }

    // Validate mode-specific fields
    if (mode === "Random") {
      if (!totalMarks || totalMarks <= 0) {
        alert("Please enter valid Total Marks.");
        return;
      }
      if (!numberOfQuestions || numberOfQuestions <= 0) {
        alert("Please enter a valid Number of Questions.");
        return;
      }
    }

    // Validate at least one chapter is selected
    const hasSelectedChapters = Object.values(checkedChapters || {}).some(val => val === true);
    if (!hasSelectedChapters) {
      alert("Please select at least one chapter.");
      return;
    }

    setIsGenerating(true);
    setBackendPaperData(null); // Clear previous data

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
      console.error(
        "API Error during paper generation:",
        error.response?.data || error.message
      );
      alert(
        `Failed to generate paper: ${error.response?.data?.message || "Check console for details."
        }`
      );
      setIsGenerating(false);
      return;
    }

    // 3. Generate PDF and Save to History (for the list view)
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
      setSavedOnce(true);
      setShowTemplate(true);
    } catch (error) {
      console.error("PDF/History saving error:", error);
      alert("Failed to save paper to history.");
    } finally {
      setIsGenerating(false);
    }
  }, [
    savedOnce,
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
              <div>
                <label className="font-medium">Class Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="font-medium">Exam Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="font-medium">Exam Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="font-medium">Exam Duration (Minutes) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  value={examDuration}
                  onChange={(e) => setExamDuration(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 90"
                  min="1"
                  required
                />
              </div>
              {mode === "Random" && (
                <div>
                  <label className="font-medium">Total Marks <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(e.target.value)}
                    className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 100"
                    min="1"
                    required
                  />
                </div>
              )}
            </div>
          </div>
          {mode === "Random" && (
            <div className="mb-6">
              <p className="mb-2 ml-2">Enter Number of Questions: <span className="text-red-500">*</span></p>
              <input
                type="number"
                placeholder="Enter number of questions"
                value={numberOfQuestions}
                onChange={handleQuestionCountChange}
                className="border border-slate-600 rounded-lg px-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
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
