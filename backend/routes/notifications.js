const express = require('express');
const router = express.Router();
const DeviceToken = require('../models/DeviceToken');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Push Notification Routes
 * 
 * NOTE: Firebase Cloud Messaging (FCM) has been removed.
 * This service now persists notifications to MongoDB and mocks the "Push" delivery.
 * For real push notifications, integrate OneSignal, Expo, or a specialized service.
 */

/**
 * @route   POST /api/notifications/register-device
 * @desc    Register device for push notifications
 * @access  Private
 */
router.post('/register-device', authenticate, async (req, res) => {
    try {
        const { user_id, fcm_token, platform, device_info } = req.body;

        if (!fcm_token) {
            return res.status(400).json({
                success: false,
                message: 'FCM token is required'
            });
        }

        const deviceData = {
            user_id: user_id || req.user.user_id,
            fcm_token,
            platform,
            device_info,
            last_active: new Date()
        };

        // Upsert device token
        await DeviceToken.findOneAndUpdate(
            { fcm_token },
            deviceData,
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'Device registered for notifications'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Device registration failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/unregister-device
 * @desc    Unregister device
 * @access  Private
 */
router.post('/unregister-device', authenticate, async (req, res) => {
    try {
        const { fcm_token } = req.body;

        await DeviceToken.findOneAndDelete({ fcm_token });

        res.json({
            success: true,
            message: 'Device unregistered'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Device unregistration failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/send
 * @desc    Send push notification to specific user
 * @access  Admin/Manager
 */
router.post('/send', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { user_id, title, body, data } = req.body;

        // Get user's device tokens
        const devices = await DeviceToken.find({ user_id });

        if (devices.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No devices found for user'
            });
        }

        const tokens = devices.map(d => d.fcm_token);

        // MOCK SEND
        console.log(`[PUSH MOCK] Sending to ${tokens.length} devices for user ${user_id}`);
        console.log(`[PUSH MOCK] Title: ${title}, Body: ${body}`);

        res.json({
            success: true,
            message: `Notification sent to ${tokens.length} device(s) (MOCKED)`,
            results: {
                success: tokens.length,
                failure: 0
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/send-to-topic
 * @desc    Send notification to topic subscribers
 * @access  Admin
 */
router.post('/send-to-topic', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { topic, title, body, data } = req.body;

        // MOCK SEND
        console.log(`[PUSH MOCK] Sending to topic: ${topic}`);
        console.log(`[PUSH MOCK] Title: ${title}, Body: ${body}`);

        res.json({
            success: true,
            message: `Notification sent to topic: ${topic} (MOCKED)`
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to send notification',
            error: error.message
        });
    }
});

/**
 * Helper: Send notification when payroll is generated
 */
const sendPayrollNotification = async (employee_id, payrollData) => {
    try {
        // Here we could Create a Notification document too, so it appears in the in-app list
        // For now, verified devices exist and log
        const devices = await DeviceToken.find({ user_id: employee_id });
        if (devices.length === 0) return;

        console.log(`[PUSH MOCK] Payroll Notification for ${employee_id}`);
    } catch (error) {
        console.error('Error sending payroll notification:', error);
    }
};

/**
 * Helper: Send notification when leave is approved/rejected
 */
const sendLeaveDecisionNotification = async (employee_id, leaveData, approved) => {
    try {
        const devices = await DeviceToken.find({ user_id: employee_id });
        if (devices.length === 0) return;

        console.log(`[PUSH MOCK] Leave Notification (${approved ? 'Approved' : 'Rejected'}) for ${employee_id}`);
    } catch (error) {
        console.error('Error sending leave notification:', error);
    }
};

module.exports = router;
module.exports.sendPayrollNotification = sendPayrollNotification;
module.exports.sendLeaveDecisionNotification = sendLeaveDecisionNotification;
