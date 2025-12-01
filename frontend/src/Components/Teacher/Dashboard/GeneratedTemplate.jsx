import React, {
  useMemo,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
// 💡 MOCK IMPORTS - REPLACE WITH ACTUAL IMPLEMENTATION IN YOUR PROJECT
import axios from "axios";
import AuthContext from "../context/auth/AuthContext.jsx";
import PaperContext from "../context/paper/PaperContext.jsx";
import { useNavigate } from "react-router-dom";
// END MOCK IMPORTS

// Split questions into two columns (odd indices left, even indices right)
const splitIntoTwo = (arr) => {
  const left = [];
  const right = [];
  arr.forEach((item, index) => {
    // Q1, Q3, ... (index 0, 2, ...) go to left
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

// Function to calculate the Composite Key (ChapterName::ID) for replacement tracking
const getCompositeKey = (q) => {
  const qId = String(q.id || q.qno || q.paper_id || "unknown");
  const qChapter = String(q.chapter || q.chapter_name || "unknown");
  return `${qChapter}::${qId}`;
};

const REPLACEMENT_API_URL = "http://localhost:5000/api/v1/paper/replacements";
const STORE_PAPER_API_URL = "http://localhost:5000/api/v1/paper/store-paper";

// --- Mark Allocation Helper ---
const getQuestionMark = (exam, subject) => {
    const normSubject = subject ? subject.trim() : '';
    const normExam = exam ? exam.toUpperCase() : '';

    switch (normExam) {
        case 'CET':
            // CET: Math is 2 marks; Physics, Chemistry, Biology are 1 mark.
            if (normSubject === 'Maths') {
                return 2;
            } else if (['Physics', 'Chemistry', 'Biology'].includes(normSubject)) {
                return 1;
            }
            return 1; // Default for other CET subjects
        
        case 'NEET':
        case 'JEE':
            // NEET/JEE: 4 marks per question for every subject.
            return 4;
            
        default:
            // Fallback to 1 mark if exam type is unknown
            return 1; 
    }
};

// --- Main Component ---

const GeneratedTemplate = ({
  className,
  examName,
  subjectName,
  examDate,
  examDuration,
  totalMarks,
  onBack, 
}) => {
  const { adminAuthToken } = useContext(AuthContext);
  const { exam, standards, subjects, setShowGenerateOptions, showGenerateOptions, backendPaperData } =
    useContext(PaperContext);

  const apiData = backendPaperData?.data || backendPaperData || {};
  const originalQuestions = apiData?.metadata?.original_questions_array || [];

  console.log("[DEBUG] Generated Paper Data (Prop):", backendPaperData); 

  const [useColumns, setUseColumns] = useState(true);
  // 💡 NOTE: The possible viewModes are now: "questions_only", "with_answers", "with_solutions", "answer_key"
  const [viewMode, setViewMode] = useState("questions_only"); 
  const [paperStored, setPaperStored] = useState(false);

  const [replaceMode, setReplaceMode] = useState(false);
  const [selectedReplaceQuestions, setSelectedReplaceQuestions] = useState([]);
  const [replacementPool, setReplacementPool] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [backOptions,setBakcOptions]=useState(null)

  const [displayedQuestions, setDisplayedQuestions] =
    useState(originalQuestions);

  const navigate= useNavigate()
  // Derived view states
  // Answer Key mode is now separate from the other two 'show' modes
  const showAnswers =
    viewMode === "with_answers" || viewMode === "with_solutions";
  const showSolutions = viewMode === "with_solutions";
  // 💡 NEW: Check for the new Answer Key Only mode
  const isAnswerKeyMode = viewMode === "answer_key"; 

  // Sync original questions when the paper data changes (e.g., first load)
  useEffect(() => {
    setDisplayedQuestions(JSON.parse(JSON.stringify(originalQuestions)));
    setSelectedReplaceQuestions([]);
    setReplacementPool([]);
  }, [JSON.stringify(originalQuestions)]);

  // Derived values from PROPS and API DATA
  const formattedDate = formatDateDDMMYYYY(examDate);
  const questionCount = displayedQuestions.length;

  const finalExamName = exam;
  const finalClassName = standards;
  const finalMarks = apiData.marks || totalMarks;
  const finalSubject = subjects;

  const [leftContent, rightContent] = useMemo(
    () => splitIntoTwo(displayedQuestions),
    [displayedQuestions]
  );

  // --- Storage Logic ---

  const storeGeneratedPaper = useCallback(
    async (data) => {
      if (paperStored) return true;
      if (!data.paper_id) {
        console.error("[DEBUG] Store Error: Missing paper_id in API response.");
        return false;
      }

      try {
        console.log("[DEBUG] Storing Paper Payload:", data);
        const response = await axios.post(STORE_PAPER_API_URL, data, {
          headers: { Authorization: `Bearer ${adminAuthToken}` },
        });
        
        console.log("[DEBUG] Store API Response:", response.data);
        
        console.log("Paper stored successfully!");
        setPaperStored(true);
        setError(null); // Clear any previous error on success
        return true;
      } catch (err) {
        console.error(
          "[DEBUG] Store Paper API Error:",
          err.response?.data || err.message
        );
        setError(
          `Warning: Failed to permanently store paper on the backend. Status: ${
            err.response?.status || "Network Error"
          }`
        );
        return false;
      }
    },
    [paperStored, adminAuthToken]
  );

  // 💡 NEW HANDLER: Called when the initial 'Generate' button is clicked
  const handleInitialGenerate = useCallback(async () => {
    // 1. Attempt to store the paper
    await storeGeneratedPaper(apiData);

    // 2. Show the print options regardless of storage success/failure (as requested)
    setShowGenerateOptions(true);
  }, [storeGeneratedPaper, apiData, setShowGenerateOptions]);

  // --- Back Button Logic ---

  /** * Handles backing out of the Print Options section. */
  const handleBackFromPrintOptions = () => {
    setShowGenerateOptions(false);
    setViewMode("questions_only"); // Reset view mode to default
  };

  /** * Handles general navigation logic: */
  const handleGlobalBack = () => {
    console.log("show generate options",showGenerateOptions);
    
    if (showGenerateOptions) {
      handleBackFromPrintOptions();
      navigate("/teacher-dashboard")
    } else if (replaceMode) {
      // If currently in select/replace mode, cancel selection
      setReplaceMode(false);
      setSelectedReplaceQuestions([]);
      setReplacementPool([]);
      setError(null);
    } else {
      // If in the main view (Default state), go back to the dashboard/previous section
      if (onBack) {
        onBack();
      }
    }
  };

  // --- Replacement Logic ---

  // Handler for selecting a question to be replaced
  const handleQuestionSelection = (questionObject) => {
    const key = getCompositeKey(questionObject);

    setSelectedReplaceQuestions((prevSelected) => {
      const isSelected = prevSelected.some((q) => getCompositeKey(q) === key);
      return isSelected
        ? prevSelected.filter((q) => getCompositeKey(q) !== key)
        : [...prevSelected, questionObject];
    });
  };

  // 💡 EFFECT HOOK: Triggers when replacementPool is filled
  useEffect(() => {
    if (replacementPool.length > 0) {
      console.log(`[DEBUG] Performing replacement swap for ${replacementPool.length} question(s).`);
      setDisplayedQuestions((prevQuestions) => {
        let nextQuestions = [...prevQuestions];
        let replacementIndex = 0;

        selectedReplaceQuestions.forEach((selectedQ) => {
          const selectedKey = getCompositeKey(selectedQ);
          const indexToReplace = nextQuestions.findIndex(
            (q) => getCompositeKey(q) === selectedKey
          );

          if (
            indexToReplace !== -1 &&
            replacementIndex < replacementPool.length
          ) {
            const newQuestion = replacementPool[replacementIndex];
            newQuestion.qno = selectedQ.qno;
            nextQuestions[indexToReplace] = newQuestion;
            replacementIndex++;
          }
        });

        return nextQuestions;
      });

      setSelectedReplaceQuestions([]);
      setReplacementPool([]);
      setReplaceMode(false);
      alert(`Successfully replaced ${replacementPool.length} question(s)!`);
    }
  }, [replacementPool]);

  // Handler to initiate API call and fetch replacement pool
  const fetchReplacementPool = async () => {
    if (selectedReplaceQuestions.length === 0) {
      alert("Please select at least one question to replace.");
      return;
    }

    setIsFetching(true);
    setError(null);

    const overallUsedKeys = displayedQuestions.map(getCompositeKey);
    const chapterRequestsMap = selectedReplaceQuestions.reduce((map, q) => {
      const chapterName = q.chapter || "unknown_chapter";
      map.set(chapterName, (map.get(chapterName) || 0) + 1);
      return map;
    }, new Map());

    const replacementRequests = Array.from(
      chapterRequestsMap,
      ([chapter, count]) => ({ chapter, count })
    );
    
    const replacementPayload = {
        exam: exam,
        standards: standards,
        subjects: subjects,
        overallUsedKeys: overallUsedKeys,
        replacementRequests: replacementRequests,
    };
    
    console.log("[DEBUG] Replacement Request Payload:", replacementPayload);


    try {
      const response = await axios.post(
        REPLACEMENT_API_URL,
        replacementPayload,
        { headers: { Authorization: `Bearer ${adminAuthToken}` } }
      );

      if (response.data.success) {
        console.log("[DEBUG] Replacement API Success. New Questions:", response.data.replacementQuestions);
        setReplacementPool(response.data.replacementQuestions || []);
      } else {
        console.error("[DEBUG] Replacement API Error (Backend Fail):", response.data);
        setError(
          response.data.message || "Failed to fetch replacement options."
        );
        setReplacementPool([]);
      }
    } catch (err) {
      console.error(
        "[DEBUG] Replacement API Error (Network/Server):",
        err.response?.data || err.message
      );
      setError(
        "Could not connect to replacement service or server issue (404/500)."
      );
    } finally {
      setIsFetching(false);
    }
  };

  // Dummy solution function
  const getDummySolution = (q) => {
    return `Solution ${
      q.qno || q.id
    }: To solve this, we first analyze the key variables. Since the question relates to the chapter '${
      q.chapter || "Default"
    }' and its type is typically objective, the derivation involves simplifying the given equation or applying the core concept. The final answer, ${
      q.answer || "Option A"
    }, is reached by satisfying all boundary conditions.`;
  };

  // Handler for printing with a specific view mode
  const handleGeneratePrint = useCallback(async (mode) => {
    // 1. Set the desired view mode
    setViewMode(mode);
    console.log(`[DEBUG] Setting viewMode to '${mode}' before printing.`);

    // 2. Wait for the state update
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  // Renders a single question block
  const renderQuestion = (q, idx, col) => {
    const qno =
      q.qno || (useColumns ? (col === 0 ? idx * 2 + 1 : idx * 2 + 2) : idx + 1);
    const key = getCompositeKey(q);
    const isSelected = selectedReplaceQuestions.some(
      (sq) => getCompositeKey(sq) === key
    );

    // 💡 Calculate Mark: Use the fixed exam scheme based on current context
    const calculatedMark = getQuestionMark(finalExamName, finalSubject);

    // 💡 LOGIC CHANGE: If in Answer Key mode, render only the essential answer data.
    if (isAnswerKeyMode) {
      return (
        <div 
          key={key} 
          // Ensure consistency with the previous UI's item spacing
          className="mb-2 text-base font-semibold"
        >
          <strong className="text-gray-900">{String(qno).padStart(2, "0")}.</strong>
          <span className="text-green-700 ml-1">{q.answer || "N/A"}</span>
        </div>
      );
    }


    // --- Standard Question/Answer/Solution Rendering (when NOT in Answer Key mode) ---
    let optsHtml = null;
    // 💡 Defensive check for q.options
    if (q.options && Array.isArray(q.options) && q.options.length) {
      optsHtml = (
        <ol className="ml-5 list-[lower-alpha] mt-1 text-[15px]">
          {q.options.map((opt, i) => (
            <li key={i}>{opt}</li>
          ))}
        </ol>
      );
    }

    return (
      <div
        key={key} // Use the composite key for stability
        className={`mb-4 question-item p-2 rounded-lg transition-colors duration-200 ${
          isSelected ? "bg-red-100 border border-red-400" : ""
        } ${replaceMode ? "cursor-pointer hover:bg-red-50" : ""}`}
        onClick={() => replaceMode && handleQuestionSelection(q)} // Only allow selection in replace mode
      >
        {/* Checkbox for Selection in Replace Mode */}
        {replaceMode && (
          <input
            type="checkbox"
            checked={isSelected}
            // Use the same selection handler for the input
            onChange={(e) => {
              e.stopPropagation(); // Prevent the parent div's onClick from firing twice
              handleQuestionSelection(q);
            }}
            className="float-left mr-2 mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
        )}

        {/* Question Number and Text */}
        <div className={`flex ${replaceMode ? "ml-6" : ""}`}>
          <strong className="mr-2">{qno}.</strong>
          <p className="flex-1">{q.question}</p>
          <span className="ml-auto font-normal text-gray-700 whitespace-nowrap">
            ({calculatedMark} M)
          </span>
        </div>

        {optsHtml}

        {/* Show Answer if enabled */}
        {showAnswers && q.answer && (
          <div className="ml-5 mt-2 text-green-700 font-semibold text-[16px]">
            ✓ Answer: {q.answer}
          </div>
        )}

        {/* Show Solution if enabled */}
        {showSolutions && (
          <div className="ml-5 mt-3 pt-3 border-t border-dashed border-gray-300">
            <h4 className="font-bold text-base text-indigo-700">Solution:</h4>
            {/* Pass the full question object to getDummySolution for context */}
            <p className="text-gray-800 text-[15px] italic">
              {getDummySolution(q)}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 p-6 rounded-lg font-[Times New Roman]">
     <style>
        {`
          @page { margin: 10mm; }
          .columns-q { display: flex; gap: 20px; }
          .col-q { flex: 1; }
          .col-q.left { border-right: 1px solid #e2e2e2; padding-right: 10px; }
          .watermark-print { display: none; }
          /* Toggle Switch Styles */
          .toggle-switch { position: relative; display: inline-block; width: 60px; height: 28px; }
          .toggle-switch input { opacity: 0; width: 0; height: 0; }
          .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: 0.3s; border-radius: 28px; }
          .toggle-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 4px; bottom: 4px; background-color: white; transition: 0.3s; border-radius: 50%; }
          input:checked + .toggle-slider { background-color: #3b82f6; }
          input:checked + .toggle-slider:before { transform: translateX(32px); }
          @media print {
            body * { visibility: hidden; }
            #print-area, #print-area * { visibility: visible; } 
            #print-area { position: absolute; top: 0; left: 0; width: 100%; }
            .no-print { display: none !important; }
            .watermark-print {
              display: block !important; visibility: visible !important;
              position: fixed; top: 50%; left: 50%;
              transform: translate(-50%, -50%) rotate(-28deg);
              font-size: 80px; font-weight: bold; opacity: 0.15; color: #666;
              z-index: 1; pointer-events: none; white-space: nowrap;
            }
          }
        `}
      </style>          

      <div className="no-print flex justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-6">
          <button
            onClick={handleGlobalBack}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-300 
            ${
              replaceMode || showGenerateOptions
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-slate-600 hover:bg-slate-700"
            }
            `}
          >
            {/* If in print options, back goes to dashboard, otherwise it goes one step back (cancel/exit) */}
            {showGenerateOptions
              ? "Back to Dashboard"
              : replaceMode
              ? "Cancel Selection"
              : "Back"}
          </button>

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
        </div>

        {/* Right Side - Replacement and Generation Buttons */}
        <div className="flex gap-2">
          {/* SECTION 1: Select and Generate (Default View) */}
          {!showGenerateOptions && (
            <>
              {/* Select Questions Button & Replace Button */}
              {/* NOTE: We keep the Cancel button outside of handleGlobalBack because it handles state reset *within* this section */}
              <button
                onClick={() => setReplaceMode((prev) => !prev)}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-300 ${
                  replaceMode ? "bg-red-600" : "bg-gray-600 hover:bg-gray-700"
                }`}
                disabled={isFetching}
              >
                {replaceMode ? "Cancel Selection" : "Select Questions"}
              </button>

              {replaceMode && (
                <button
                  onClick={fetchReplacementPool}
                  disabled={selectedReplaceQuestions.length === 0 || isFetching}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {isFetching
                    ? "Searching..."
                    : `Replace ${selectedReplaceQuestions.length}`}
                </button>
              )}

              {/* Initial Generate Button 💡 Calls new handler to store paper */}
              <button
                onClick={handleInitialGenerate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                Generate
              </button>
            </>
          )}

          {showGenerateOptions && (
            <>
              {/* Print Options - Triggers only print/view mode change */}
              <button
                onClick={() => handleGeneratePrint("questions_only")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Questions Only
              </button>
              <button
                onClick={() => handleGeneratePrint("with_answers")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                With Answers
              </button>
              <button
                onClick={() => handleGeneratePrint("with_solutions")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                With Answers & Solution
              </button>
              {/* Answer Key Only button (Consistent blue color) */}
              <button
                onClick={() => handleGeneratePrint("answer_key")}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Answer Key Only
              </button>
            </>
          )}
        </div>
        
      </div>

      {error && (
        <div className="no-print text-red-500 text-center mb-4">{error}</div>
      )}

      <div className="watermark-print">Bisugen Pvt. Ltd.</div>

      <div id="print-area" className="bg-white p-8 rounded-xl border relative">
  
        <div className="border border-black p-4">
          <div className="flex justify-between font-semibold text-[16px]">
            <span>Class: {finalClassName}</span>

            <span className="flex-1 text-center text-[19px] font-bold">
              {finalExamName}
            </span>

            <div className="text-right">
              <div>Date: {formattedDate}</div>
              <div>Marks: {finalMarks}</div>
            </div>
          </div>

          <div className="text-[17px] font-semibold">
            Subject: {finalSubject}
          </div>
        </div>
        <div className="mt-6 text-[17px] leading-8 font-serif">
          {questionCount === 0 ? (
            <div className="text-center text-gray-500 py-20">
              No questions were generated.
            </div>
          ) : useColumns ? (
            <div className="columns-q">
              <div className="col-q left">
                {leftContent.map((q, i) => renderQuestion(q, i, 0))}
              </div>

              <div className="col-q">
                {rightContent.map((q, i) => renderQuestion(q, i, 1))}
              </div>
            </div>
          ) : (
            <div>
              {displayedQuestions.map((q, i) => renderQuestion(q, i, 0))}
            </div>
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

export default GeneratedTemplate;