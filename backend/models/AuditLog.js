const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user_id: String,
    email: String,
    role: String,
    action: { type: String, required: true },
    method: String,
    path: String,
    status: Number,
    ip: String,
    user_agent: String,
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
}, {
    expireAfterSeconds: 60 * 60 * 24 * 90 // Auto-delete logs after 90 days
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
