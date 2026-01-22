import Joi from 'joi';

// Admin login validation
export const adminLoginSchema = Joi.object({
    email: Joi.string().required().messages({
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    })
});

// Student login validation
export const studentLoginSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(6).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
    })
});

// Admin registration validation
export const adminRegisterSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required'
    }),
    full_name: Joi.string().required().messages({
        'string.empty': 'Full name is required',
        'any.required': 'Full name is required'
    }),
    watermark: Joi.string().optional().allow(''),
    subscription_start_date: Joi.date().optional(),
    subscription_end_date: Joi.date().optional()
});

// Student registration validation
export const studentRegisterSchema = Joi.object({
    email: Joi.string().email().required().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email',
        'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).required().messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required'
    }),
    full_name: Joi.string().required().messages({
        'string.empty': 'Full name is required',
        'any.required': 'Full name is required'
    }),
    std: Joi.string().required().messages({
        'string.empty': 'Standard is required',
        'any.required': 'Standard is required'
    }),
    class: Joi.string().required().messages({
        'string.empty': 'Class is required',
        'any.required': 'Class is required'
    })
});
