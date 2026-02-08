const mongoose = require('mongoose');

const kioskLogSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
    action: {
        type: String,
        enum: ['verify', 'check_in', 'check_out', 'leave_request', 'payroll_slip'],
        required: true
    },
    success: { type: Boolean, default: false },
    reason: { type: String, default: null },
    device_info: mongoose.Schema.Types.Mixed,
    meta: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

module.exports = mongoose.model('KioskLog', kioskLogSchema);
