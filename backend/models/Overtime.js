const Joi = require('joi');

/**
 * Overtime Request Validation Schema
 * Compliant with Tunisian labor law on overtime rates
 * 
 * Tunisian Overtime Rates:
 * - 125%: Regular overtime (weekdays, within weekly limit)
 * - 150%: Night hours, Sundays
 * - 200%: Official holidays (jours fériés)
 */

const OvertimeSchema = Joi.object({
    // Employee Reference
    employee_id: Joi.string().required()
        .messages({
            'string.empty': 'L\'ID employé est requis'
        }),

    // Date & Time
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
        .messages({
            'string.pattern.base': 'Format de date invalide (YYYY-MM-DD)',
            'string.empty': 'La date est requise'
        }),

    month: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(), // Auto-calculated from date

    // Hours
    hours: Joi.number().positive().max(12).required()
        .messages({
            'number.positive': 'Le nombre d\'heures doit être positif',
            'number.max': 'Maximum 12 heures supplémentaires par jour',
            'any.required': 'Le nombre d\'heures est requis'
        }),

    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),

    // Rate Type (Tunisian Law)
    rate_type: Joi.string().valid('125%', '150%', '200%').required()
        .messages({
            'any.only': 'Taux invalide. Valeurs autorisées: 125%, 150%, 200%',
            'string.empty': 'Le taux est requis'
        }),

    // Context (for audit trail)
    overtime_category: Joi.string().valid(
        'regular',      // Heures normales supplémentaires (125%)
        'night',        // Heures de nuit (150%)
        'sunday',       // Dimanche (150%)
        'holiday'       // Jour férié (200%)
    ).optional(),

    // Reason
    reason: Joi.string().max(500).required()
        .messages({
            'string.empty': 'La raison est requise',
            'string.max': 'La raison ne doit pas dépasser 500 caractères'
        }),

    description: Joi.string().max(1000).allow('').optional(),

    // Project/Task Reference (optional)
    project_id: Joi.string().optional(),
    task_name: Joi.string().max(200).optional(),

    // Approval Workflow
    status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled').default('pending'),

    requested_by: Joi.string().optional(), // Usually employee_id

    approved_by: Joi.string().allow(null).optional(),
    approved_at: Joi.date().allow(null).optional(),

    rejection_reason: Joi.string().max(500).allow(null).optional(),

    // Calculated Amount
    amount: Joi.number().min(0).optional(), // Calculated: (base_hourly_rate * hours * rate_multiplier)

    base_hourly_rate: Joi.number().positive().optional(),

    // Timestamps
    created_at: Joi.date().default(() => new Date()),
    updated_at: Joi.date().default(() => new Date()),

    // Attestation (proof of work)
    attestation_url: Joi.string().uri().allow(null).optional(),

    // Manager Comments
    manager_comments: Joi.string().max(500).allow('').optional()
});

/**
 * Create Overtime Request Schema (for POST)
 */
const CreateOvertimeSchema = Joi.object({
    employee_id: Joi.string().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    hours: Joi.number().positive().max(12).required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    rate_type: Joi.string().valid('125%', '150%', '200%').required(),
    overtime_category: Joi.string().valid('regular', 'night', 'sunday', 'holiday').optional(),
    reason: Joi.string().max(500).required(),
    description: Joi.string().max(1000).allow('').optional(),
    project_id: Joi.string().optional(),
    task_name: Joi.string().max(200).optional()
});

/**
 * Approve/Reject Overtime Schema
 */
const ApproveOvertimeSchema = Joi.object({
    manager_comments: Joi.string().max(500).allow('').optional()
});

const RejectOvertimeSchema = Joi.object({
    rejection_reason: Joi.string().max(500).required()
        .messages({
            'string.empty': 'La raison du rejet est requise'
        }),
    manager_comments: Joi.string().max(500).allow('').optional()
});

/**
 * Validate overtime data
 */
const validateOvertime = (data) => {
    return OvertimeSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate create overtime request
 */
const validateCreateOvertime = (data) => {
    return CreateOvertimeSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate approve overtime
 */
const validateApproveOvertime = (data) => {
    return ApproveOvertimeSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate reject overtime
 */
const validateRejectOvertime = (data) => {
    return RejectOvertimeSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

module.exports = {
    OvertimeSchema,
    CreateOvertimeSchema,
    ApproveOvertimeSchema,
    RejectOvertimeSchema,
    validateOvertime,
    validateCreateOvertime,
    validateApproveOvertime,
    validateRejectOvertime
};
