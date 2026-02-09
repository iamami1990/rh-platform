/**
 * Global error handler middleware
 */
const fs = require('fs');
const path = require('path');

const errorHandler = (err, req, res, next) => {
    const errorLog = `[${new Date().toISOString()}] ${err.name}: ${err.message}\nStack: ${err.stack}\nURL: ${req.originalUrl}\nMethod: ${req.method}\n\n`;
    try {
        const logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        const logPath = path.join(logsDir, 'error.log');
        fs.appendFileSync(logPath, errorLog);
    } catch (e) {
        console.error('Failed to write to error.log:', e.message);
    }

    console.error('❌ Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }



    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    errorHandler
};
