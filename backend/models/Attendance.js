const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    check_in_time: { type: Date, required: true },
    check_out_time: { type: Date },
    status: {
        type: String,
        enum: ['present', 'late', 'absent', 'on_leave', 'half_day'],
        required: true
    },
    delay_minutes: { type: Number, default: 0 },
    face_image_url: String,

    location: {
        lat: Number,
        lng: Number,
        accuracy: Number,
        address: String
    },

    device_info: {
        device_id: String,
        device_name: String,
        os: String,
        app_version: String,
        ip_address: String
    },

    fraud_flags: [String],
    liveness_score: Number,
    notes: String,
    justification_url: String,

    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approved_at: Date
}, {
    timestamps: true
});

// Index for quick lookup by employee and date
attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
