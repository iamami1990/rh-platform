const AuditLog = require('../models/AuditLog');

/**
 * Audit Logger Middleware
 * Logs user actions to the AuditLogs collection
 */
const auditLogger = (action) => {
    return async (req, res, next) => {
        console.log('DEBUG: auditLogger executing for', action, 'next type:', typeof next);
        const originalSend = res.send;

        res.send = function (data) {
            res.send = originalSend;

            // Only log successful or important failed actions
            if (res.statusCode >= 200 && res.statusCode < 400) {
                const logData = {
                    user_id: req.user?.user_id || 'anonymous',
                    email: req.user?.email || 'anonymous',
                    role: req.user?.role || 'none',
                    action: action || `${req.method} ${req.originalUrl}`,
                    method: req.method,
                    path: req.originalUrl,
                    status: res.statusCode,
                    ip: req.ip,
                    user_agent: req.get('user-agent'),
                    timestamp: new Date()
                };

                // Don't await to avoid slowing down response
                AuditLog.create(logData).catch(err => {
                    console.error('AUDIT LOG ERROR:', err);
                });
            }

            return res.send(data);
        };

        next();
    };
};

module.exports = { auditLogger };
