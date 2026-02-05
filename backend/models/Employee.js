const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    employee_id: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: String,
    address: String,
    department: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'terminated'],
        default: 'active'
    },
    hireDate: {
        type: Date,
        required: true
    },
    contract_type: {
        type: String,
        enum: ['CDI', 'CDD', 'Stage', 'Freelance'],
        default: 'CDI'
    },
    salary_brut: {
        type: Number,
        required: true
    },
    manager_id: {
        type: String,
        ref: 'Employee',
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update updated_at timestamp on save
employeeSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('Employee', employeeSchema);
