/**
 * Validation middleware factory
 * Creates middleware to validate request body/query against Joi schema
 */
export const validate = (schema, property = 'body') => {
    return (req, res, next) => {
        const dataToValidate = property === 'query' ? req.query : req.body;

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false, // Return all errors, not just the first one
            stripUnknown: true // Remove unknown fields
        });

        if (error) {
            const errorMessages = error.details.map(detail => detail.message);
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: errorMessages
            });
        }

        if (property === 'query') {
            req.query = value;
        } else {
            req.body = value;
        }
        next();
    };
};