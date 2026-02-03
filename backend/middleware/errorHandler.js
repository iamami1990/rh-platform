/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(e => e.message).join(', ');
    }

    // Firebase errors
    if (err.code && err.code.startsWith('auth/')) {
        statusCode = 401;
        message = mapFirebaseError(err.code);
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

/**
 * Map Firebase error codes to user-friendly messages
 */
const mapFirebaseError = (code) => {
    const errorMap = {
        'auth/user-not-found': 'User not found',
        'auth/wrong-password': 'Incorrect password',
        'auth/email-already-exists': 'Email already in use',
        'auth/invalid-email': 'Invalid email format',
        'auth/weak-password': 'Password is too weak',
        'auth/too-many-requests': 'Too many requests. Try again later.'
    };

    return errorMap[code] || 'Authentication error';
};

module.exports = {
    errorHandler
};
