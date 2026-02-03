const Joi = require('joi');

/**
 * Leave Request Validation Schema
 * Includes Tunisian leave types and workflow
 */

const LeaveSchema = Joi.object({
    // Employee Reference
    employee_id: Joi.string().required()
        .messages({
            'string.empty': 'L\'ID employé est requis'
        }),

    // Leave Type (Tunisian System)
    leave_type: Joi.string().valid(
        'annual',           // Congé annuel (minimum 12 jours ouvrables/an)
        'sick',             // Congé maladie (justificatif requis)
        'maternity',        // Congé maternité (30 jours selon code du travail)
        'paternity',        // Congé paternité (1 jour)
        'unpaid',           // Congé sans solde
        'compensatory',     // Congé compensatoire
        'exceptional',      // Congé exceptionnel (mariage, décès, etc.)
        'hajj'              // Congé Hajj (une fois dans la carrière)
    ).required()
        .messages({
            'any.only': 'Type de congé invalide',
            'string.empty': 'Le type de congé est requis'
        }),

    // Period
    start_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
        .messages({
            'string.pattern.base': 'Format de date invalide (YYYY-MM-DD)',
            'string.empty': 'La date de début est requise'
        }),

    end_date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
        .custom((value, helpers) => {
            const startDate = helpers.state.ancestors[0].start_date;
            if (startDate && value < startDate) {
                return helpers.error('date.endBeforeStart');
            }
            return value;
        })
        .messages({
            'string.pattern.base': 'Format de date invalide (YYYY-MM-DD)',
            'string.empty': 'La date de fin est requise',
            'date.endBeforeStart': 'La date de fin doit être après la date de début'
        }),

    days_requested: Joi.number().integer().positive().required()
        .messages({
            'number.positive': 'Le nombre de jours doit être positif',
            'any.required': 'Le nombre de jours est requis'
        }),

    // Reason & Justification
    reason: Joi.string().max(500).allow('').optional(),

    document_url: Joi.string().uri().allow(null).optional(), // Medical certificate, etc.

    // Workflow Status
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').default('pending')
        .messages({
            'any.only': 'Statut invalide'
        }),

    // Approval Chain
    approved_by: Joi.string().allow(null).optional(),
    approved_at: Joi.date().allow(null).optional(),
    rejection_reason: Joi.string().max(500).allow(null).optional(),

    // Manager Review
    manager_comments: Joi.string().max(500).allow('').optional(),

    // Timestamps
    created_at: Joi.date().default(() => new Date()),
    updated_at: Joi.date().default(() => new Date()),

    // Replacement Employee (optional)
    replacement_employee_id: Joi.string().allow(null).optional(),

    // Special Flags
    half_day: Joi.boolean().default(false),

    emergency: Joi.boolean().default(false)
});

/**
 * Leave Balance Schema
 */
const LeaveBalanceSchema = Joi.object({
    employee_id: Joi.string().required(),
    year: Joi.number().integer().min(2020).max(2100).required(),

    balances: Joi.object({
        annual: Joi.object({
            allocated: Joi.number().min(0).default(25),
            used: Joi.number().min(0).default(0),
            remaining: Joi.number().min(0).default(25),
            carried_over: Joi.number().min(0).default(0)
        }),
        sick: Joi.object({
            allocated: Joi.number().min(0).default(15),
            used: Joi.number().min(0).default(0),
            remaining: Joi.number().min(0).default(15)
        }),
        maternity: Joi.object({
            allocated: Joi.number().min(0).default(90),
            used: Joi.number().min(0).default(0),
            remaining: Joi.number().min(0).default(90)
        }),
        paternity: Joi.object({
            allocated: Joi.number().min(0).default(1),
            used: Joi.number().min(0).default(0),
            remaining: Joi.number().min(0).default(1)
        })
    }).required(),

    updated_at: Joi.date().default(() => new Date())
});

/**
 * Validate leave request
 */
const validateLeave = (data) => {
    return LeaveSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate leave balance
 */
const validateLeaveBalance = (data) => {
    return LeaveBalanceSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Create Leave Request Schema (for POST)
 */
const CreateLeaveSchema = LeaveSchema.fork(
    ['status', 'approved_by', 'approved_at', 'created_at', 'updated_at'],
    (schema) => schema.optional()
);

const validateCreateLeave = (data) => {
    return CreateLeaveSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

module.exports = {
    LeaveSchema,
    LeaveBalanceSchema,
    CreateLeaveSchema,
    validateLeave,
    validateLeaveBalance,
    validateCreateLeave
};
