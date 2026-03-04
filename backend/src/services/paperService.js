import {
    generatePaperId,
    formatPaperContent,
    selectQuestions,
} from '../utils/generatePaperHelper.js';

import {
    getPapersByUserId,
    getPapersByUserIdPaginated,
    storeNewPaperForUser,
    deletePapersForUser,
    getPaperByIdForUser,
} from '../utils/helperFunctions.js';

import {
    makeSeed,
    seededShuffle,
    loadQuestionsFromZip,
    matchesFiltersObj,
} from '../utils/zipLoader.js';

import { cacheGet, cacheSet, cacheDel, TTL } from '../utils/cacheHelper.js';
import { isRedisConnected } from '../config/redisConfig.js';

export async function getPaperById(userId, paperId) {
    const cacheKey = `paper:${userId}:${paperId}`;

    // Try cache first
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const paper = await getPaperByIdForUser(userId, paperId);

    if (!paper) {
        throw new Error(`Paper with ID '${paperId}' not found for this user`);
    }

    // Cache individual paper for 5 min
    await cacheSet(cacheKey, paper, TTL.USER_PAPERS);

    return paper;
}

export async function deletePapers(userId, paperIds) {
    if (!Array.isArray(paperIds) || paperIds.length === 0) {
        throw new Error("Provide an array of paper IDs");
    }

    const sanitizedIds = paperIds.map((p) => String(p)).slice(0, 200);

    const result = await deletePapersForUser(userId, sanitizedIds);

    // Invalidate cache for deleted papers + user paper list
    const keysToDelete = sanitizedIds.map(id => `paper:${userId}:${id}`);
    keysToDelete.push(`papers:list:${userId}`);
    await cacheDel(...keysToDelete);

    return {
        deletedCount: result.deletedCount,
        deletedIds: result.deletedIds,
    };
}

export async function getAllPaperSummaries(userId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const cacheKey = `papers:list:${userId}`;

    let allPapers = null;
    let total = 0;
    let summaries = [];

    if (isRedisConnected()) {
        // Redis available: cache the full list, paginate in memory
        allPapers = await cacheGet(cacheKey);
        if (!allPapers) {
            allPapers = await getPapersByUserId(userId);
            await cacheSet(cacheKey, allPapers, TTL.USER_PAPERS);
        }
        total = allPapers.length;
        summaries = allPapers.slice(offset, offset + limit);
    } else {
        // No Redis: use SQL-level LIMIT/OFFSET — never loads all rows into memory
        const result = await getPapersByUserIdPaginated(userId, page, limit);
        allPapers = result.papers;
        total = result.total;
        summaries = allPapers;
    }

    summaries = summaries.map((p) => ({
        paper_id: p.paper_id,
        exam_name: p.exam_name,
        class: p.class,
        subject: p.subject,
        exam_date: p.exam_date,
        totalMarks: p.marks || 0,
        status: 'checked',
        created_at: p.created_at,
    }));

    return {
        papers: summaries,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNextPage: offset + limit < total,
            hasPrevPage: page > 1,
        },
    };
}

export async function generatePaper(params) {
    const paperParams = { ...params, count: params.count || 10 };

    const result = await selectQuestions(paperParams);
    const selected = result.selected;

    if (selected.length === 0) {
        throw new Error('No questions found matching criteria');
    }

    let totalMarks = 0;
    for (const q of selected) {
        totalMarks += Number(q.marks ?? q.mark ?? 1) || 0;
    }

    const { paper_questions, paper_answers, question_list } = formatPaperContent(selected);

    const paperData = {
        paper_id: generatePaperId(paperParams.exam, paperParams.standard),
        exam_name: String(paperParams.exam || '').trim(),
        class: String(paperParams.standard || '').trim() + ' Grade',
        subject: String(paperParams.subject || paperParams.chapters?.[0] || '').trim(),
        exam_date: paperParams.exam_date,
        marks: totalMarks,
        paper_questions,
        paper_answers,
        metadata: {
            seed: result.seed,
            question_count: selected.length,
            zip_path: result.zipPath || 'N/A',
            original_questions_array: question_list,
        },
    };

    return paperData;
}

/**
 * Store generated paper for user
 */
export async function storePaper(userId, paperData) {
    if (!paperData.paper_id || !paperData.paper_questions) {
        throw new Error('Missing required paper data fields (paper_id, paper_questions)');
    }

    try {
        const dbInsertId = await storeNewPaperForUser(userId, paperData);

        // Invalidate user's paper list cache so next fetch gets fresh data
        await cacheDel(`papers:list:${userId}`);

        return {
            dbId: dbInsertId,
            paperId: paperData.paper_id,
        };
    } catch (dbError) {
        if (dbError.code === 'ER_DUP_ENTRY') {
            const error = new Error(`Paper ID '${paperData.paper_id}' already exists`);
            error.code = 'DUPLICATE';
            throw error;
        }

        throw new Error('Database insertion failed');
    }
}

/**
 * Get replacement questions based on criteria
 */
export async function getReplaceableQuestions(
    exam,
    standards,
    subjects,
    overallUsedKeys = [],
    replacementRequests = []
) {
    if (replacementRequests.length === 0) {
        throw new Error('Replacement request list is required');
    }

    const standardArr = Array.isArray(standards)
        ? standards
        : String(standards || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    const subjectArr = Array.isArray(subjects)
        ? subjects
        : String(subjects || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

    const globalExclusionSet = new Set(overallUsedKeys.map(String));

    const zipRes = await loadQuestionsFromZip();

    if (!zipRes.ok) {
        const error = new Error(zipRes.error || 'ZIP file could not be loaded');
        error.status = 500;
        throw error;
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
                const qId = String(q.id || q.qno || 'N/A');
                const qChapter = String(q.chapter || q.chapter_name || 'N/A');
                const compositeKey = `${qChapter}::${qId}`;

                if (globalExclusionSet.has(compositeKey)) {
                    return false;
                }
                return true;
            }
            return false;
        });

        // Select random questions from valid pool
        const shuffledCandidates = seededShuffle(validPool, makeSeed());
        const selectedBatch = shuffledCandidates.slice(0, replacementCount);

        // Add to final replacements and update exclusion set
        selectedBatch.forEach((q) => {
            finalReplacements.push({
                id: String(q.id || q.qno || 'N/A'),
                chapter: q.chapter || q.chapter_name || 'N/A',
                question: q.question ?? q.text ?? 'N/A',
                options: q.options || [],
                answer: q.answer ?? q.correctAnswer ?? 'N/A',
                difficulty: q.difficulty,
                marks: q.marks || q.mark || 1,
                solution: q.solution || '',
            });
            globalExclusionSet.add(`${q.chapter || 'N/A'}::${q.id || 'N/A'}`);
        });
    }

    return {
        replacementQuestions: finalReplacements,
        totalRequested: totalNeeded,
        totalFound: finalReplacements.length,
    };
}
