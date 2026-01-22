import Joi from 'joi';

// Create notification validation
export const createNotificationSchema = Joi.object({
    content: Joi.string().min(1).required().messages({
        'string.empty': 'Notification content is required',
        'any.required': 'Notification content is required'
    }),
    event_date: Joi.date().required().messages({
        'date.base': 'Event date must be a valid date',
        'any.required': 'Event date is required'
    })
});
