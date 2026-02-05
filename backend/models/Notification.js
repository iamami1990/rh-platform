const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['info', 'warning', 'success', 'error', 'system'],
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false
    },
    data: {
        type: Object,
        default: {} // For linking to other resources (e.g., leave_id)
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
