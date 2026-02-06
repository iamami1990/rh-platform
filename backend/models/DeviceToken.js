const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema({
    user_id: { type: String, required: true }, // Can be Employee ID or User ID from auth
    fcm_token: { type: String, required: true, unique: true },
    platform: String,
    device_info: mongoose.Schema.Types.Mixed,
    last_active: { type: Date, default: Date.now }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
