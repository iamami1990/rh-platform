const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    // Legacy compatibility
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    date: { type: String, required: true }, // YYYY-MM-DD
    check_in_time: { type: Date },
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
    approved_at: Date,
    kiosk_log_id: { type: mongoose.Schema.Types.ObjectId, ref: 'KioskLog' }
}, {
    timestamps: true
});

attendanceSchema.pre('validate', async function () {
    if (this.employee && !this.employee_id) {
        this.employee_id = this.employee;
    }
    if (this.employee_id && !this.employee) {
        this.employee = this.employee_id;
    }
    if ((this.status === 'present' || this.status === 'late') && !this.check_in_time) {
        throw new Error('check_in_time is required for present/late status');
    }
});

// Index for quick lookup by employee and date
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
