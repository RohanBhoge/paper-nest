import React, { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
import OmrPage from "./OmrPage";
import PaperContext from "../context/paper/PaperContext.jsx";
import AuthContext from "../context/auth/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

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
  const { setForm, setBackendPaperData, setShowGenerateOptions,examDuration,setExamDuration } = useContext(PaperContext);
  const { adminAuthToken, BackendUrl } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [isFetchingPaper, setIsFetchingPaper] = useState(false);
  const navigate = useNavigate()
  
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState(new Set());
  
  const DELETE_API_URL = BackendUrl + "/api/v1/paper/delete-paper";
  const fetchPapers = useCallback(
    async (searchTerm = "") => {
      setLoading(true);
      setFetchError(null);
      try {
        const response = await axios.get(
          BackendUrl + "/api/v1/paper/get-paper-history",
          {
            headers: {
              Authorization: `Bearer ${adminAuthToken}`,
            },
          }
        );

        if (response.data.success) {
          let fetchedPapers = response.data.papers;
          console.log("[DEBUG] Fetched Papers:", fetchedPapers);

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
              examDuration: p.duration || "N/A",
              status: p.status || "checked",
              generatedPaper: p,
            }))
            .sort((a, b) => {
              if (a.examDate && b.examDate)
                return new Date(b.examDate) - new Date(a.examDate);
              return 0;
            });

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
    [adminAuthToken, BackendUrl]
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

        const response = await axios.get(
          fetchUrl,
          {
            headers: {
              Authorization: `Bearer ${adminAuthToken}`,
            },
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

    if (idsToDelete.length === 0) {
      alert("Please select at least one paper to delete.");
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

      const response = await axios.delete(
        DELETE_API_URL,
        { 
          data: {
            "paper_ids": idsToDelete
          },
          headers: {
            Authorization: `Bearer ${adminAuthToken}`
          }
        }
      );

      if (response.data.success) {
        alert(`Successfully deleted ${idsToDelete.length} paper(s).`);
        console.log("[DEBUG] Deletion API Success:", response.data);
        setDeleteMode(false);
        setSelectedPaperIds(new Set());
        fetchPapers();
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
    fetchPapers(search);
  }, [fetchPapers, search]);

  const refresh = () => {
    setSearch("");
    fetchPapers("");
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
    fetchPapers();
  };

  const handleBack = () => {
    setActiveView("history");
    setSelectedPaper(null);
    fetchPapers();
    if (typeof setActiveSection === "function")
      setActiveSection("paperHistory");
  };

  return (
    <div className="bg-white rounded-xl p-8 lg:p-10 shadow-sm border border-slate-200 w-full">
      {activeView === "history" && (
        <>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
              Paper History
            </h1>

            <div className="flex items-center gap-2">
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

              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-slate-400 outline-none"
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
            <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
              Error: {fetchError}
            </div>
          )}

          <div className="overflow-hidden  rounded-lg border border-slate-200">
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
                  <th className="py-3 px-4">View</th>
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
                      <td className="py-3 px-4">{idx + 1}</td>
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
          generatedPaper={selectedPaper.generatedPaper}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default PaperHistoryPage;