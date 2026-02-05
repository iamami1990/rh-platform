const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
    leave_id: {
        type: String,
        required: true,
        unique: true
    },
    employee_id: {
        type: String,
        required: true,
        ref: 'Employee'
    },
    leave_type: {
        type: String,
        enum: ['paid', 'sick', 'unpaid', 'remote', 'other'],
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    days_requested: {
        type: Number,
        required: true,
        min: 0.5
    },
    reason: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        default: 'pending'
    },
    approved_by: {
        type: String,
        ref: 'User',
        default: null
    },
    rejection_reason: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Leave', leaveSchema);
