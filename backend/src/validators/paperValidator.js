import Joi from 'joi';

// Paper generation validation
export const generatePaperSchema = Joi.object({
    exam: Joi.string().required().messages({
        'string.empty': 'Exam type is required',
        'any.required': 'Exam type is required'
    }),
    class: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).required().messages({
        'any.required': 'class is required'
    }),
    subject: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).required().messages({
        'any.required': 'Subject is required'
    }),
    chapters: Joi.alternatives().try(
        Joi.string().allow(''),
        Joi.array().items(Joi.string())
    ).optional(),
    count: Joi.number().integer().min(1).max(200).optional().messages({
        'number.min': 'Count must be at least 1',
        'number.max': 'Count cannot exceed 200'
    }),
    seed: Joi.string().optional(),
    fixed: Joi.boolean().optional()
});

// Store paper validation
export const storePaperSchema = Joi.object({
    paper_id: Joi.string().required().messages({
        'string.empty': 'Paper ID is required',
        'any.required': 'Paper ID is required'
    }),
    exam_name: Joi.string().required().messages({
        'string.empty': 'Exam type is required',
        'any.required': 'Exam type is required'
    }),
    class: Joi.string().required().messages({
        'string.empty': 'Class name is required',
        'any.required': 'Class name is required'
    }),
    subject: Joi.string().required().messages({
        'string.empty': 'Subject is required',
        'any.required': 'Subject is required'
    }),
    exam_date: Joi.date().optional(),
    duration: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    marks: Joi.number().integer().min(0).optional(),
    paper_questions: Joi.string().optional().allow(''),
    paper_answers: Joi.string().optional().allow(''),
    metadata: Joi.any().optional()
});

// Delete papers validation
export const deletePapersSchema = Joi.object({
    paper_ids: Joi.alternatives().try(
        Joi.string(),
        Joi.array().items(Joi.string())
    ).required().messages({
        'any.required': 'Paper IDs are required'
    })
});

// Get replacements validation
export const getReplacementsSchema = Joi.object({
    exam: Joi.string().required(),
    class: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
    subjects: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).required(),
    replacementRequests: Joi.array().items(
        Joi.object({
            chapter: Joi.string().required(),
            count: Joi.number().integer().min(1).required()
        })
    ).min(1).required().messages({
        'array.min': 'Replacement request list is required.',
        'any.required': 'Replacement request list is required.'
    }),
    overallUsedKeys: Joi.array().items(Joi.string()).optional()
});