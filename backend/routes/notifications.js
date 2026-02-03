const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Push Notification Routes
 * Backend endpoints for FCM push notifications
 */

const db = admin.firestore();

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

        // Store device token in Firestore
        const deviceData = {
            user_id: user_id || req.user.user_id,
            fcm_token,
            platform,
            device_info,
            registered_at: admin.firestore.FieldValue.serverTimestamp(),
            last_active: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('device_tokens').doc(fcm_token).set(deviceData);

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

        await db.collection('device_tokens').doc(fcm_token).delete();

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
        const tokensSnapshot = await db.collection('device_tokens')
            .where('user_id', '==', user_id)
            .get();

        if (tokensSnapshot.empty) {
            return res.status(404).json({
                success: false,
                message: 'No devices found for user'
            });
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().fcm_token);

        // Send notification via FCM
        const message = {
            notification: {
                title,
                body
            },
            data: data || {},
            tokens
        };

        const response = await admin.messaging().sendMulticast(message);

        res.json({
            success: true,
            message: `Notification sent to ${response.successCount} device(s)`,
            results: {
                success: response.successCount,
                failure: response.failureCount
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

        const message = {
            notification: {
                title,
                body
            },
            data: data || {},
            topic
        };

        await admin.messaging().send(message);

        res.json({
            success: true,
            message: `Notification sent to topic: ${topic}`
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
        const tokensSnapshot = await db.collection('device_tokens')
            .where('user_id', '==', employee_id)
            .get();

        if (tokensSnapshot.empty) {
            return;
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().fcm_token);

        const message = {
            notification: {
                title: '💰 Bulletin de Paie Disponible',
                body: `Votre paie pour ${payrollData.month} est prête`
            },
            data: {
                type: 'payroll_generated',
                payroll_id: payrollData.payroll_id,
                month: payrollData.month,
                net_salary: payrollData.net_salary.toString()
            },
            tokens
        };

        await admin.messaging().sendMulticast(message);
    } catch (error) {
        console.error('Error sending payroll notification:', error);
    }
};

/**
 * Helper: Send notification when leave is approved/rejected
 */
const sendLeaveDecisionNotification = async (employee_id, leaveData, approved) => {
    try {
        const tokensSnapshot = await db.collection('device_tokens')
            .where('user_id', '==', employee_id)
            .get();

        if (tokensSnapshot.empty) {
            return;
        }

        const tokens = tokensSnapshot.docs.map(doc => doc.data().fcm_token);

        const message = {
            notification: {
                title: approved ? '✅ Congé Approuvé' : '❌ Congé Rejeté',
                body: `Votre demande de congé a été ${approved ? 'approuvée' : 'rejetée'}`
            },
            data: {
                type: approved ? 'leave_approved' : 'leave_rejected',
                leave_id: leaveData.leave_id,
                start_date: leaveData.start_date,
                end_date: leaveData.end_date
            },
            tokens
        };

        await admin.messaging().sendMulticast(message);
    } catch (error) {
        console.error('Error sending leave notification:', error);
    }
};

module.exports = router;
module.exports.sendPayrollNotification = sendPayrollNotification;
module.exports.sendLeaveDecisionNotification = sendLeaveDecisionNotification;
