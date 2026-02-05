const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'manager', 'employee', 'rh'],
        default: 'employee'
    },
    employee_id: {
        type: String,
        ref: 'Employee',
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    last_login: {
        type: Date,
        default: null
    },
    reset_token: {
        type: String,
        default: null
    },
    reset_token_expires: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('User', userSchema);
