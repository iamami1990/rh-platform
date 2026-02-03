const Joi = require('joi');

/**
 * Payroll Data Validation Schema
 * Compliant with Tunisian tax laws (IRPP 2025, CNSS, CSS)
 */

const PayrollSchema = Joi.object({
    // Employee Reference
    employee_id: Joi.string().required()
        .messages({
            'string.empty': 'L\'ID employé est requis'
        }),

    employee_name: Joi.string().required(),

    // Period
    month: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
        .messages({
            'string.pattern.base': 'Format de mois invalide (YYYY-MM)',
            'string.empty': 'Le mois est requis'
        }),

    // Gross Salary Components
    gross_salary: Joi.number().positive().required()
        .messages({
            'number.positive': 'Le salaire brut doit être positif'
        }),

    // Overtime
    overtime_hours: Joi.number().min(0).default(0),
    overtime_pay: Joi.number().min(0).default(0),

    overtime_details: Joi.array().items(
        Joi.object({
            date: Joi.string().required(),
            hours: Joi.number().positive().required(),
            rate_type: Joi.string().valid('125%', '150%', '200%').required(),
            amount: Joi.number().positive().required()
        })
    ).optional(),

    // Bonuses
    bonuses: Joi.object({
        seniority: Joi.number().min(0).default(0),
        attendance: Joi.number().min(0).default(0),
        performance: Joi.number().min(0).default(0),
        thirteenth_month: Joi.number().min(0).default(0),
        other: Joi.number().min(0).default(0)
    }).default(),

    // Allowances
    allowances: Joi.object({
        transport: Joi.number().min(0).default(60),
        meals: Joi.number().min(0).default(0),
        prime_presence: Joi.number().min(0).default(0),
        housing: Joi.number().min(0).default(0),
        other: Joi.number().min(0).default(0)
    }).default(),

    // Total Gross
    total_gross: Joi.number().positive().required(),

    // Deductions (Tunisian System)
    deductions: Joi.object({
        cnss: Joi.number().min(0).required(), // 9.18% employee share
        irpp: Joi.number().min(0).default(0), // Income tax (IRPP 2025)
        css: Joi.number().min(0).default(0),  // Social solidarity contribution (0.5% of IRPP)
        absenteeism: Joi.number().min(0).default(0),
        late_penalties: Joi.number().min(0).default(0),
        loan_repayment: Joi.number().min(0).default(0),
        other: Joi.number().min(0).default(0)
    }).required(),

    total_deductions: Joi.number().min(0).required(),

    // Net Salary
    net_salary: Joi.number().required()
        .custom((value, helpers) => {
            const parent = helpers.state.ancestors[0];
            const expected = parent.total_gross - parent.total_deductions;
            if (Math.abs(value - expected) > 0.1) {
                return helpers.error('number.invalid');
            }
            return value;
        })
        .messages({
            'number.invalid': 'Le salaire net ne correspond pas au calcul (brut - déductions)'
        }),

    // Attendance Metrics
    working_days: Joi.number().integer().min(0).max(31).default(22),
    present_days: Joi.number().integer().min(0).max(31).default(0),
    absent_days: Joi.number().integer().min(0).max(31).default(0),
    late_days: Joi.number().integer().min(0).max(31).default(0),

    // Tax Details (for transparency)
    tax_details: Joi.object({
        annual_taxable_base: Joi.number().min(0).optional(),
        annual_irpp: Joi.number().min(0).optional(),
        monthly_irpp: Joi.number().min(0).optional(),
        css: Joi.number().min(0).optional(),
        family_deductions: Joi.number().min(0).optional(),
        professional_expenses: Joi.number().min(0).optional()
    }).optional(),

    // Employer Contributions (for reporting)
    employer_contributions: Joi.object({
        cnss: Joi.number().min(0).default(0), // 16.57% employer share
        professional_training: Joi.number().min(0).default(0), // TFP
        foprolos: Joi.number().min(0).default(0)
    }).optional(),

    // PDF & Status
    pdf_url: Joi.string().uri().allow(null).optional(),

    status: Joi.string().valid('draft', 'generated', 'sent', 'paid').default('generated'),

    // Timestamps
    generated_at: Joi.date().default(() => new Date()),
    sent_at: Joi.date().allow(null).optional(),
    paid_at: Joi.date().allow(null).optional(),

    // Payment Details
    payment_method: Joi.string().valid('bank_transfer', 'cash', 'check').optional(),
    payment_reference: Joi.string().optional()
});

/**
 * Validate payroll data
 */
const validatePayroll = (data) => {
    return PayrollSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Generate Payroll Request Schema (for POST /api/payroll/generate)
 */
const GeneratePayrollSchema = Joi.object({
    month: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
        .messages({
            'string.pattern.base': 'Format de mois invalide (YYYY-MM)',
            'string.empty': 'Le mois est requis'
        }),
    employee_ids: Joi.array().items(Joi.string()).optional()
        .messages({
            'array.base': 'employee_ids doit être un tableau'
        })
});

const validateGeneratePayroll = (data) => {
    return GeneratePayrollSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

module.exports = {
    PayrollSchema,
    GeneratePayrollSchema,
    validatePayroll,
    validateGeneratePayroll
};
