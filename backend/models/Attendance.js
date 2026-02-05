const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    attendance_id: {
        type: String,
        required: true,
        unique: true
    },
    employee_id: {
        type: String,
        required: true,
        ref: 'Employee'
    },
    date: {
        type: String, // YYYY-MM-DD format for easy querying
        required: true
    },
    check_in_time: {
        type: Date,
        required: true
    },
    check_out_time: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['present', 'late', 'absent', 'half_day'],
        default: 'present'
    },
    total_hours: {
        type: Number,
        default: 0
    },
    notes: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries on employee and date
attendanceSchema.index({ employee_id: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
