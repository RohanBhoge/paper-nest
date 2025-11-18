import React, { useMemo, useState } from "react";

const formatDateDDMMYYYY = (isoDate) => {
  if (!isoDate) return "";
  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
  return isoDate;
};

// Helper to split array for two columns
const splitIntoTwo = (arr) => {
  const mid = Math.ceil(arr.length / 2);
  return [arr.slice(0, mid), arr.slice(mid)];
};

const GeneratedTemplate = ({
  className: localClassName,
  examName: localExamName,
  subjectName,
  examDate,
  examDuration,
  totalMarks,
  onBack,
  generatedPaper, // ⬅️ The full JSON response (response.data)
}) => {
  // 💡 NEW STATE: Controls the display mode (Questions or Answers)
  const [showAnswers, setShowAnswers] = useState(false); // --- 1. Data Extraction ---

  const paperData = generatedPaper?.data || {}; // Access the detailed array of question objects
  const questions = paperData?.metadata?.original_questions_array || [];
  const answersString = paperData?.paper_answers || ""; // Use backend data where available, fallback to local state/props

  const paperId = paperData.paper_id || "N/A";
  const finalMarks = paperData.marks || totalMarks;
  const finalExamName = paperData.exam_name || localExamName;
  const finalClassName = paperData.class || localClassName;
  const seed = paperData?.metadata?.seed || "N/A";
  const zipPath = paperData?.metadata?.zip_path || "N/A";
  const questionCount = questions.length;
  const formattedDate = useMemo(
    () =>
      paperData.exam_date
        ? formatDateDDMMYYYY(paperData.exam_date)
        : formatDateDDMMYYYY(examDate),
    [paperData.exam_date, examDate]
  ); // --- 2. Content Rendering Helpers ---

  // Maps the compact answers string ("A1: Answer | A2: Answer | ...") into a display array
  const answerItems = useMemo(() => {
    if (!showAnswers || !answersString) return [];
    return answersString
      .split(" | ")
      .map((item) => {
        const match = item.match(/^A(\d+):\s*(.*)/);
        return match ? { qno: parseInt(match[1]), answer: match[2] } : null;
      })
      .filter(Boolean);
  }, [showAnswers, answersString]); // Render a single question block

  console.log("generated paper in template is", generatedPaper);

  const renderQuestion = (q, idx, offset) => {
    const qno = offset + idx + 1;
    const text = q.question || "Question text not available.";
    const marks = q.marks || 1;
    let optsHtml = "";
    if (Array.isArray(q.options) && q.options.length) {
      optsHtml = (
        <ol className="options-list">
                   {" "}
          {q.options.map((opt, i) => (
            <li key={i}>{opt}</li>
          ))}
                 {" "}
        </ol>
      );
    }

    return (
      <div key={qno} className="question">
               {" "}
        <div className="qtext">
                    <strong>Q{qno}.</strong> {text}       {" "}
        </div>
                {optsHtml}        <div className="marks">({marks} marks)</div> 
           {" "}
      </div>
    );
  };

  // Render a single answer block
  const renderAnswer = (item) => (
    <div key={item.qno} className="answer">
      <strong>Q{item.qno}.</strong> {item.answer}
    </div>
  ); // Split content into two columns for the view

  const contentToSplit = showAnswers ? answerItems : questions;
  const [leftContent, rightContent] = splitIntoTwo(contentToSplit);

  return (
    <div className="bg-slate-50 p-6 rounded-lg font-[Poppins]">
           {" "}
      <style>
               {" "}
        {`
          /* CSS directly translated from server.js's makeTwoColumnHtml */
          :root { --max-w:1100px; --gap:32px; --divider:1px solid #e1e1e1; }
          .container-paper { max-width: var(--max-w); margin: 0 auto; }
          .card-header { background:#fff; padding:18px; border-radius:8px; border:1px solid #e8e8e8; margin-bottom:14px; text-align:center; font-family: "Times New Roman", Cambria, serif; }
          .card-header h1 { margin:0 0 6px 0; font-size:24px; }
          .meta { margin-top:6px; font-size:14px; }
          .paper-body { background:#fff; padding:20px; border-radius:8px; border:1px solid #eaeaea; position:relative; overflow:visible; }
          .watermark { 
            pointer-events:none; 
            position:absolute; 
            left:50%; 
            top:50%; 
            transform:translate(-50%,-50%) rotate(-28deg); 
            font-size:72px; 
            font-weight:800; 
            color:#000; 
            opacity:0.06; 
            z-index:1; 
            white-space:nowrap; 
          }
          .columns-q { display:flex; gap:var(--gap); position:relative; z-index:2; }
          .col-q { flex:1 1 0; padding:0 12px; box-sizing:border-box; }
          .col-q.left { border-right: var(--divider); padding-right: 28px; }
          .question { margin-bottom:20px; }
          .qtext { margin-bottom:8px; font-size:16px; font-family: "Times New Roman", Cambria, serif; }
          .options-list { margin-left:22px; margin-top:6px; list-style-type: lower-alpha; }
          .options-list li { margin-bottom:6px; font-size: 14px; }
          .marks { margin-top:6px; font-size:13px; color:#444; }
          .seedbox { font-size:12px; color:#666; position:absolute; right:10px; bottom:10px; z-index:3; }
          
          /* Answer Specific Styles */
          .answer { margin-bottom: 15px; font-size: 16px; font-weight: 500; }
          
          /* Print Overrides */
          @media print { 
            body { font-family: "Times New Roman", Cambria, serif !important; margin: 0; }
            .container-paper { max-width: 100%; margin: 0; }
            .watermark { opacity: 0.08 !important; }
            .no-print { display: none !important; }
            .columns-q { flex-direction: row !important; }
            .col-q.left { border-right: 1px solid #e1e1e1; padding-right: 28px; }
          }
          @media (max-width:700px) { .columns-q { flex-direction:column; } .col-q.left { border-right:none; padding-right:0; } }
        `}
             {" "}
      </style>
            {/* Buttons (No Print) */}     {" "}
      <div className="flex justify-between items-center mb-6 no-print">
               {" "}
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
                    Back        {" "}
        </button>
               {" "}
        <div className="flex gap-2">
          {/* 💡 NEW BUTTON: Toggle Answer View */}
          <button
            onClick={() => setShowAnswers((prev) => !prev)}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-200 ${
              showAnswers
                ? "bg-red-600 hover:bg-red-700"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {showAnswers ? "Hide Answers" : "Show Answers"}
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Print / Save as PDF
          </button>
                 {" "}
        </div>
             {" "}
      </div>
            {/* Printable Content */}     {" "}
      <div id="print-area" className="container-paper bg-white">
                {/* Header Card (Dynamic Title) */}       {" "}
        <div className="card-header">
                    <h1>{showAnswers ? "Answer Sheet" : "Question Paper"}</h1> 
                 {" "}
          <div style={{ fontWeight: 700 }}>
            Final Mock Test - Class {finalClassName || "N/A"}
          </div>
                   {" "}
          <div className="meta">
                        <strong>Subject:</strong> {subjectName || "N/A"}{" "}
            &nbsp;&nbsp;             <strong>Exam:</strong>{" "}
            {finalExamName || "N/A"} &nbsp;&nbsp;            {" "}
            <strong>Time:</strong> {examDuration || "30"} Minutes &nbsp;&nbsp;  
                      <strong>Marks:</strong> {finalMarks || "0"}         {" "}
          </div>
                 {" "}
        </div>
                {/* Paper Body */}       {" "}
        <div className="paper-body">
                    <div className="watermark">Bisugen pvt.ltd.</div>         {" "}
          {questionCount === 0 && !showAnswers ? (
            <div className="text-center text-gray-500 py-20">
              No questions were generated for the selected filters.
            </div>
          ) : (
            <div className="columns-q">
                              {/* Left Column */}               {" "}
              <div className="col-q left">
                                 {" "}
                {showAnswers
                  ? leftContent.map(renderAnswer)
                  : leftContent.map((q, idx) => renderQuestion(q, idx, 0))}
                               {" "}
              </div>
                              {/* Right Column */}               {" "}
              <div className="col-q right">
                                 {" "}
                {showAnswers
                  ? rightContent.map(renderAnswer)
                  : rightContent.map((q, idx) =>
                      renderQuestion(q, idx, leftContent.length)
                    )}
                               {" "}
              </div>
                         {" "}
            </div>
          )}
                   {" "}
          <div className="seedbox">
                        Source: {zipPath} &nbsp; Seed: {seed} &nbsp; Items:{" "}
            {questionCount}         {" "}
          </div>
                 {" "}
        </div>
             {" "}
      </div>
         {" "}
    </div>
  );
};

export default GeneratedTemplate;
