const { body, query, param, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation errors',
            errors: errors.array()
        });
    }
    next();
};

/**
 * Validation rules for employee creation/update
 */
const validateEmployee = [
    body('firstName')
        .trim()
        .notEmpty().withMessage('First name is required')
        .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),

    body('lastName')
        .trim()
        .notEmpty().withMessage('Last name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('phone')
        .optional()
        .trim()
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/)
        .withMessage('Invalid phone number format'),

    body('department')
        .trim()
        .notEmpty().withMessage('Department is required'),

    body('position')
        .trim()
        .notEmpty().withMessage('Position is required'),

    body('hireDate')
        .notEmpty().withMessage('Hire date is required')
        .isISO8601().withMessage('Invalid date format'),

    body('salary_brut')
        .notEmpty().withMessage('Salary is required')
        .isFloat({ min: 0 }).withMessage('Salary must be a positive number'),

    body('contract_type')
        .notEmpty().withMessage('Contract type is required')
        .isIn(['CDI', 'CDD']).withMessage('Contract type must be CDI or CDD'),

    handleValidationErrors
];

/**
 * Validation rules for attendance check-in
 */
const validateCheckIn = [
    body('employee_id')
        .notEmpty().withMessage('Employee ID is required')
        .isUUID().withMessage('Invalid employee ID format'),

    body('location')
        .optional()
        .isObject().withMessage('Location must be an object'),

    body('location.lat')
        .optional()
        .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),

    body('location.lng')
        .optional()
        .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),

    handleValidationErrors
];

/**
 * Validation rules for leave request
 */
const validateLeaveRequest = [
    body('employee_id')
        .notEmpty().withMessage('Employee ID is required')
        .isUUID().withMessage('Invalid employee ID format'),

    body('leave_type')
        .notEmpty().withMessage('Leave type is required')
        .isIn(['annual', 'sick', 'maternity', 'unpaid'])
        .withMessage('Invalid leave type'),

    body('start_date')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Invalid start date format'),

    body('end_date')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('Invalid end date format')
        .custom((endDate, { req }) => {
            if (new Date(endDate) < new Date(req.body.start_date)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),

    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Reason must be less than 500 characters'),

    handleValidationErrors
];

/**
 * Validation rules for login
 */
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    handleValidationErrors
];

/**
 * Validation rules for user registration
 */
const validateRegistration = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain uppercase, lowercase, and number'),

    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),

    body('employee_id')
        .optional()
        .isUUID().withMessage('Invalid employee ID format'),

    handleValidationErrors
];

/**
 * Validation rules for payroll generation
 */
const validatePayrollGeneration = [
    body('month')
        .notEmpty().withMessage('Month is required')
        .matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format'),

    handleValidationErrors
];

/**
 * Validation rules for pagination
 */
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),

    handleValidationErrors
];

module.exports = {
    validateEmployee,
    validateCheckIn,
    validateLeaveRequest,
    validateLogin,
    validateRegistration,
    validatePayrollGeneration,
    validatePagination,
    handleValidationErrors
};
