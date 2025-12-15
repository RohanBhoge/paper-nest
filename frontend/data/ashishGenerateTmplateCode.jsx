import React, { useMemo, useState } from "react";
import paperData from "../../../data.json";

// Split questions into two columns (odd indices left, even indices right)
const splitIntoTwo = (arr) => {
  const left = [];
  const right = [];
  arr.forEach((item, index) => {
    index % 2 === 0 ? left.push(item) : right.push(item);
  });
  return [left, right];
};

// Format ISO date to DD/MM/YYYY
const formatDateDDMMYYYY = (isoDate) => {
  if (!isoDate) return "";

  const parts = isoDate.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  const d = new Date(isoDate);
  if (isNaN(d)) return isoDate;

  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
};

const GenerateTemplateQuestionPaper = () => {
  const [useColumns, setUseColumns] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);

  const questions = paperData?.metadata?.original_questions_array || [];
  const formattedDate = formatDateDDMMYYYY(paperData.exam_date);

  const [leftContent, rightContent] = useMemo(
    () => splitIntoTwo(questions),
    [questions]
  );

  const renderQuestion = (q, idx, col) => {
    const qno = useColumns ? (col === 0 ? idx * 2 + 1 : idx * 2 + 2) : idx + 1;

    return (
      <div key={qno} className="mb-4 question-item">
        <div className="flex">
          <strong className="mr-2">{qno}.</strong>
          <p className="flex-1">{q.question}</p>
          <span className="ml-auto font-normal text-gray-700 whitespace-nowrap">
            ({q.marks || 1} M)
          </span>
        </div>

        {q.options?.length > 0 && (
          <ol className="ml-5 list-[lower-alpha] mt-1 text-[15px]">
            {q.options.map((opt, i) => (
              <li key={i}>{opt}</li>
            ))}
          </ol>
        )}

        {/* Show Answer if enabled */}
        {showAnswers && q.answer && (
          <div className="ml-5 mt-2 text-green-700 font-semibold text-[16px]">
            ✓ Answer: {q.answer}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg font-[Poppins]">
      <style>
        {`
          @page {
            margin: 10mm;
          }
          
          .columns-q {
            display: flex;
            gap: 20px;
          }
          
          .col-q {
            flex: 1;
          }
          
          .col-q.left {
            border-right: 1px solid #e2e2e2;
            padding-right: 10px;
          }
          
          .watermark-print {
            display: none;
          }
          
          /* Toggle Switch Styles */
          .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 28px;
          }
          
          .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
          }
          
          .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #cbd5e1;
            transition: 0.3s;
            border-radius: 28px;
          }
          
          .toggle-slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.3s;
            border-radius: 50%;
          }
          
          input:checked + .toggle-slider {
            background-color: #3b82f6;
          }
          
          input:checked + .toggle-slider:before {
            transform: translateX(32px);
          }
          
          @media print {
            body * {
              visibility: hidden;
            }
            
            #print-area,
            #print-area * {
              visibility: visible;
            }
            
            #print-area {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
            }
            
            .no-print {
              display: none !important;
            }
            
            .watermark-print {
              display: block !important;
              visibility: visible !important;
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-28deg);
              font-size: 80px;
              font-weight: bold;
              opacity: 0.15;
              color: #666;
              z-index: 1;
              pointer-events: none;
              white-space: nowrap;
            }
          }
        `}
      </style>

      {/* Control Panel */}
      <div className="no-print flex justify-between items-center mb-4 gap-4">
        {/* Left Side - Toggles */}
        <div className="flex items-center gap-6">
          {/* Column Layout Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-gray-700 font-medium">
              {useColumns ? "Column Layout" : "Single Layout"}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={useColumns}
                onChange={(e) => setUseColumns(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {/* Show Answers Toggle */}
          <div className="flex items-center gap-3">
            <span className="text-gray-700 font-medium">
              {showAnswers ? "With Answers" : "Questions Only"}
            </span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>

        {/* Right Side - Print Button */}
        <button
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Watermark for Print */}
      <div className="watermark-print">PAPERNEST</div>

      {/* Printable Question Paper */}
      <div id="print-area" className="bg-white p-8 rounded-xl border relative">
        {/* Header Section */}
        <div className="border border-black p-4">
          <div className="flex justify-between font-semibold text-[16px]">
            <span>Class: {paperData.class}</span>

            <span className="flex-1 text-center text-[19px] font-bold">
              {paperData.exam_name}
            </span>

            <div className="text-right">
              <div>Date: {formattedDate}</div>
              <div>Marks: {paperData.marks}</div>
            </div>
          </div>

          <div className="text-[17px] font-semibold">
            Subject: {paperData.subject}
          </div>
        </div>

        {/* Questions - Conditional Layout */}
        <div className="mt-6 text-[17px] leading-8 font-serif">
          {useColumns ? (
            // Two Column Layout
            <div className="columns-q">
              <div className="col-q left">
                {leftContent.map((q, i) => renderQuestion(q, i, 0))}
              </div>

              <div className="col-q">
                {rightContent.map((q, i) => renderQuestion(q, i, 1))}
              </div>
            </div>
          ) : (
            // Single Column Layout (No Column)
            <div>{questions.map((q, i) => renderQuestion(q, i, 0))}</div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-6">
          --- End of Paper ---
        </div>
      </div>
    </div>
  );
};

export default GenerateTemplateQuestionPaper;
