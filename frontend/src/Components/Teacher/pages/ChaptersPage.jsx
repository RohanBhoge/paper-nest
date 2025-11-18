import React, { useContext, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { jsPDF } from "jspdf";
import GeneratedTemplate from "../../Teacher/Dashboard/GeneratedTemplate";
import PaperContext from "../context/paper/PaperContext";
import axios from "axios";
import AuthContext from "../context/auth/AuthContext";

const STORAGE_KEY = "paper_history_v1";

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

const ChaptersPage = ({
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
}) => {
  const [className, setClassName] = useState(selectedClass || "");
  const [examName, setExamName] = useState(selectedExam || "");
  const [examDate, setExamDate] = useState("");
  const [examDuration, setExamDuration] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [showTemplate, setShowTemplate] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);
  const { paperData, setPaperData } = useContext(PaperContext);
  const [backendPaperData, setBackendPaperData] = useState(null);
  const { adminAuthToken, BackendUrl } = useContext(AuthContext);

  const isCombinedClass = selectedClass === "11th+12th";
  const isNeetBiology =
    selectedExam === "NEET" && selectedSubject === "Biology";

  let firstColChapters = [];
  let secondColChapters = [];
  let firstColHeader = "";
  let secondColHeader = "";
  let neetColumns = [];

  if (isNeetBiology) {
    neetColumns = [
      { header: "11th Zoology", chapters: chapters?.Zoology?.["11th"] || [] },
      { header: "12th Zoology", chapters: chapters?.Zoology?.["12th"] || [] },
      { header: "11th Botany", chapters: chapters?.Botany?.["11th"] || [] },
      { header: "12th Botany", chapters: chapters?.Botany?.["12th"] || [] },
    ];
  } else if (isCombinedClass) {
    firstColChapters = chapters?.["11th"] || [];
    secondColChapters = chapters?.["12th"] || [];
    firstColHeader = "Class 11th";
    secondColHeader = "Class 12th";
  } else {
    const allChaps =
      chapters && chapters["11th"]
        ? chapters["11th"]
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
        {" "}
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
        <span className="text-slate-800 font-medium">{chapter}</span>{" "}
      </div>
    ));

  const generatePdfAndSave = async () => {
    if (savedOnce) {
      // still show template if already saved
      setShowTemplate(true);
      return;
    }

    try {
      console.log("Sending paper data to backend:", paperData);
      const response = await axios.post(
        BackendUrl + `/api/v1/paper/generate-paper`,
        {
          ...paperData, // Use count from paperData, which is updated in the input handler
          count: paperData.count ? paperData.count : 20,
        },
        {
          // FIXES: Uses 'headers' (plural) and the dynamic 'adminAuthToken'
          headers: {
            Authorization: `Bearer ${adminAuthToken}`,
          },
        }
      );

      setBackendPaperData(response.data);
      console.log("Backend paper data received:", response.data);
      console.log("Paper data sent to backend:", backendPaperData);
    } catch (error) {
      alert("Failed to load PDF generation library. Please try again.");
      return error;
    }
    const papers = getPapersFromService();
    const nextId = papers.length + 1;
    const paperId = `PAPER-${String(nextId).padStart(3, "0")}`;
    const fileName = `${paperId}.pdf`; // build PDF with jsPDF

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40;
    let y = 60; // Header

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
    y += 24; // Divider

    doc.setLineWidth(0.5);
    doc.line(left, y, 555, y);
    y += 18; // Placeholder body (you can change this later to insert actual questions)

    doc.setFontSize(11);
    const placeholder =
      "Questions will be generated here. (Replace this area with actual question content in GeneratedTemplate.)";
    const split = doc.splitTextToSize(placeholder, 515);
    doc.text(split, left, y);
    y += split.length * 14 + 12; // Optionally list selected chapters (if any)

    const selectedChapters = paperData.chapters ? paperData.chapters : [];

    if (selectedChapters.length > 0) {
      doc.setFont(undefined, "bold");
      doc.text("Selected Chapters:", left, y);
      y += 16;
      doc.setFont(undefined, "normal");
      const selSplit = doc.splitTextToSize(selectedChapters.join(", "), 515);
      doc.text(selSplit, left, y);
      y += selSplit.length * 14 + 12;
    } // finalize PDF and get blob

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
  }; // 💡 NEW HANDLER FUNCTION for the number of questions input

  const handleQuestionCountChange = (e) => {
    const value = e.target.value;
    // 1. Update the local state for immediate feedback
    setNumberOfQuestions(value);

    // 2. Update the paperData context state for API payload
    setPaperData((prevData) => ({
      ...prevData,
      count: value,
    }));
  };

  return (
    <div>
      {" "}
      {!showTemplate ? (
        <>
          {" "}
          <button
            onClick={() => {
              setActiveSection && setActiveSection("subjects");
              setSelectedSubject && setSelectedSubject(null);
            }}
            className="flex cursor-pointer items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg mb-6 hover:bg-slate-200 transition-all duration-200"
          >
            <ArrowLeft size={16} /> Back to Subjects          {" "}
          </button>{" "}
          <div className="mb-4">
            {" "}
            <h1 className="text-3xl font-bold text-slate-900 mb-1">
              {selectedSubject}           {" "}
            </h1>{" "}
            <p className="text-slate-600">
              Mark chapters to generate questions            {" "}
            </p>{" "}
          </div>{" "}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8 shadow-sm">
            {" "}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-700 text-sm">
              {" "}
              <div>
                {" "}
                <label className="font-medium">Class Name</label>               {" "}
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />{" "}
              </div>{" "}
              <div>
                <label className="font-medium">Exam Name</label>{" "}
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />{" "}
              </div>{" "}
              <div>
                <label className="font-medium">Exam Date</label>{" "}
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="font-medium">
                  Exam Duration (Minutes)
                </label>{" "}
                <input
                  type="number"
                  value={examDuration}
                  onChange={(e) => setExamDuration(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 90"
                  min="1"
                />{" "}
              </div>{" "}
              <div>
                {" "}
                <label className="font-medium">Total Marks</label>{" "}
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 100"
                  min="1"
                />{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
          {mode === "Random" && (
            <div className="mb-6">
              {" "}
              <input
                type="number"
                placeholder="Enter number of questions"
                value={numberOfQuestions}
                onChange={handleQuestionCountChange}
                className="border border-slate-300 rounded-lg px-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />{" "}
            </div>
          )}{" "}
          <div className="grid gap-4 md:grid-cols-2">
            {" "}
            {isNeetBiology ? (
              neetColumns.map((col) => (
                <div key={col.header}>
                  {" "}
                  {col.header && (
                    <h4 className="font-medium text-slate-700 mb-2">
                      {col.header}                   {" "}
                    </h4>
                  )}{" "}
                  {renderChapterList(col.header, col.chapters)}               {" "}
                </div>
              ))
            ) : (
              <>
                {" "}
                <div>
                  {" "}
                  {firstColHeader && (
                    <h4 className="font-medium text-slate-700 mb-2">
                      {firstColHeader}                   {" "}
                    </h4>
                  )}{" "}
                  {renderChapterList("col1", firstColChapters)}               {" "}
                </div>{" "}
                <div>
                  {" "}
                  {secondColHeader && (
                    <h4 className="font-medium text-slate-700 mb-2">
                      {secondColHeader}                   {" "}
                    </h4>
                  )}{" "}
                  {renderChapterList("col2", secondColChapters)}               {" "}
                </div>{" "}
              </>
            )}{" "}
          </div>{" "}
          <div className="flex justify-center mt-6">
            {" "}
            <button
              onClick={generatePdfAndSave}
              className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-300"
            >
              Generate            {" "}
            </button>{" "}
          </div>{" "}
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
          onBack={() => setShowTemplate(false)}
          generatedPaper={backendPaperData}
        />
      )}{" "}
    </div>
  );
};

export default ChaptersPage;
