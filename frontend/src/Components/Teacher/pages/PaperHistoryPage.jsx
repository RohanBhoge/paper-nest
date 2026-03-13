import React, { useEffect, useState, useCallback, useContext } from "react";
import api from "../../../api";
import OmrPage from "./OmrPage";
import PaperContext from "../context/paper/PaperContext.jsx";
import AuthContext from "../context/auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import GeneratedTemplate from "../Dashboard/GeneratedTemplate.jsx";

function updatePaperInService(paper) {
  console.log(
    "SIMULATION: Status update needed in database for paper:",
    paper.paperId
  );
  return true;
}

const PaperHistoryPage = ({ setActiveSection }) => {
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("history");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const { setForm, setBackendPaperData, setShowGenerateOptions, examDuration, setExamDuration } = useContext(PaperContext);
  const { adminAuthToken, BackendUrl } = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isFetchingPaper, setIsFetchingPaper] = useState(false);

  // 💡 NEW: Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 💡 NEW: Filtering & Sorting State
  const [sortBy, setSortBy] = useState("created_at DESC");
  const [examFilter, setExamFilter] = useState("");

  const navigate = useNavigate()

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());

  const DELETE_API_URL = BackendUrl + "/api/v1/paper/delete-paper";

  // 🔄 Sync effect: Log deleteMode changes
  useEffect(() => {
    console.log("[PaperHistoryPage] deleteMode updated:", deleteMode);
  }, [deleteMode]);

  // 🔄 Sync effect: Log selectedPaperIds changes
  useEffect(() => {
    console.log("[PaperHistoryPage] selectedPaperIds count:", selectedPaperIds.size);
  }, [selectedPaperIds]);

  // 🔄 Sync effect: Log activeView changes
  useEffect(() => {
    console.log("[PaperHistoryPage] activeView updated:", activeView);
  }, [activeView]);

  const fetchPapers = useCallback(
    async (searchTerm = "", page = 1, sort = sortBy, exam = examFilter) => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await api.get(
          `${BackendUrl}/api/v1/paper/get-paper-history?page=${page}&limit=20&sort=${sort}&exam=${exam}`,
          {
            headers: {
              Authorization: `Bearer ${adminAuthToken}`,
            },
          }
        );

        if (response.data.success) {
          let fetchedPapers = response.data.data;
          console.log("[DEBUG] Fetched Papers:", fetchedPapers);

          if (response.data.pagination) {
            setCurrentPage(response.data.pagination.page);
            setTotalPages(response.data.pagination.totalPages);
            setTotalItems(response.data.pagination.total);
          }

          // Server-side search logic is not fully implemented yet in the API, 
          // but we'll keep the client-side search for now as it was there.
          // However, for sorting and exam filtering, we rely on the server.
          if (searchTerm) {
            fetchedPapers = fetchedPapers.filter((p) =>
              Object.values(p).some((val) =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
              )
            );
          }

          const mappedPapers = fetchedPapers
            .map((p) => ({
              paperId: p.paper_id,
              examName: p.exam_name,
              className: p.class,
              subjectName: p.subject,
              examDate: p.exam_date,
              totalMarks: (p.marks !== undefined && p.marks !== null) ? p.marks : (p.totalMarks || "N/A"),
              numberOfQuestions: p.count || p.metadata?.count || p.metadata?.total_questions || 0, // Capture count
              examDuration: p.duration || "N/A",
              status: p.status || "checked",
              generatedPaper: p,
            }));

          setPapers(mappedPapers);
        } else {
          setFetchError(
            response.data.message || "Unknown error fetching history."
          );
        }
      } catch (error) {
        console.error("API Fetch Error:", error);
        setFetchError(
          "Failed to connect to the history API. Check server status."
        );
      } finally {
        setLoading(false);
      }
    },
    [adminAuthToken, BackendUrl, sortBy, examFilter]
  );

  const handleView = useCallback(
    async (paperSummary) => {
      setIsFetchingPaper(true);
      setFetchError(null);
      const paperId = paperSummary.paperId;

      console.log(`[DEBUG] Attempting to fetch full paper for ID: ${paperId}`);

      try {
        const fetchUrl = `${BackendUrl}/api/v1/paper/get-paper/${paperId}`;
        console.log(`[DEBUG] Fetching from URL: ${fetchUrl}`);

        const response = await api.get(
          fetchUrl,
          {
            headers: {
              Authorization: `Bearer ${adminAuthToken}`,
            },
          },
          {
            withCredentials: true
          }
        );

        const fullPaperData = response.data;
        console.log("[DEBUG] Full Paper Data Received:", fullPaperData);

        setBackendPaperData(fullPaperData);

        const paperToView = {
          ...paperSummary,
          generatedPaper: fullPaperData,
        };

        setSelectedPaper(paperToView);
        console.log("[DEBUG] Data passed to GeneratedTemplate:", paperToView);

        if (setShowGenerateOptions) {
          console.log("[DEBUG] Setting showGenerateOptions to true.");
          setShowGenerateOptions(true);
        }

        setActiveView("view_template");
        if (typeof setActiveSection === "function")
          setActiveSection("view_template");

        navigate("/paper-view")
      } catch (error) {
        console.error(
          "API Fetch Error for single paper:",
          error.response?.data || error.message
        );
        setFetchError(`Failed to fetch paper content (ID: ${paperId}).`);
      } finally {
        setIsFetchingPaper(false);
      }
    },
    [adminAuthToken, BackendUrl, setBackendPaperData, setActiveSection, setShowGenerateOptions]
  );

  const handleToggleDeleteMode = () => {
    setDeleteMode(prev => !prev);
    setSelectedPaperIds(new Set());
  };

  const handleSelectToggle = (paperId) => {
    setSelectedPaperIds(prev => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        next.add(paperId);
      }
      console.log(`[DEBUG] Toggled paper ID ${paperId}. Current selection count: ${next.size}`);
      return next;
    });
  };

  const handleSelectAllToggle = () => {
    const allIds = papers.map(p => p.paperId);
    if (selectedPaperIds.size === allIds.length) {
      setSelectedPaperIds(new Set());
      console.log("[DEBUG] Deselected all papers.");
    } else {
      setSelectedPaperIds(new Set(allIds));
      console.log(`[DEBUG] Selected all ${allIds.length} papers.`);
    }
  };

  const handleDeleteSelected = async () => {
    const idsToDelete = Array.from(selectedPaperIds);
    setSuccessMessage(null);

    if (idsToDelete.length === 0) {
      setFetchError("Please select at least one paper to delete.");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${idsToDelete.length} paper(s)?`)) {
      return;
    }

    setLoading(true);
    setFetchError(null);
    console.log("[DEBUG] Deletion Payload:", { paper_ids: idsToDelete });

    try {
      console.log("ids to delte", idsToDelete, "token", adminAuthToken);

      const response = await api.delete(
        DELETE_API_URL,
        {
          data: {
            "paper_ids": idsToDelete
          },
          headers: {
            Authorization: `Bearer ${adminAuthToken}`
          },
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        setSuccessMessage(`Successfully deleted ${idsToDelete.length} paper(s).`);
        console.log("[DEBUG] Deletion API Success:", response.data);
        setDeleteMode(false);
        setSelectedPaperIds(new Set());
        fetchPapers(search, currentPage);

        // Auto-clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setFetchError(response.data.message || "Failed to delete papers.");
        console.error("[DEBUG] Deletion API Error:", response.data);
      }
    } catch (error) {
      console.error("API Deletion Error:", error);
      setFetchError("Failed to connect to the deletion API.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPapers(search, currentPage, sortBy, examFilter);
  }, [fetchPapers, search, currentPage, sortBy, examFilter]);

  const refresh = () => {
    setSearch("");
    setCurrentPage(1);
    setSortBy("created_at DESC");
    setExamFilter("");
    fetchPapers("", 1, "created_at DESC", "");
  };

  const handleDeleteAll = () => {
    handleToggleDeleteMode();
  };

  const handleCheck = (paper) => {
    setForm(paper);
    setSelectedPaper(paper);
    setActiveView("omr");
    if (typeof setActiveSection === "function") setActiveSection("omr");
  };

  const onPaperSaved = (updatedPaper) => {
    updatePaperInService(updatedPaper);
    fetchPapers(search, currentPage);
  };

  const handleBack = () => {
    setActiveView("history");
    setSelectedPaper(null);
    fetchPapers(search, currentPage);
    if (typeof setActiveSection === "function")
      setActiveSection("paperHistory");
  };

  return (
    <div className="bg-white rounded-xl px-2 py-4 md:p-5 lg:p-6 shadow-sm border border-slate-200 w-full transition-all duration-300">
      {activeView === "history" && (
        <>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Paper History
            </h1>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start md:justify-end">
              {/* 💡 NEW Select All/Cancel Button */}
              {deleteMode && (
                <button
                  onClick={handleSelectAllToggle}
                  disabled={loading || isFetchingPaper}
                  className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-md text-sm hover:bg-indigo-200 disabled:opacity-50"
                >
                  {selectedPaperIds.size === papers.length ? 'Deselect All' : 'Select All'}
                </button>
              )}

              <div className="flex items-center gap-2">
                <select
                  value={examFilter}
                  onChange={(e) => {
                    setExamFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                >
                  <option value="">All Exams</option>
                  <option value="CET">CET</option>
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                >
                  <option value="created_at DESC">Latest</option>
                  <option value="created_at ASC">Oldest</option>
                  <option value="marks DESC">High Marks</option>
                  <option value="marks ASC">Low Marks</option>
                </select>
              </div>

              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm w-full md:w-48 focus:ring-2 focus:ring-slate-400 outline-none"
              />

              <button
                onClick={refresh}
                disabled={loading || deleteMode}
                className="bg-slate-100 text-slate-700 px-3 py-2 rounded-md text-sm hover:bg-slate-200 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              {deleteMode ? (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedPaperIds.size === 0 || loading}
                    className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    🗑️ Delete ({selectedPaperIds.size})
                  </button>
                  <button
                    onClick={handleToggleDeleteMode}
                    className="bg-gray-400 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleDeleteMode}
                  className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-200"
                >
                  🗑️ Select for Deletion
                </button>
              )}
            </div>
          </div>

          {fetchError && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-lg shadow-sm font-medium">
              ⚠️ {fetchError}
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-4 bg-green-100 text-green-700 border border-green-300 rounded-lg shadow-sm font-medium">
              ✅ {successMessage}
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-200 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  {deleteMode && <th className="py-3 px-4 w-1">Sel.</th>}
                  <th className="py-3 px-4">Sr. No.</th>
                  <th className="py-3 px-4">Exam Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Exam Date</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Paper ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check</th>
                  <th className="py-3 px-4 min-w-[100px] text-center">View</th>
                </tr>
              </thead>

              <tbody>
                {loading || isFetchingPaper ? (
                  <tr>
                    <td colSpan={deleteMode ? 11 : 10} className="text-center py-8 text-blue-500">
                      {isFetchingPaper
                        ? "Fetching paper details..."
                        : "Loading data from backend..."}
                    </td>
                  </tr>
                ) : papers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={deleteMode ? 11 : 10}
                      className="text-center py-8 text-slate-500"
                    >
                      No matching papers in the database.
                    </td>
                  </tr>
                ) : (
                  papers.map((p, idx) => (
                    <tr
                      key={p.paperId}
                      className="border-t hover:bg-slate-50 transition-all"
                    >
                      {/* 💡 Selection Checkbox */}
                      {deleteMode && (
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selectedPaperIds.has(p.paperId)}
                            onChange={() => handleSelectToggle(p.paperId)}
                            className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">{((currentPage - 1) * 20) + idx + 1}</td>
                      <td className="py-3 px-4">{p.examName}</td>
                      <td className="py-3 px-4">{p.className}</td>
                      <td className="py-3 px-4">{p.subjectName}</td>
                      <td className="py-3 px-4">{p.examDate ? String(p.examDate).slice(0, 10) : "-"}</td>
                      <td className="py-3 px-4">{p.totalMarks}</td>

                      <td className="py-3 px-4 font-mono text-sm text-blue-600">
                        {p.paperId}
                      </td>

                      <td className="py-3 px-4">
                        {p.status === "checked" ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-green-50 text-green-700 border border-green-100">
                            ✅ Checked
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-red-50 text-red-700 border border-red-100">
                            🔴 Pending
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCheck(p)}
                          disabled={deleteMode}
                          className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-sm hover:bg-blue-200 disabled:opacity-50"
                        >
                          Check
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleView(p)}
                          disabled={isFetchingPaper || deleteMode}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-sm hover:bg-indigo-200 disabled:opacity-50"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 💡 NEW Pagination UI */}
          {!loading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-600 font-medium">
                Showing page {currentPage} of {totalPages} <span className="text-slate-400 mx-1">|</span> {totalItems} total papers
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm font-medium"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1 mx-2 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide px-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-md text-sm transition-all shadow-sm ${currentPage === pageNum
                        ? "bg-blue-600 text-white font-bold border border-blue-600 ring-2 ring-blue-100"
                        : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 font-medium"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-md text-sm hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-sm font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {activeView === "omr" && (
        <OmrPage
          paper={selectedPaper}
          onBack={handleBack}
          onSaved={onPaperSaved}
        />
      )}

      {activeView === "view_template" && selectedPaper && (
        <GeneratedTemplate
          className={selectedPaper.className}
          examName={selectedPaper.examName}
          subjectName={selectedPaper.subjectName}
          examDate={selectedPaper.examDate}
          examDuration={selectedPaper.examDuration}
          totalMarks={selectedPaper.totalMarks}
          numberOfQuestions={selectedPaper.numberOfQuestions} // Pass requested count
          generatedPaper={selectedPaper.generatedPaper}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default PaperHistoryPage;