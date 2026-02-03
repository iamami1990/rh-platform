/**
 * Input Validation Middleware
 * Uses Joi schemas for consistent validation
 */

const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        // Replace req.body with validated value
        req.body = value;
        next();
    };
};

/**
 * Validate query parameters
 */
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Query validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        req.query = value;
        next();
    };
};

/**
 * Validate URL parameters
 */
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Parameter validation error',
                errors: error.details.map(detail => ({
                    field: detail.path.join('.'),
                    message: detail.message
                }))
            });
        }

        req.params = value;
        next();
    };
};

module.exports = {
    validate,
    validateQuery,
    validateParams
};
