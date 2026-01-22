import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useContext,
} from "react";
import axios from "axios";
import PaperContext from "../context/paper/PaperContext";
import AuthContext from "../context/auth/AuthContext";

// --- API Endpoints ---

const InputField = ({
  label,
  value,
  onChange,
  disabled = false,
  isReadonly = false,
  name,
}) => (
  <div>
    <label className="block text-slate-700 font-medium mb-1 text-sm">
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      readOnly={isReadonly}
      name={name}
      className={`w-full px-3 py-2 border rounded-lg text-sm ${disabled || isReadonly
        ? "bg-slate-100 text-slate-600"
        : "bg-white border-slate-300 focus:border-blue-500"
        }`}
    />
  </div>
);

const OmrPage = ({ paper: propPaper, onBack, onSaved }) => {
  const { form, setForm } = useContext(PaperContext);
  const { BackendUrl, adminAuthToken } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [paper, setPaper] = useState(null);
  const [fetchedData, setFetchedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = BackendUrl + "/api/paperdata/paper";
  const OCR_API_URL = BackendUrl + "/api/ocrTest/ocr-extract";
  useEffect(() => {
    console.log("")
  }, [form]);

  const fileInputRef = useRef(null);
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    // setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "paperId") {
      setFetchedData(null);
      setPaper(null);
    }
  };

  const downloadRandomExcel = () => {
    const rows = [
      ["Student ID", "Name", "Roll No", "Score", "Remarks"],
      ...Array.from({ length: 15 }).map((_, i) => [
        1001 + i,
        `Student ${String.fromCharCode(65 + (i % 26))}`,
        `R-${202400 + i}`,
        Math.floor(Math.random() * 100),
        Math.random() > 0.5 ? "Pass" : "Needs Improvement",
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "random_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFetchPaper = useCallback(async (paperId) => {
    if (!paperId) return;

    setIsLoading(true);
    setFetchedData(null);
    setMessage({
      type: "info",
      text: `Fetching full content for ${paperId}...`,
    });

    // const url = `${API_BASE_URL}/${paperId}`;

    try {
      const response = await axios.get(
        BackendUrl + `/api/v1/paper/get-paper/${paperId}`,
        {
          // FIXES: Uses 'headers' (plural) and the dynamic 'adminAuthToken'
          headers: {
            Authorization: `Bearer ${adminAuthToken}`,
          },
        }
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        setFetchedData(data);

        // Trigger Random Excel Download
        downloadRandomExcel();

        // setForm((prevForm) => ({
        //   ...prevForm,
        //   paperId: data.paper_id,
        //   examName: data.exam_name || prevForm.examName,
        //   className: data.class || prevForm.className,
        //   subjectName: data.subject || prevForm.subjectName,
        //   examDate: data.exam_date
        //     ? new Date(data.exam_date).toLocaleDateString()
        //     : prevForm.examDate,
        //   totalMarks: data.marks || prevForm.totalMarks,
        // }));

        setPaper({ paperId: data.paper_id, ...data });

        setMessage({
          type: "success",
          text: `Details loaded for ${paperId} from API ✅`,
        });
        return true;
      } else {
        setMessage({
          type: "warning",
          text: `Paper ID ${paperId} not found in database.`,
        });
        return false;
      }
    } catch (error) {
      console.error("API Fetch Error:", error);
      setMessage({
        type: "error",
        text: `Error fetching DB data: ${error.message}`,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const processMasterFileForExtraction = async (masterFile) => {
    setIsLoading(true);
    setFetchedData(null);
    setFiles([]);

    setMessage({ type: "info", text: "Processing document for metadata..." });

    const formData = new FormData();
    formData.append("file", masterFile);

    try {
      const response = await axios.post(OCR_API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success && response.data.extractedData) {
        const extracted = response.data.extractedData;

        const extractedForm = {
          paperId: extracted.paperId || "",
          examName: extracted.examName || "",
          className: extracted.className || "",
          subjectName: extracted.subjectName || "",
          examDate: extracted.examDate || "",
          totalMarks: extracted.totalMarks || "",
        };
        // setForm(extractedForm);

        if (extracted.paperId) {
          setMessage({
            type: "info",
            text: `Metadata extracted. Auto-fetching content for ${extracted.paperId}...`,
          });
          await handleFetchPaper(extracted.paperId);
        } else {
          setMessage({
            type: "warning",
            text: "Metadata extracted, but Paper ID is missing. Please enter manually and click Check & Save.",
          });
        }
      } else {
        setMessage({
          type: "error",
          text: "OCR failed or returned an invalid structure.",
        });
      }
    } catch (error) {
      console.error("OCR API Error:", error);
      setMessage({
        type: "error",
        text: `Failed to process file: ${error.message}. (Is the OCR backend running?)`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onFilesChange = (e) => {
    const uploadedFiles = Array.from(e.target.files || []);

    if (!uploadedFiles || uploadedFiles.length === 0) return;

    if (fetchedData) {
      setFiles(uploadedFiles);
    } else {
      setFiles(uploadedFiles.slice(0, 1));
    }
  };

  useEffect(() => {
    let p = propPaper;
    if (!p) {
      const stored = localStorage.getItem("selected_paper");
      if (stored) p = JSON.parse(stored);
    }

    // if (p && p.paperId) {
    //   setForm({
    //     paperId: p.paperId || "",
    //     examName: p.examName || "",
    //     className: p.className || "",
    //     subjectName: p.subjectName || "",
    //     examDate: p.examDate || "",
    //     totalMarks: p.totalMarks || "",
    //   });
    //   handleFetchPaper(p.paperId);
    // }
  }, [propPaper, handleFetchPaper]);

  const handleCheckPaper = async () => {
    if (isLoading) return;

    const uploadedCount = files.length;
    const isMasterDocUpload = uploadedCount > 0 && !fetchedData;

    // --- STEP 1: EXTRACT/FETCH MISSING DATA ---
    if (!fetchedData) {
      if (isMasterDocUpload) {
        await processMasterFileForExtraction(files[0]);
      } else if (form.paperId) {
        await handleFetchPaper(form.paperId);
      } else {
        setMessage({
          type: "error",
          text: "Upload Master Document or enter Paper ID manually.",
        });
      }
      return;
    }

    // --- STEP 2: OMR PROCESSING ---

    if (files.length === 0) {
      setMessage({ type: "error", text: "Upload the OMR bundle now." });
      return;
    }

    if (!paper && !fetchedData) {
      setMessage({
        type: "error",
        text: "Data object is invalid. Cannot save.",
      });
      return;
    }

    const updatedPaper = {
      ...fetchedData,
      ...form,
      status: "checked",
      fileCount: files.length,
      paperId: form.paperId,
    };

    // --- SIMULATE OMR PROCESSING AND SAVE TO LOCAL STORAGE ---
    const ok = updatePaperInService(updatedPaper);
    if (ok) {
      setMessage({
        type: "success",
        text: `Bundle checked & saved to history ✅`,
      });
      setFiles([]);

      if (fileInputRef.current) fileInputRef.current.value = "";
      if (typeof onSaved === "function") onSaved(updatedPaper);

      setTimeout(() => {
        setMessage(null);
        if (typeof onBack === "function") onBack();
      }, 700);
    } else {
      setMessage({ type: "error", text: "Failed to save — try again." });
      setTimeout(() => setMessage(null), 2500);
    }
  };

  // --- Print/Download Handlers ---

  const handleDownload = () => {
    if (!fetchedData) return;

    const { paper_id, paper_questions, paper_answers } = fetchedData;

    const content =
      `--- ${form.examName} (${paper_id}) ---\n\n` +
      `METADATA:\nExam: ${form.examName}\nClass: ${form.className}\nMarks: ${form.totalMarks}\nDate: ${form.examDate}\n\n` +
      `QUESTION PAPER:\n${"=".repeat(20)}\n${paper_questions}\n\n` +
      `ANSWER KEY:\n${"=".repeat(20)}\n${paper_answers}\n`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${paper_id}_Full_Details.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMessage({
      type: "success",
      text: "Paper content downloaded successfully.",
    });
    setTimeout(() => setMessage(null), 2000);
  };

  const handlePrint = () => {
    if (!fetchedData) return;

    const printContents = document.getElementById(
      "printable-content-area"
    ).innerHTML;
    const originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;

    try {
      window.print();
    } catch (e) {
      console.error("Native printing failed, saving fallback:", e);
      localStorage.setItem(
        `print_fallback_${fetchedData.paper_id}`,
        JSON.stringify(fetchedData)
      );
      setMessage({
        type: "error",
        text: "Printing failed! Content saved to browser storage.",
      });
    } finally {
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };

  // Dynamic button text based on current workflow step
  const getButtonText = () => {
    if (isLoading) return "Processing...";
    if (!fetchedData && files.length > 0)
      return "1. Extract Metadata & Fetch Paper 🔎";
    if (!fetchedData && form.paperId) return "Load Paper Details";
    if (fetchedData && files.length === 0) return "Load Paper Details";
    if (fetchedData && files.length > 0)
      return `Load Paper Details(${files.length})`;
    return "Load Paper Details";
  };

  return (
    <div className="w-full min-h-[80vh] p-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="mb-6 bg-slate-100 text-slate-700 px-4 py-2 rounded-md hover:bg-slate-200"
      >
        ⬅ Back to History
      </button>
      <div className="bg-white rounded-xl p-8 lg:p-12 shadow-sm border border-slate-200 w-full max-w-3xl mx-auto">
        <h1 className="text-2xl lg:text-3xl font-bold mb-6 text-slate-900 text-center">
          Check Paper (OMR)
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 💡 INPUT FIELDS NOW EDITABLE/FUNCTIONAL */}
            <InputField
              label="Paper ID (Editable)"
              value={form.paperId}
              onChange={handleFormChange}
              name="paperId"
              disabled={isLoading}
            />
            <InputField
              label="Exam Name"
              value={form.examName}
              onChange={handleFormChange}
              name="examName"
              disabled={isLoading}
            />
            <InputField
              label="Class"
              value={form.className}
              onChange={handleFormChange}
              name="className"
              disabled={isLoading}
            />
            <InputField
              label="Subject"
              value={form.subjectName}
              onChange={handleFormChange}
              name="subjectName"
              disabled={isLoading}
            />
            <InputField
              label="Exam Date"
              value={form.examDate}
              onChange={handleFormChange}
              name="examDate"
              disabled={isLoading}
            />
            <InputField
              label="Total Marks"
              value={form.totalMarks}
              onChange={handleFormChange}
              name="totalMarks"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-2">
              Upload OMR Bundle
            </label>
            <input
              id="omr-file-input"
              ref={fileInputRef}
              type="file"
              multiple={!!fetchedData}
              onChange={onFilesChange}
              accept={fetchedData ? "image/*,.pdf" : ".pdf,image/*,.doc,.docx"}
              className="w-full file:text-sm file:py-2 file:px-3 file:rounded file:border-0 file:bg-slate-100 file:cursor-pointer"
              disabled={isLoading}
            />
            {files.length > 0 && (
              <div className="mt-2 text-sm text-slate-600">
                {files.length} {fetchedData ? "OMR" : "Master"} file(s)
                selected:
                <ul className="list-disc pl-5 mt-1">
                  {files.map((f, idx) => (
                    <li key={idx} className="truncate">
                      {f.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckPaper}
            disabled={isLoading || (files.length === 0 && !form.paperId)}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-all disabled:bg-blue-300"
          >
            {getButtonText()}
          </button>

          {message && (
            <div
              className={`mt-3 px-4 py-2 rounded-md text-sm font-medium ${message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-100"
                : message.type === "info"
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "bg-red-50 text-red-700 border border-red-100"
                }`}
            >
              {message.text}
            </div>
          )}
        </div>
      </div>
      {/* --- ADDED: Fetched Content Section --- */}
      {/* {fetchedData && (
        <div className="mt-8 bg-white rounded-xl p-8 lg:p-12 shadow-md border border-slate-300 w-full max-w-3xl mx-auto">
          <h2 className="text-xl font-bold mb-4 text-slate-900 text-center">
            Retrieved Paper Content
          </h2>

          <div
            id="printable-content-area"
            className="prose max-w-none text-sm p-4 border rounded-lg bg-gray-50 mb-4"
          >
            <h3 className="text-lg font-bold">
              Paper: {fetchedData.exam_name} ({fetchedData.paper_id})
            </h3>

            <h4 className="mt-4 mb-2 font-semibold text-base">
              Question Paper:
            </h4>
            <pre className="whitespace-pre-wrap text-slate-800 border-l-4 border-l-teal-400 pl-3 py-1 bg-white">
              {fetchedData.paper_questions}
            </pre>

            <h4 className="mt-4 mb-2 font-semibold text-base">Answer Key:</h4>
            <pre className="whitespace-pre-wrap text-slate-800 border-l-4 border-l-red-400 pl-3 py-1 bg-white">
              {fetchedData.paper_answers}
            </pre>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handlePrint}
              className="flex-1 bg-teal-600 text-white font-semibold py-3 rounded-lg hover:bg-teal-700 transition-all"
            >
              🖨️ Print Paper
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-yellow-600 text-white font-semibold py-3 rounded-lg hover:bg-yellow-700 transition-all"
            >
              ⬇️ Download as Text File
            </button>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default OmrPage;
