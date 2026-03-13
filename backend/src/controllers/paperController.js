import * as paperService from '../services/paperService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../middleware/errorHandler.js';


export const getPaper = asyncHandler(async (req, res) => {
  const paperId = req.params.id;
  const userId = req.user?.id;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  try {
    const paper = await paperService.getPaperById(userId, paperId);
    res.json(ApiResponse.success(paper, 'Paper fetched successfully'));
  } catch (error) {
    if (error.message.includes('not found')) {
      throw ApiError.notFound(error.message);
    }
    throw error;
  }
});

export const deletePapers = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const incoming = req.body?.paper_ids || req.body?.paperIds || req.body?.papers;

  try {
    const result = await paperService.deletePapers(userId, incoming);

    res.json(
      ApiResponse.success(
        {
          deletedCount: result.deletedCount,
          deletedIds: result.deletedIds,
        },
        `Successfully deleted ${result.deletedCount} paper(s)`
      )
    );
  } catch (error) {
    if (error.message.includes('array')) {
      throw ApiError.badRequest(error.message);
    }
    throw error;
  }
});

export const getAllPaperSummaries = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const sortBy = req.query.sort || 'created_at DESC';
  const examFilter = req.query.exam || '';

  const result = await paperService.getAllPaperSummaries(userId, page, limit, sortBy, examFilter);

  res.json(
    ApiResponse.paginated(
      result.papers,
      page,
      limit,
      result.pagination.total,
      'Papers fetched successfully'
    )
  );
});
export const generatePaper = asyncHandler(async (req, res) => {
  try {
    const paperData = await paperService.generatePaper(req.body);

    res.json(
      ApiResponse.success(
        paperData,
        'Paper generated successfully, ready for client review/storage'
      )
    );
  } catch (error) {
    if (error.message.includes('No questions found')) {
      throw ApiError.notFound(error.message);
    }
    throw error;
  }
});

export const storePaper = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const paperData = req.body;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  try {
    const result = await paperService.storePaper(userId, paperData);

    res.status(201).json(
      ApiResponse.success(
        {
          db_id: result.dbId,
          paper_id: result.paperId,
        },
        'Paper stored successfully'
      )
    );
  } catch (error) {
    if (error.code === 'DUPLICATE') {
      throw ApiError.conflict(error.message);
    }
    if (error.message.includes('Missing required')) {
      throw ApiError.badRequest(error.message);
    }
    if (error.message.includes('Database insertion failed')) {
      throw ApiError.internal(error.message);
    }
    throw error;
  }
});

export const getReplaceableQuestions = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw ApiError.unauthorized('User not authenticated');
  }

  const {
    exam,
    standards,
    subjects,
    overallUsedKeys = [],
    replacementRequests = [],
  } = req.body;

  try {
    const result = await paperService.getReplaceableQuestions(
      exam,
      standards,
      subjects,
      overallUsedKeys,
      replacementRequests,
      req.body // Pass full body as options for alias support
    );

    if (result.totalFound > 0) {
      res.json(
        ApiResponse.success(
          result.replacementQuestions,
          `Successfully found ${result.totalFound} replacement question(s)`
        )
      );
    } else {
      throw ApiError.notFound(
        'No unique replacement questions were found. Check chapter spelling, filters, and question availability'
      );
    }
  } catch (error) {
    if (error.message.includes('required')) {
      throw ApiError.badRequest(error.message);
    }
    if (error.message.includes('ZIP file')) {
      throw ApiError.internal(error.message);
    }
    throw error;
  }
});