const Joi = require('joi');

/**
 * Attendance Data Validation Schema
 * Includes biometric check-in/out with fraud detection
 */

const AttendanceSchema = Joi.object({
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

    check_in_time: Joi.date().required()
        .messages({
            'any.required': 'L\'heure d\'arrivée est requise'
        }),

    check_out_time: Joi.date().min(Joi.ref('check_in_time')).allow(null).optional(),

    // Status
    status: Joi.string().valid('present', 'late', 'absent', 'on_leave', 'half_day').required()
        .messages({
            'any.only': 'Statut invalide'
        }),

    delay_minutes: Joi.number().integer().min(0).default(0),

    // Biometric Data
    face_image_url: Joi.string().uri().allow(null).optional(),

    // Location (Anti-fraud)
    location: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
        accuracy: Joi.number().positive().optional(),
        address: Joi.string().optional()
    }).allow(null).optional(),

    // Device Info (Anti-fraud)
    device_info: Joi.object({
        device_id: Joi.string().optional(),
        device_name: Joi.string().optional(),
        os: Joi.string().optional(),
        app_version: Joi.string().optional(),
        ip_address: Joi.string().ip({ version: ['ipv4', 'ipv6'] }).optional()
    }).allow(null).optional(),

    // Anti-fraud Flags
    fraud_flags: Joi.array().items(
        Joi.string().valid(
            'location_mismatch',
            'multiple_checkin_same_day',
            'suspicious_device',
            'impossible_location',
            'liveness_failed'
        )
    ).optional(),

    liveness_score: Joi.number().min(0).max(1).optional(),

    // Notes & Justification
    notes: Joi.string().max(500).allow('').optional(),

    justification_url: Joi.string().uri().allow(null).optional(),

    // Metadata
    created_at: Joi.date().default(() => new Date()),

    updated_at: Joi.date().default(() => new Date()),

    // Approval (for manual attendance)
    approved_by: Joi.string().allow(null).optional(),

    approved_at: Joi.date().allow(null).optional()
});

/**
 * Check-in validation schema (stricter)
 */
const CheckInSchema = Joi.object({
    employee_id: Joi.string().required(),
    face_image_url: Joi.string().uri().optional(),
    location: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
        accuracy: Joi.number().positive().optional()
    }).optional(),
    device_info: Joi.object({
        device_id: Joi.string().optional(),
        device_name: Joi.string().optional(),
        os: Joi.string().optional()
    }).optional(),
    liveness_score: Joi.number().min(0).max(1).optional()
});

/**
 * Check-out validation schema
 */
const CheckOutSchema = Joi.object({
    employee_id: Joi.string().required(),
    notes: Joi.string().max(500).optional()
});

/**
 * Validate attendance data
 */
const validateAttendance = (data) => {
    return AttendanceSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate check-in data
 */
const validateCheckIn = (data) => {
    return CheckInSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate check-out data
 */
const validateCheckOut = (data) => {
    return CheckOutSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

module.exports = {
    AttendanceSchema,
    CheckInSchema,
    CheckOutSchema,
    validateAttendance,
    validateCheckIn,
    validateCheckOut
};
