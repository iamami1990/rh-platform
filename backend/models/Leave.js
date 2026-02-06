const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    leave_type: {
        type: String,
        required: true,
        enum: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compensatory', 'exceptional', 'hajj']
    },
    start_date: { type: String, required: true }, // YYYY-MM-DD
    end_date: { type: String, required: true }, // YYYY-MM-DD
    days_requested: { type: Number, required: true },
    reason: String,
    document_url: String,

    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },

    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_at: Date,
    rejection_reason: String,
    manager_comments: String,

    replacement_employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    half_day: { type: Boolean, default: false },
    emergency: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model('Leave', leaveSchema);
