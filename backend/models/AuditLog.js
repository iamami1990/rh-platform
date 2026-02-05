const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    email: { type: String },
    role: { type: String },
    action: { type: String, required: true },
    method: { type: String },
    path: { type: String },
    status: { type: Number },
    ip: { type: String },
    user_agent: { type: String },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
