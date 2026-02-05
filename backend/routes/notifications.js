const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/notifications/register-device
 * @desc    Register device for push notifications

 * @access  Private
 */
router.post('/register-device', authenticate, async (req, res) => {
    // Acknowledge the request.

    // In a real non-firebase app, we might store Expo Push Token or similar.
    res.json({
        success: true,
        message: 'Device registration acknowledged (Push disabled)'
    });
});

/**
 * @route   POST /api/notifications/unregister-device
 * @desc    Unregister device
 * @access  Private
 */
router.post('/unregister-device', authenticate, async (req, res) => {
    res.json({
        success: true,
        message: 'Device unregistered'
    });
});

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications from DB
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({ user_id: req.user.user_id })
            .sort({ created_at: -1 })
            .limit(50);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/notifications/send
 * @desc    Create an internal notification
 * @access  Admin/Manager
 */
router.post('/send', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { user_id, title, message: body, data } = req.body;

        await Notification.create({
            user_id,
            title,
            message: body,
            data,
            read: false
        });

        res.json({
            success: true,
            message: 'Notification created successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
});

// Helper mockup functions for internal use
const sendPayrollNotification = async (employee_id, payrollData) => {
    try {
        // Find user associated with employee
        // This requires a reverse lookup or assuming employee_id is user_id? 
        // In our auth model, user has employee_id. We need to find User by employee_id.
        // Assuming we can't easily do that without importing User model.
        // For PFE purpose, we'll just log it.
        console.log(`[Mock Push] Payroll ready for ${employee_id}`);
    } catch (error) {
        console.error('Error sending payroll notification:', error);
    }
};

const sendLeaveDecisionNotification = async (employee_id, leaveData, approved) => {
    try {
        console.log(`[Mock Push] Leave ${approved ? 'Approved' : 'Rejected'} for ${employee_id}`);
    } catch (error) {
        console.error('Error sending leave notification:', error);
    }
};

module.exports = router;
module.exports.sendPayrollNotification = sendPayrollNotification;
module.exports.sendLeaveDecisionNotification = sendLeaveDecisionNotification;
