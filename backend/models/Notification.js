const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: { type: String, required: true }, // Employee ID or User ID
    title: { type: String, required: true },
    body: { type: String, required: true },
    type: { type: String, default: 'info' }, // 'info', 'warning', 'success', 'error'
    data: mongoose.Schema.Types.Mixed,
    read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
