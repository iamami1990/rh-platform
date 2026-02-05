const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
    overtime_id: { type: String, required: true, unique: true },
    employee_id: { type: String, required: true, ref: 'Employee' },
    date: { type: String, required: true },
    month: { type: String, required: true },
    hours: { type: Number, required: true },
    start_time: { type: String },
    end_time: { type: String },
    rate_type: { type: String, enum: ['125%', '150%', '200%'], default: '125%' },
    overtime_category: { type: String, default: 'regular' },
    reason: { type: String },
    description: { type: String },

    // Status
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
    requested_by: { type: String },

    // Approval
    approved_by: { type: String },
    approved_at: { type: Date },
    rejection_reason: { type: String },
    manager_comments: { type: String },

    // Financials
    amount: { type: Number },
    base_hourly_rate: { type: Number },

    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Overtime', overtimeSchema);
