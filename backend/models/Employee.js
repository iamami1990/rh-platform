const Joi = require('joi');

/**
 * Employee Data Validation Schema
 * Compliant with Tunisian labor laws and HR requirements
 */

const EmployeeSchema = Joi.object({
    // Personal Information
    firstName: Joi.string().min(2).max(50).required()
        .messages({
            'string.empty': 'Le prénom est requis',
            'string.min': 'Le prénom doit contenir au moins 2 caractères'
        }),

    lastName: Joi.string().min(2).max(50).required()
        .messages({
            'string.empty': 'Le nom est requis',
            'string.min': 'Le nom doit contenir au moins 2 caractères'
        }),

    email: Joi.string().email().required()
        .messages({
            'string.email': 'Email invalide',
            'string.empty': 'L\'email est requis'
        }),

    phone: Joi.string().pattern(/^[0-9]{8}$/).optional()
        .messages({
            'string.pattern.base': 'Le numéro de téléphone doit contenir 8 chiffres'
        }),

    cin: Joi.string().pattern(/^[0-9]{8}$/).optional()
        .messages({
            'string.pattern.base': 'Le CIN doit contenir 8 chiffres'
        }),

    birthDate: Joi.date().max('now').optional(),

    address: Joi.string().max(200).optional(),

    marital_status: Joi.string().valid('single', 'married', 'divorced', 'widowed', 'célibataire', 'marié', 'divorcé', 'veuf').optional(),

    children_count: Joi.number().integer().min(0).max(20).default(0),

    // Professional Information
    matricule: Joi.string().max(50).optional(),

    department: Joi.string().required()
        .messages({
            'string.empty': 'Le département est requis'
        }),

    position: Joi.string().required()
        .messages({
            'string.empty': 'Le poste est requis'
        }),

    contract_type: Joi.string().valid('CDI', 'CDD', 'SIVP', 'KARAMA', 'Freelance', 'Internship').required()
        .messages({
            'any.only': 'Type de contrat invalide',
            'string.empty': 'Le type de contrat est requis'
        }),

    hireDate: Joi.date().max('now').required()
        .messages({
            'date.base': 'Date d\'embauche invalide',
            'any.required': 'La date d\'embauche est requise'
        }),

    endDate: Joi.date().min(Joi.ref('hireDate')).optional(),

    status: Joi.string().valid('active', 'inactive', 'suspended', 'on_leave').default('active'),

    // Salary Information
    salary_brut: Joi.number().positive().required()
        .messages({
            'number.positive': 'Le salaire brut doit être positif',
            'any.required': 'Le salaire brut est requis'
        }),

    gross_salary: Joi.number().positive().optional(), // Alias for salary_brut

    // Allowances
    transport_allowance: Joi.number().min(0).default(60), // Minimum légal Tunisie

    meal_allowance: Joi.number().min(0).default(0),

    // Work Configuration
    work_start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('08:00')
        .messages({
            'string.pattern.base': 'Format d\'heure invalide (HH:MM)'
        }),

    work_end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('17:00'),

    workplace_location: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required(),
        address: Joi.string().optional()
    }).optional(),

    // Social Security
    cnss_number: Joi.string().max(50).optional(),

    bank_account: Joi.object({
        iban: Joi.string().pattern(/^TN[0-9]{22}$/).optional(),
        rib: Joi.string().pattern(/^[0-9]{20}$/).optional(),
        bank_name: Joi.string().optional()
    }).optional(),

    // Documents
    documents: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            type: Joi.string().valid('CIN', 'CV', 'Contract', 'Diploma', 'Medical', 'Other').required(),
            url: Joi.string().uri().required(),
            uploaded_at: Joi.date().required(),
            uploaded_by: Joi.string().required(),
            expires_at: Joi.date().optional()
        })
    ).optional(),

    // Manager & Reporting
    manager_id: Joi.string().optional(),

    // Metadata
    created_at: Joi.date().default(() => new Date()),
    updated_at: Joi.date().default(() => new Date()),

    // Profile Image
    profile_image_url: Joi.string().uri().optional(),

    // Emergency Contact
    emergency_contact: Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().pattern(/^[0-9]{8}$/).required(),
        relationship: Joi.string().optional()
    }).optional(),

    // Notes
    notes: Joi.string().max(1000).optional()
});

/**
 * Validate employee data
 * @param {Object} data - Employee data to validate
 * @returns {Object} Validation result
 */
const validateEmployee = (data) => {
    return EmployeeSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

/**
 * Validate partial update (PATCH)
 * @param {Object} data - Partial employee data
 * @returns {Object} Validation result
 */
const validateEmployeeUpdate = (data) => {
    const UpdateSchema = EmployeeSchema.fork(
        ['firstName', 'lastName', 'email', 'department', 'position', 'contract_type', 'hireDate', 'salary_brut'],
        (schema) => schema.optional()
    );

    return UpdateSchema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

module.exports = {
    EmployeeSchema,
    validateEmployee,
    validateEmployeeUpdate
};
