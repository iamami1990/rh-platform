const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        enum: ['admin', 'manager', 'rh', 'employee'], // Added 'rh' based on user prompt
        default: 'employee'
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    kiosk_pin_hash: {
        type: String,
        default: null
    },
    // Legacy compatibility
    user_id: {
        type: String,
        unique: true,
        sparse: true
    },
    employee_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        default: null
    },
    reset_token: {
        type: String,
        default: null
    },
    reset_token_expires: {
        type: Date,
        default: null
    },
    last_login: {
        type: Date,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

userSchema.pre('save', function () {
    if (this.employee && !this.employee_id) {
        this.employee_id = this.employee;
    }
    if (this.employee_id && !this.employee) {
        this.employee = this.employee_id;
    }
});

module.exports = mongoose.model('User', userSchema);
