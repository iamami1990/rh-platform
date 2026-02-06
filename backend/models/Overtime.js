const mongoose = require('mongoose');

const overtimeSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    month: String, // YYYY-MM
    hours: { type: Number, required: true },
    start_time: String,
    end_time: String,
    rate_type: {
        type: String,
        enum: ['125%', '150%', '200%'],
        required: true
    },
    overtime_category: {
        type: String,
        enum: ['regular', 'night', 'sunday', 'holiday']
    },
    reason: { type: String, required: true },
    description: String,
    project_id: String,
    task_name: String,

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },

    requested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_at: Date,
    rejection_reason: String,
    manager_comments: String,

    amount: Number,
    base_hourly_rate: Number,
    attestation_url: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Overtime', overtimeSchema);
