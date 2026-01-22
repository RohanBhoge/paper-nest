import { Router } from 'express';
import {
  getPaper,
  deletePapers,
  getAllPaperSummaries,
  generatePaper,
  storePaper,
  getReplaceableQuestions,
} from '../controllers/paperController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import {
  generatePaperSchema,
  storePaperSchema,
  deletePapersSchema,
  getReplacementsSchema
} from '../validators/paperValidator.js';

const paperRouter = Router();

/**
 * Paper Management Routes
 */

// Get specific paper by ID
paperRouter.get('/get-paper/:id', requireAuth, getPaper);

// Delete multiple papers
paperRouter.delete('/delete-paper', requireAuth, validate(deletePapersSchema), deletePapers);

// Get history of all papers for the user
paperRouter.get('/get-paper-history', requireAuth, getAllPaperSummaries);

// Generate a new paper based on criteria
paperRouter.post('/generate-paper', requireAuth, validate(generatePaperSchema), generatePaper);

// Store a generated paper
paperRouter.post('/store-paper', requireAuth, validate(storePaperSchema), storePaper);

// Get replacement questions for a paper
paperRouter.post('/replacements', requireAuth, validate(getReplacementsSchema), getReplaceableQuestions);

export { paperRouter };
