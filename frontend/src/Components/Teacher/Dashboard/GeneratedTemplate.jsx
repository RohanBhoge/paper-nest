import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  useContext,
} from "react";
import api from "../../../api";
import { Copy, RefreshCw, Printer, School } from "lucide-react";
import { useOutletContext, useNavigate } from "react-router-dom";
import AuthContext from "../context/auth/AuthContext.jsx";
import PaperContext from "../context/paper/PaperContext.jsx";
import "katex/dist/katex.min.css";
import Latex from "react-latex-next";

const Watermark = ({ text }) => {
  const displayText = text || "PAPERNEST"; // Fallback to "PAPERNEST"
  return <div className="watermark-print">{displayText}</div>;
};

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

  // Handle full ISO strings (e.g., 2025-12-14T00:00:00.000Z) by taking only the date part
  const dateOnly = isoDate.includes("T") ? isoDate.split("T")[0] : isoDate;

  const parts = dateOnly.split("-");
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

const REPLACEMENT_API_URL = import.meta.env.VITE_BACKEND_URL + "/api/v1/paper/replacements";
const STORE_PAPER_API_URL = import.meta.env.VITE_BACKEND_URL + "/api/v1/paper/store-paper";

// --- Mark Allocation Helper ---
const cleanOptionText = (text) => {
  if (!text) return "";
  // Strip prefixes like "A. ", "B. ", "a) ", "1. " etc. (Single letter/digit followed by . or ) and space)
  return text.replace(/^[a-dA-D1-4]\s*[\.\)]\s*/, "").trim();
};

const getQuestionMark = (exam, subject) => {
  const normSubject = (typeof subject === 'string') ? subject.trim() : '';
  const normExam = exam ? exam.toUpperCase() : '';

  switch (normExam) {
    case 'CET':
      if (normSubject === 'Maths') {
        return 2;
      } else if (['Physics', 'Chemistry', 'Biology'].includes(normSubject)) {
        return 1;
      }
      return 1;

    case 'NEET':
    case 'JEE':
      return 4;

    default:
      return 1;
  }
};

// --- Main Component ---

const GeneratedTemplate = ({
  className,
  examName,
  subjectName,
  examDate,
  totalMarks,
  numberOfQuestions: propNumberOfQuestions, // New prop for requested count
  examDuration: propExamDuration,
  mode, // Receive mode prop
  onBack,
}) => {
  const { adminAuthToken, watermark, logo } = useContext(AuthContext);
  const { exam, standards, subjects, setShowGenerateOptions, showGenerateOptions, backendPaperData, examDuration, setExamDuration } =
    useContext(PaperContext);

  const apiData = backendPaperData?.data || backendPaperData || {};
  const originalQuestions = apiData?.metadata?.original_questions_array || [];

  // 💡 LOGIC: Determine mode from prop (generation) or metadata (history retrieval)
  const effectiveMode = mode || apiData?.metadata?.mode;

  const [useColumns, setUseColumns] = useState(true);
  const [viewMode, setViewMode] = useState("questions_only");
  const [paperStored, setPaperStored] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // 💡 Responsive Auto-Column Detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setUseColumns(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [replaceMode, setReplaceMode] = useState(false);
  const [selectedReplaceQuestions, setSelectedReplaceQuestions] = useState([]);
  const [replacementPool, setReplacementPool] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [backOptions, setBakcOptions] = useState(null);
  const [replacementWarning, setReplacementWarning] = useState(null);

  const [displayedQuestions, setDisplayedQuestions] =
    useState(originalQuestions);

  const navigate = useNavigate()
  const showAnswers =
    viewMode === "with_answers" || viewMode === "with_solutions";
  const showSolutions = viewMode === "with_solutions";
  const isAnswerKeyMode = viewMode === "answer_key";

  // 🔄 Sync effect: Log viewMode changes
  useEffect(() => {
    console.log("[GeneratedTemplate] viewMode updated:");
  }, [viewMode]);

  // 🔄 Sync effect: Log replaceMode changes
  useEffect(() => {
    console.log("[GeneratedTemplate] replaceMode updated:");
  }, [replaceMode]);

  // 🔄 Sync effect: Log selectedReplaceQuestions changes
  useEffect(() => {
    console.log("[GeneratedTemplate] selectedReplaceQuestions count:");
  }, [selectedReplaceQuestions]);

  // 🔄 Redirect to History if state is lost (e.g. on page refresh)
  useEffect(() => {
    if (!backendPaperData) {
      console.warn("[GeneratedTemplate] No paper data found in state. Redirecting to history...");
      navigate("/teacher-dashboard/paperHistory");
    }
  }, [backendPaperData, navigate]);

  useEffect(() => {
    let questions = JSON.parse(JSON.stringify(originalQuestions));

    // 💡 NEW: Parse and merge solutions from paper_solutions string if available
    if (apiData.paper_solutions) {
      try {
        let rawSol = apiData.paper_solutions;
        // Handle double-stringified or quoted string from DB
        if (typeof rawSol === 'string' && (rawSol.startsWith('"') || rawSol.startsWith("'"))) {
          try {
            rawSol = JSON.parse(rawSol);
          } catch (e) {
            console.warn("Failed to JSON parse paper_solutions, using raw:", e);
          }
        }

        if (typeof rawSol === 'string') {
          // Split by pipe
          const solParts = rawSol.split('|').map(s => s.trim());

          questions = questions.map((q, i) => {
            if (!q.solution && i < solParts.length) {
              const solText = solParts[i];
              const cleanedSol = solText.replace(/^S\d+\s*[:\.]\s*/i, '');
              q.solution = cleanedSol;
            }
            return q;
          });
        }
      } catch (err) {
        console.error("Error parsing paper_solutions:", err);
      }
    }

    setDisplayedQuestions(questions);
    setSelectedReplaceQuestions([]);
    setReplacementPool([]);
  }, [JSON.stringify(originalQuestions), apiData.paper_solutions]);

  const questionCount = displayedQuestions.length;

  const finalExamName = apiData.exam || apiData.exam_name || exam;
  const finalClassName = apiData.class || apiData.standard || standards;
  // 💡 FIX: In Random (Custom) mode, prioritize the user-input 'totalMarks' prop over backend 'marks'.
  // Backend sums up marks (e.g. 10 * 1 = 10), but we want the user's custom total (e.g. 50).
  const finalMarks = (effectiveMode === 'Random' && totalMarks) ? totalMarks : (apiData.marks || totalMarks);
  const finalSubject = apiData.subject || subjects;
  const finalExamDate = apiData.exam_date || examDate;
  const formattedDate = formatDateDDMMYYYY(finalExamDate);
  const rawDuration = apiData.duration || propExamDuration || examDuration;
  const finalExamDuration = rawDuration || "N/A";
  // 💡 Intended per-question count (from metadata in history or prop in generation)
  const requestedCount = propNumberOfQuestions || apiData?.metadata?.count || apiData?.metadata?.numberOfQuestions || apiData?.metadata?.total_questions || questionCount;

  const baseQuestionMark = useMemo(() => {
    // 💡 IF Custom Selection (Random) AND totalMarks is provided, use the INTENDED per-question mark.
    // We divide totalMarks by the REQUESTED count (e.g. 100/100) to get the clean intended mark (1).
    if (effectiveMode === 'Random' && totalMarks && requestedCount > 0) {
      const intendedMark = Number(totalMarks) / requestedCount;
      // Ensure it's never fractional in the UI even if the math is slightly off
      return Number.isInteger(intendedMark) ? intendedMark : Number(intendedMark.toFixed(2));
    }

    // Default to standard exam marks (neat integers like 1, 2, or 4)
    return getQuestionMark(finalExamName, finalSubject);
  }, [finalExamName, finalSubject, effectiveMode, totalMarks, requestedCount]);

  const totalCalculatedMarks = useMemo(() => {
    // 💡 Total marks is strictly (actual questions shown) * (base mark).
    // This handles the "99/100 questions found" case by adjusting total to 99 instead of breaking the per-question mark.
    return questionCount * baseQuestionMark;
  }, [questionCount, baseQuestionMark]);


  const [leftContent, rightContent] = useMemo(
    () => splitIntoTwo(displayedQuestions),
    [displayedQuestions]
  );

  // --- Storage Logic (omitted for brevity) ---

  const storeGeneratedPaper = useCallback(
    async (data) => {
      if (paperStored) return true;
      if (!data.paper_id) {
        console.error("[DEBUG] Store Error: Missing paper_id in API response.");
        return false;
      }

      try {

        const response = await api.post(STORE_PAPER_API_URL, data, {
          headers: { Authorization: `Bearer ${adminAuthToken}` },
        },
          {
            withCredentials: true
          });

        setPaperStored(true);
        setError(null); // Clear any previous error on success
        return true;
      } catch (err) {
        console.error(
          "[DEBUG] Store Paper API Error:",
          err.response?.data || err.message
        );
        setError(`Warning: Failed to store paper or Paper already exist. Status: ${err.response?.status || "Network Error"}`);
        // Auto clear warning after 5s
        setTimeout(() => setError(""), 5000);
        return false;
      }
    },
    [paperStored, adminAuthToken]
  );

  // 💡 NEW HANDLER: Called when the initial 'Generate' button is clicked
  const handleInitialGenerate = useCallback(async () => {
    // 1. Attempt to store the paper
    // Ensure exam_date and marks are present in payload
    const payload = {
      ...apiData,
      exam_date: finalExamDate,
      marks: totalCalculatedMarks,
      duration: finalExamDuration,
      class: standards,
      metadata: {
        ...(apiData.metadata || {}),
        mode: effectiveMode // 💡 IMPORTANT: Persist mode so history view knows how to calculate marks
      }
    };

    await storeGeneratedPaper(payload);

    // 2. Show the print options regardless of storage success/failure (as requested)
    setShowGenerateOptions(true);
  }, [storeGeneratedPaper, apiData, setShowGenerateOptions, finalExamDate, totalCalculatedMarks, finalExamDuration]);

  // --- Back Button Logic ---

  /** * Handles backing out of the Print Options section. */
  const handleBackFromPrintOptions = () => {
    setShowGenerateOptions(false);
    setViewMode("questions_only"); // Reset view mode to default
  };

  /** * Handles general navigation logic: */
  const handleGlobalBack = () => {
    if (showGenerateOptions) {
      handleBackFromPrintOptions();
      navigate("/teacher-dashboard")
    } else if (replaceMode) {
      // If currently in select/replace mode, cancel selection
      setReplaceMode(false);
      setSelectedReplaceQuestions([]);
      setReplacementPool([]);
      setReplacementWarning(null); // Clear warning on cancel
      setError(null);
    } else {
      // If in the main view (Default state), go back to the dashboard/previous section
      if (onBack) {
        onBack();
      }
    }
  };

  // --- Replacement Logic ---

  const startReplaceMode = () => {
    setReplaceMode(true);
    setReplacementPool([]);
    setReplacementWarning(null);
    setSelectedReplaceQuestions([]);
  };

  // 💡 FIXED: Wrapping handleQuestionSelection in useCallback for state stability
  const handleQuestionSelection = useCallback((questionObject) => {
    const key = getCompositeKey(questionObject);

    setSelectedReplaceQuestions((prevSelected) => {
      const isSelected = prevSelected.some((q) => getCompositeKey(q) === key);
      return isSelected
        ? prevSelected.filter((q) => getCompositeKey(q) !== key)
        : [...prevSelected, questionObject];
    });
  }, []); // Empty dependency array as setSelectedReplaceQuestions is a setter

  // 💡 EFFECT HOOK: Triggers when replacementPool is filled (Corrected Dependencies)
  useEffect(() => {
    // Ensure we have replacement questions AND questions that were selected to be replaced
    if (replacementPool.length > 0 && selectedReplaceQuestions.length > 0) {
      setDisplayedQuestions((prevQuestions) => {
        let nextQuestions = [...prevQuestions];
        let replacementIndex = 0;

        // Iterate through the questions selected by the user
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
            // Preserve the original question number (qno)
            newQuestion.qno = selectedQ.qno;
            nextQuestions[indexToReplace] = newQuestion;
            replacementIndex++;
          }
        });

        return nextQuestions;
      });

      // --- Cleanup and Reset States ---
      setSelectedReplaceQuestions([]);
      setReplacementPool([]);
      setReplaceMode(false);
      setReplacementWarning(null); // Clear warning after successful replacement

      setSuccessMessage(`Successfully replaced ${replacementPool.length} question(s)!`);
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  }, [replacementPool, selectedReplaceQuestions]);

  // Handler to initiate API call and fetch replacement pool
  const fetchReplacementPool = async () => {
    if (selectedReplaceQuestions.length === 0) {
      setError("Please select at least one question to replace.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    setIsFetching(true);
    setError(null);
    setReplacementWarning(null); // Clear previous warnings

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
      class: standards,
      subjects: subjects,
      overallUsedKeys: overallUsedKeys,
      replacementRequests: replacementRequests,
    };

    try {
      const response = await api.post(
        REPLACEMENT_API_URL,
        replacementPayload,
        { headers: { Authorization: `Bearer ${adminAuthToken}` } }
      );

      if (response.data.success) {
        // Handle new response format: { replacementQuestions: [], warning: "..." }
        const { replacementQuestions, warning } = response.data.data;
        setReplacementPool(replacementQuestions || []);
        if (warning) {
          setReplacementWarning(warning);
        }
      } else {
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

      const status = err.response?.status;
      if (status === 404 || (err.response?.data?.message && err.response.data.message.toLowerCase().includes("no unique replacement questions"))) {
        setError(
          "⚠️ Maximum number of unique questions exceeded for this chapter/filter. No more replacements available."
        );
      } else {
        setError(
          `Could not connect to replacement service or server issue (${status || "Network Error"}).`
        );
      }

      // 💡 NEW: Automatically "Cancel Selection" after showing error
      setTimeout(() => {
        setReplaceMode(false);
        setSelectedReplaceQuestions([]);
        setReplacementPool([]);
        setReplacementWarning(null);
        setError(null);
      }, 5000); // 5 seconds visibility
    } finally {
      setIsFetching(false);
    }
  };



  // Handler for printing with a specific view mode
  const handleGeneratePrint = useCallback(async (mode) => {
    // 1. Set the desired view mode
    setViewMode(mode);

    // 2. Wait for React to mount the images in the DOM
    setTimeout(() => {
      const images = Array.from(document.querySelectorAll('img'));

      const imagePromises = images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // Continue even if one fails
        });
      });

      // 3. Wait for all images to physically download, then print
      Promise.all(imagePromises).then(() => {
        // Extra 100ms for browser paint cycle
        setTimeout(() => {
          window.print();
        }, 100);
      });
    }, 150); // Increased slightly for complex DOM renders
  }, []);

  // Helper to render images
  const renderImages = (images) => {
    if (!images || !Array.isArray(images) || images.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-4 mt-2 mb-2 ml-5">
        {images.map((img, idx) => (
          img && img.url ? (
            <img
              key={idx}
              src={img.url}
              alt={`Diagram ${idx + 1}`}
              className="max-h-48 object-contain border border-gray-200 rounded p-1 bg-white"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : null
        ))}
      </div>
    );
  };

  // Renders a single question block
  const renderQuestion = (q, idx) => {
    // Using global index + 1 for numbering since we now render a flat list
    const qno = q.qno || (idx + 1);
    const key = getCompositeKey(q);
    const isSelected = selectedReplaceQuestions.some(
      (sq) => getCompositeKey(sq) === key
    );

    // 💡 Calculate Mark: Use the dynamic baseQuestionMark
    const calculatedMark = baseQuestionMark;

    // 💡 LOGIC CHANGE: If in Answer Key mode, render only the essential answer data.
    if (isAnswerKeyMode) {
      return (
        <div
          key={key}
          // Ensure consistency with the previous UI's item spacing
          className="mb-2 text-base font-semibold"
        >
          <strong className="text-gray-900">{String(qno).padStart(2, "0")}.</strong>
          <span className="text-green-700 ml-1"> <Latex>{q.answer || "N/A"}</Latex></span>
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
            <li key={i}><Latex>{cleanOptionText(opt)}</Latex></li>
          ))}
        </ol>
      );
    }

    return (
      <div
        key={key} // Use the composite key for stability
        className={`mb-4 question-item p-2 rounded-lg transition-colors duration-200 ${isSelected ? "bg-red-100 border border-red-400" : ""
          } ${replaceMode ? "cursor-pointer hover:bg-red-50" : ""}`}
        // 💡 Use the main div click handler when replaceMode is active
        onClick={() => replaceMode && handleQuestionSelection(q)}
      >
        {/* Checkbox for Selection in Replace Mode */}
        {replaceMode && (
          <input
            type="checkbox"
            checked={isSelected}
            // 💡 Ensure the checkbox also triggers the selection handler explicitly
            onChange={(e) => {
              e.stopPropagation(); // Prevents the parent div's onClick from firing twice
              handleQuestionSelection(q);
            }}
            className="float-left mr-2 mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
        )}

        {/* Question Number and Text */}
        <div className={`relative ${replaceMode ? "ml-6" : ""}`}>
          <span className="absolute top-0 right-0 font-normal text-gray-700 whitespace-nowrap bg-white pl-2">
            ({calculatedMark} M)
          </span>
          <div className="pr-12"> {/* Padding to prevent text from going under the marks */}
            <strong className="float-left mr-2">{qno}.</strong>
            <div className="inline">
              <Latex>{q.question}</Latex>
            </div>

            {/* Images drop below the text naturally because they are block elements inside renderImages */}
            <div className="clear-both pt-2">
              {renderImages(q.question_images)}
            </div>
          </div>
        </div>

        {optsHtml}
        {renderImages(q.option_images)}

        {/* Show Answer if enabled */}
        {showAnswers && q.answer && (
          <div className="ml-5 mt-2 text-green-700 font-semibold text-[16px]">
            ✓ Answer: <Latex>{q.answer}</Latex>
          </div>
        )}

        {/* Show Solution if enabled */}
        {showSolutions && (
          <div className="ml-5 mt-3 pt-3 border-t border-dashed border-gray-300">
            <h4 className="font-bold text-base text-indigo-700">Solution:</h4>
            <p className="text-gray-800 text-[15px] italic">
              <Latex>{q.solution || "No solution provided."}</Latex>
            </p>
            {renderImages(q.solution_images)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-50 p-4 md:p-3 lg:p-8 rounded-lg font-[Times New Roman] transition-all duration-300">
      <style>
        {`
    @page { margin: 5mm; }

    .columns-q { 
      display: flex; 
      gap: 10px; 
      margin-bottom: 20px; /* Space between chunks */
    }

    .col-q { 
      flex: 1; 
      min-width: 0;
      max-width: 100%;
      word-break: break-word;
    }


    .question-item {
      break-inside: avoid;
      page-break-inside: avoid;
      margin-bottom: 20px;
      max-width: 100%;
      overflow: hidden;
    }

    /* 💡 NEW: Ensure images and equations don't spill outside PDF margins */
    .question-item img {
      max-width: 100% !important;
      height: auto !important;
      object-fit: contain;
    }
    
    .question-item .katex, 
    .question-item .katex-display {
      max-width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      white-space: normal;
    }

    /* Toggle Switch */
    .toggle-switch { 
      position: relative; 
      display: inline-block; 
      width: 60px; 
      height: 28px; 
    }

    .toggle-switch input { 
      opacity: 0.7; 
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
      @page {
        margin: 5mm;
        size: auto;
      }

      .col-q.left { 
        border-right: 1px solid #000 !important; /* Visible separator line */
        padding-right: 10px; 
      }

      /* hide everything except print-area */
      body * { 
        visibility: hidden !important; 
      }

      /* 💡 NEW: Critical fix for multi-page printing - parents must be visible and have no height/overflow constraints */
      html, body {
        height: auto !important;
        overflow: visible !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      /* Any scrollable parent needs to be visible and non-constraining */
      .flex, main, .overflow-x-auto, .overflow-y-auto {
        overflow: visible !important;
        height: auto !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      #print-area, 
      #print-area * { 
        visibility: visible !important; 
      }

      #print-area { 
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 5mm !important; /* Professional internal padding for the paper */
        position: relative !important;
        min-width: unset !important;
        overflow: visible !important;
        border: 2px solid #000 !important; /* Professional Black Paper Border */
        border-radius: 12px !important;
        box-shadow: none !important;
      }

      .border-black {
        border-color: #000 !important;
        border-width: 1px !important;
        border-style: solid !important;
      }
      
      #print-area * {
        max-width: 100% !important;
      }

      .no-print { 
        display: none !important; 
      }

      /* ★ Watermark always visible on every page */
      .watermark-print {
        display: block !important;
        visibility: visible !important;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-35deg);
        font-size: 130px;
        font-weight: 800;
        color: rgba(0, 0, 0, 0.2) !important; /* Increased opacity (0.08 -> 0.15) for better print visibility */
        z-index: 99999;
        white-space: nowrap;
        pointer-events: none;
        text-align: center;
        width: 100%;
      }

      /* ★ PDF Footer - Watermark style on right side */
      .pdf-footer {
        position: fixed;
        bottom: 10px;
        right: 10px;
        font-size: 10px;
        color: #555 !important;
        font-style: italic;
        opacity: 0.8 !important;
        z-index: 10000;
        display: block !important;
        visibility: visible !important;
      }
      
      .pdf-footer a {
        color: #555 !important;
        text-decoration: none !important;
      }
    }
  `}
      </style>

      <div className="no-print flex flex-col-reverse md:flex-row justify-between items-stretch md:items-center mt-10 mb-6 gap-4">
        <div className="flex flex-wrap items-center justify-between md:justify-start gap-4 md:gap-6 w-full md:w-auto">
          <button
            onClick={handleGlobalBack}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-300 
              ${replaceMode || showGenerateOptions
                ? "bg-gray-500 hover:bg-gray-600"
                : "bg-slate-600 hover:bg-slate-700"
              }
              `}
          >
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

        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 w-full md:w-auto">
          {/* SECTION 1: Select and Generate (Default View) */}
          {!showGenerateOptions && (
            <>
              {/* Select Questions Button & Replace Button */}
              {/* NOTE: We keep the Cancel button outside of handleGlobalBack because it handles state reset *within* this section */}
              <button
                onClick={() => startReplaceMode()}
                className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors duration-300 ${replaceMode ? "bg-red-600" : "bg-gray-600 hover:bg-gray-700"
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

          {/* SECTION 2: Back and Print Options (After clicking Generate) */}
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
        <div className="no-print p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-lg shadow-sm font-medium w-fit mx-auto">
          ⚠️ {error}
        </div>
      )}

      {successMessage && (
        <div className="no-print p-3 mb-4 bg-green-100 text-green-700 border border-green-300 rounded-lg shadow-sm font-medium w-fit mx-auto">
          ✅ {successMessage}
        </div>
      )}

      {replacementWarning && (
        <div className="no-print p-3 mb-4 bg-amber-100 text-amber-700 border border-amber-200 rounded-lg shadow-sm font-medium w-fit mx-auto animate-pulse">
          ⚠️ {replacementWarning}
        </div>
      )}

      <div className="overflow-x-auto w-full pb-4">
        <div id="print-area" className="bg-white p-4 md:p-2 rounded-xl border relative shadow-sm" style={{ minWidth: useColumns ? '900px' : 'auto' }}>
          <Watermark text={watermark} />

          <div className="border border-black p-3 rounded-xl mb-6 mt-2 mx-1">
            <div className="grid grid-cols-3 items-start font-semibold text-[16px]">
              {/* Logo - Column 1 (Left) */}
              <div className="flex flex-col justify-start items-start gap-1">
                <div
                  className="h-14 w-14 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-200 overflow-hidden"
                  title="Institution Logo"
                >
                  {(!logo || logoError) ? (
                    <School className="w-8 h-8 text-slate-400" />
                  ) : (
                    <img
                      src={logo?.startsWith('http') ? logo : `${import.meta.env.VITE_BACKEND_URL}${logo}`}
                      alt="Logo"
                      className="h-full w-full object-contain"
                      crossOrigin="anonymous"
                      onError={() => setLogoError(true)}
                    />
                  )}
                </div>
                <div className="font-bold text-sm text-slate-900">{finalSubject}</div>
              </div>

              {/* Exam Name - Column 2 (Center) */}
              <div className="flex justify-center text-center">
                <h2 className="text-[20px] font-bold uppercase tracking-tight pt-1">
                  {finalExamName}
                </h2>
              </div>

              {/* Details & Subject - Column 3 (Right) */}
              <div className="flex flex-col items-end text-right text-[14px] pt-1">
                <div>Date: {formattedDate}</div>
                <div>Marks: {totalCalculatedMarks}</div>
                <div>Duration: {finalExamDuration} Min</div>
              </div>
            </div>
          </div>
          {/* 💡 Questions Container */}
          <div className="mt-2 text-[17px] leading-8 font-serif w-full">
            {questionCount === 0 ? (
              <div className="text-center text-gray-500 py-20">
                No questions were generated.
              </div>
            ) : useColumns ? (
              // 💡 CHUNKED COLUMN LAYOUT (Industry compromise for zig-zag vs voids)
              // Chunks questions into blocks of 20 to force columns to resync less often, closing voids while saving page real estate
              <div>
                {Array.from({ length: Math.ceil(displayedQuestions.length / 20) }).map((_, chunkIndex) => {
                  const chunk = displayedQuestions.slice(chunkIndex * 20, (chunkIndex + 1) * 20);
                  const [leftContent, rightContent] = splitIntoTwo(chunk);
                  return (
                    <div key={chunkIndex} className="columns-q pb-4">
                      <div className="col-q left">
                        {leftContent.map((q, i) => renderQuestion(q, chunkIndex * 20 + i * 2))}
                      </div>
                      <div className="col-q">
                        {rightContent.map((q, i) => renderQuestion(q, chunkIndex * 20 + i * 2 + 1))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single Layout
              <div className="pb-4">
                {displayedQuestions.map((q, i) => renderQuestion(q, i))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-6">
            --- End of Paper ---
          </div>

          <div className="pdf-footer">
            Powered by <a href="https://bisugentech.in/" target="_blank" rel="noopener noreferrer">Bisugen Technologies Pvt. Ltd.</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedTemplate;