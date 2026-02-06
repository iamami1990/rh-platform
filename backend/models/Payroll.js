const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    employee_name: { type: String, required: true },
    month: { type: String, required: true }, // YYYY-MM
    gross_salary: { type: Number, required: true },

    overtime_hours: { type: Number, default: 0 },
    overtime_pay: { type: Number, default: 0 },
    overtime_details: [{
        date: String,
        hours: Number,
        rate_type: String,
        amount: Number
    }],

    bonuses: {
        seniority: { type: Number, default: 0 },
        attendance: { type: Number, default: 0 },
        performance: { type: Number, default: 0 },
        thirteenth_month: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    allowances: {
        transport: { type: Number, default: 60 },
        meals: { type: Number, default: 0 },
        prime_presence: { type: Number, default: 0 },
        housing: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    total_gross: { type: Number, required: true },

    deductions: {
        cnss: { type: Number, required: true },
        irpp: { type: Number, default: 0 },
        css: { type: Number, default: 0 },
        absenteeism: { type: Number, default: 0 },
        late_penalties: { type: Number, default: 0 },
        loan_repayment: { type: Number, default: 0 },
        other: { type: Number, default: 0 }
    },

    total_deductions: { type: Number, required: true },
    net_salary: { type: Number, required: true },

    working_days: { type: Number, default: 22 },
    present_days: { type: Number, default: 0 },
    absent_days: { type: Number, default: 0 },
    late_days: { type: Number, default: 0 },

    tax_details: {
        annual_taxable_base: Number,
        annual_irpp: Number,
        monthly_irpp: Number,
        css: Number,
        family_deductions: Number,
        professional_expenses: Number
    },

    employer_contributions: {
        cnss: { type: Number, default: 0 },
        professional_training: { type: Number, default: 0 },
        foprolos: { type: Number, default: 0 }
    },

    pdf_url: String,
    status: {
        type: String,
        enum: ['draft', 'generated', 'sent', 'paid'],
        default: 'generated'
    },

    generated_at: { type: Date, default: Date.now },
    sent_at: Date,
    paid_at: Date,

    payment_method: { type: String, enum: ['bank_transfer', 'cash', 'check'] },
    payment_reference: String
}, {
    timestamps: true
});

// Index for uniqueness per employee per month
payrollSchema.index({ employee_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
