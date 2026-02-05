const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    payroll_id: { type: String, required: true, unique: true },
    employee_id: { type: String, required: true, ref: 'Employee' },
    employee_name: { type: String, required: true },
    month: { type: String, required: true }, // YYYY-MM

    // Salary Details
    gross_salary: { type: Number, required: true },
    net_salary: { type: Number, required: true },
    total_gross: { type: Number, required: true },
    total_deductions: { type: Number, required: true },

    // Components
    overtime_hours: { type: Number, default: 0 },
    overtime_pay: { type: Number, default: 0 },
    overtime_details: [{
        date: String,
        hours: Number,
        rate_type: String,
        amount: Number,
        reason: String
    }],
    bonuses: {
        seniority: { type: Number, default: 0 },
        attendance: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    allowances: {
        transport: { type: Number, default: 0 },
        prime_presence: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },
    deductions: {
        cnss: { type: Number, required: true },
        irpp: { type: Number, required: true },
        css: { type: Number, required: true },
        absenteeism: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    // Meta
    status: { type: String, enum: ['generated', 'paid'], default: 'generated' },
    generated_at: { type: Date, default: Date.now },
    paid_at: { type: Date },
    pdf_url: { type: String }
});

module.exports = mongoose.model('Payroll', payrollSchema);
