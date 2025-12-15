import {
  handleError,
  generatePaperId,
  formatPaperContent,
  selectQuestions,
} from "../utils/generatePaperHelper.js";

import {
  getPapersByUserId,
  storeNewPaperForUser,
  deletePapersForUser,
  getPaperByIdForUser,
} from "../utils/helperFunctions.js";

import {
  makeSeed,
  seededShuffle,
  loadQuestionsFromZip,
  matchesFiltersObj,
} from "../utils/zipLoader.js";

const getPaper = async (req, res) => {
  const paperId = req.params.id;
  const userId = req.user?.id;

  if (!userId)
    return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const paper = await getPaperByIdForUser(userId, paperId);

    if (paper) {
      res.status(200).json({ success: true, data: paper });
    } else {
      res.status(404).json({
        success: false,
        message: `Paper with ID '${paperId}' not found for this user.`,
      });
    }
  } catch (error) {
    console.error("API GET Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching data.",
    });
  }
};

const deletePapers = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const incoming =
      req.body?.paper_ids || req.body?.paperIds || req.body?.papers;
    if (!Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide an array of paper IDs in 'paper_ids'",
      });
    }

    const paperIds = incoming.map((p) => String(p)).slice(0, 200);

    const result = await deletePapersForUser(userId, paperIds);

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount,
      deletedIds: result.deletedIds,
    });
  } catch (error) {
    console.error(
      "API DELETE Error:",
      error && error.message ? error.message : error
    );
    res.status(500).json({
      success: false,
      message: "Internal server error during deletion.",
    });
  }
};

const getAllPaperSummaries = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const papers = await getPapersByUserId(userId);

    const summaries = papers.map((p) => ({
      paper_id: p.paper_id,
      exam_name: p.exam_name,
      class: p.class,
      subject: p.subject,
      exam_date: p.exam_date,
      totalMarks: p.marks || 0,
      status: "checked",
      created_at: p.created_at,
    }));

    res.json({ success: true, papers: summaries });
  } catch (error) {
    console.error("DB Fetch User Papers Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve paper history.",
      error: error.message,
    });
  }
};

const generatePaper = async (req, res) => {
  try {
    const params = { ...req.body, count: req.body.count || 10 };
    const result = await selectQuestions(params);
    const selected = result.selected;
    if (selected.length === 0) {
      return handleError("No questions found matching criteria.", 404, res);
    }

    let totalMarks = 0;
    for (const q of selected) {
      totalMarks += Number(q.marks ?? q.mark ?? 1) || 0;
    }

    const { paper_questions, paper_answers, question_list } =
      formatPaperContent(selected);

    const paperData = {
      paper_id: generatePaperId(params.exam, params.standard),
      exam_name: String(params.exam || "").trim(),
      class: String(params.standard || "").trim() + " Grade",
      subject: String(params.subject || params.chapters?.[0] || "").trim(),
      exam_date: params.exam_date,
      marks: totalMarks,
      paper_questions: paper_questions,
      paper_answers: paper_answers,
      metadata: {
        seed: result.seed,
        question_count: selected.length,
        zip_path: result.zipPath || "N/A",
        original_questions_array: question_list,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Paper generated successfully, ready for client review/storage.",
      data: paperData,
    });
  } catch (err) {
    return handleError(err, err.status || 500, res);
  }
};

const storePaper = async (req, res) => {
  const paperData = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return handleError("Authenticated user id not found on request", 401, res);
  }
  if (!paperData.paper_id || !paperData.paper_questions) {
    return handleError(
      "Missing required paper data fields (paper_id, paper_questions).",
      400,
      res
    );
  }

  try {
    const dbInsertId = await storeNewPaperForUser(userId, paperData);

    return res.status(201).json({
      success: true,
      message: "Paper stored successfully.",
      db_id: dbInsertId,
      paper_id: paperData.paper_id,
    });
  } catch (dbError) {
    if (dbError.code === "ER_DUP_ENTRY") {
      return handleError(
        `Paper ID '${paperData.paper_id}' already exists.`,
        409,
        res
      );
    }

    console.error("DB Erro  r in storePaper:", dbError);
    return handleError("Database insertion failed.", 500, res);
  }
};

const getReplaceableQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      exam,
      standards,
      subjects,
      overallUsedKeys = [],
      replacementRequests = [],
    } = req.body;

    const standardArr = Array.isArray(standards)
      ? standards
      : String(standards || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const subjectArr = Array.isArray(subjects)
      ? subjects
      : String(subjects || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    if (replacementRequests.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Replacement request list is required.",
      });
    }

    const globalExclusionSet = new Set(overallUsedKeys.map(String));

    const zipRes = await loadQuestionsFromZip();

    if (!zipRes.ok) {
      const loadError = new Error(
        zipRes.error || "ZIP file could not be loaded."
      );
      loadError.status = 500;
      throw loadError;
    }
    const allQ = zipRes.questions || [];

    const finalReplacements = [];
    let totalNeeded = 0;

    for (const request of replacementRequests) {
      const { chapter, count } = request;
      const replacementCount = Number(count) > 0 ? Number(count) : 1;
      totalNeeded += replacementCount;

      if (!chapter) continue;

      const chaptersArr = [chapter]; 

      const validPool = allQ.filter((q) => {
        const isContextMatch = matchesFiltersObj(q, {
          exam,
          standardArr,
          subjectArr,
          chaptersArr, 
        });

        if (isContextMatch) {
          const qId = String(q.id || q.qno || "N/A");
          const qChapter = String(q.chapter || q.chapter_name || "N/A");
          const compositeKey = `${qChapter}::${qId}`;

          if (globalExclusionSet.has(compositeKey)) {
            return false; 
          }
          return true; 
        }
        return false;
      });

      // ... (Rest of selection and aggregation logic remains the same)
      const shuffledCandidates = seededShuffle(validPool, makeSeed());
      const selectedBatch = shuffledCandidates.slice(0, replacementCount);

      selectedBatch.forEach((q) => {
        finalReplacements.push({
          id: String(q.id || q.qno || "N/A"),
          chapter: q.chapter || q.chapter_name || "N/A",
          question: q.question ?? q.text ?? "N/A",
          options: q.options || [],
          answer: q.answer ?? q.correctAnswer ?? "N/A",
          difficulty: q.difficulty,
          marks: q.marks || q.mark || 1,
          solution: q.solution || "",
        });
        globalExclusionSet.add(`${q.chapter || "N/A"}::${q.id || "N/A"}`);
      });
    } // 6. Final Response

    if (finalReplacements.length > 0) {
      return res.status(200).json({
        success: true,
        message: `Successfully found ${finalReplacements.length} replacement question(s).`,
        totalRequested: totalNeeded,
        replacementQuestions: finalReplacements,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: `No unique replacement questions were found. Check chapter spelling, filters, and question availability.`,
        totalRequested: totalNeeded,
        replacementQuestions: [],
      });
    }
  } catch (err) {
    // This handler will catch the explicit error thrown if zipRes.ok fails
    // or any internal processing error.
    return handleError(err, err.status || 500, res);
  }
};

export {
  getPaper,
  deletePapers,
  getAllPaperSummaries,
  generatePaper,
  storePaper,
  getReplaceableQuestions,
};