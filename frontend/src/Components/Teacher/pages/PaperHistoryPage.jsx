import React, { useEffect, useState, useCallback, useContext } from "react";
import axios from "axios";
// Corrected path reference based on the error: Assuming OmrPage is a peer component.
// NOTE: I'm using OmrPage here as specified by the context, but in a real project, this might be ./OmrIntegratedPage.jsx
import OmrPage from "./OmrPage";
import PaperContext from "../context/paper/PaperContext.jsx";
import AuthProvider from "../context/auth/AuthProvider.jsx";
import AuthContext from "../context/auth/AuthContext.jsx";

function updatePaperInService(paper) {
  // This should eventually be a PUT/POST API call to update the status in the DB
  console.log(
    "SIMULATION: Status update needed in database for paper:",
    paper.paperId
  );
  return true;
}
function clearAllHistory() {
  if (
    window.confirm(
      "Delete all paper history? (This requires a backend API DELETE call)"
    )
  ) {
    console.log("SIMULATION: Sending DELETE request to backend...");
    return true;
  }
  return false;
}
// -----------------------------------------------------------------------------------------

/* ------------------------------ Main Component ------------------------------ */

const PaperHistoryPage = ({ setActiveSection }) => {
  const [papers, setPapers] = useState([]);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("history");
  const [selectedPaper, setSelectedPaper] = useState(null);
  const { form, setForm } = useContext(PaperContext);
  const { adminAuthToken, BackendUrl } = useContext(AuthContext);
  // New States for API status
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // --- API Fetch Function ---
  const fetchPapers = useCallback(async (searchTerm = "") => {
    setLoading(true);
    setFetchError(null);
    console.log(adminAuthToken);
    try {
      // Fetch all paper summaries from the backend
      const response = await axios.get(
        BackendUrl + "/api/v1/paper/get-paper-history",
        {
          // FIXES: Uses 'headers' (plural) and the dynamic 'adminAuthToken'
          headers: {
            Authorization: `Bearer ${adminAuthToken}`,
          },
        }
      );

      if (response.data.success) {
        let fetchedPapers = response.data.papers;

        // Client-side filtering based on current search term
        if (searchTerm) {
          fetchedPapers = fetchedPapers.filter((p) =>
            Object.values(p).some((val) =>
              String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
          );
        }

        // Map the DB structure to the component's expected names and sort
        const mappedPapers = fetchedPapers
          .map((p) => ({
            // Map DB keys to frontend keys
            paperId: p.paper_id,
            examName: p.exam_name,
            className: p.class,
            subjectName: p.subject,
            examDate: p.exam_date, // Formatted by backend for display
            totalMarks: p.totalMarks,
            status: p.status || "checked", // Assuming a default status if missing
          }))
          .sort((a, b) => {
            // Sort by examDate (newest first)
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
  }, []);

  // Load all papers initially on component mount
  useEffect(() => {
    // Only run fetchPapers() when search state is empty initially
    if (!search) {
      fetchPapers(search);
    }
  }, []); // Runs once on mount

  // Re-trigger fetch/filter when search changes
  useEffect(() => {
    // If search term is present, refetch/refilter the displayed list
    if (search) {
      // Note: For large datasets, fetchPapers(search) should hit the API
      // with a query parameter. Here we rely on the initial fetch and filter locally.
      fetchPapers(search);
    }
  }, [search, fetchPapers]);

  const refresh = () => {
    setSearch("");
    fetchPapers(""); // Fetch all papers without search filter
  };

  const handleDeleteAll = () => {
    if (
      !window.confirm(
        "Delete all paper history? (Requires backend implementation)"
      )
    )
      return;

    if (clearAllHistory()) {
      // Simulate success
      setPapers([]);
    }
  };

  const handleCheck = (paper) => {
    // Set selected paper for detailed view
    console.log("paper from handlecheck", paper);
    setForm(paper);
    console.log(form);
    // setSelectedPaper(paper);
    setActiveView("omr");
    if (typeof setActiveSection === "function") setActiveSection("omr");
  };

  const onPaperSaved = (updatedPaper) => {
    updatePaperInService(updatedPaper); // Simulate update
    fetchPapers(); // Reload the list to reflect any changes
  };

  const handleBack = () => {
    setActiveView("history");
    setSelectedPaper(null);
    fetchPapers(); // Reload list
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
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm w-48 focus:ring-2 focus:ring-slate-400 outline-none"
              />

              <button
                onClick={refresh}
                disabled={loading}
                className="bg-slate-100 text-slate-700 px-3 py-2 rounded-md text-sm hover:bg-slate-200 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>

              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-200"
              >
                🗑️ Delete All
              </button>
            </div>
          </div>

          <p className="text-slate-600 mb-4">
            Data loaded from **MySQL Backend API**. Click Check to evaluate
            bundle.
          </p>

          {fetchError && (
            <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">
              Error: {fetchError}
            </div>
          )}

          <div className="overflow-hidden  rounded-lg border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-100 text-slate-700 text-sm">
                <tr>
                  <th className="py-3 px-4">Sr. No.</th>
                  <th className="py-3 px-4">Exam Name</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Exam Date</th>
                  <th className="py-3 px-4">Marks</th>
                  <th className="py-3 px-4">Paper ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-8 text-blue-500">
                      Loading data from backend...
                    </td>
                  </tr>
                ) : papers.length === 0 ? (
                  <tr>
                    <td
                      colSpan="10"
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
                      <td className="py-3 px-4">{idx + 1}</td>
                      <td className="py-3 px-4">{p.examName}</td>
                      <td className="py-3 px-4">{p.className}</td>
                      <td className="py-3 px-4">{p.subjectName}</td>
                      <td className="py-3 px-4">{p.examDate}</td>
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
                          className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-md text-sm hover:bg-blue-200"
                        >
                          Check
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
    </div>
  );
};

export default PaperHistoryPage;
