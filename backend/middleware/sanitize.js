/**
 * Input Sanitization Middleware
 * Prevents XSS and injection attacks
 */

const xss = require('xss');

/**
 * Sanitize string inputs to prevent XSS
 */
const sanitizeString = (value) => {
    if (typeof value === 'string') {
        return xss(value.trim());
    }
    return value;
};

/**
 * Recursively sanitize object
 */
const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
};

/**
 * Sanitize request body middleware
 */
const sanitizeBody = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    next();
};

/**
 * Sanitize query parameters middleware
 */
const sanitizeQuery = (req, res, next) => {
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    next();
};

/**
 * Sanitize all inputs (body, query, params)
 */
const sanitizeAll = (req, res, next) => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};

module.exports = {
    sanitizeBody,
    sanitizeQuery,
    sanitizeAll
};
