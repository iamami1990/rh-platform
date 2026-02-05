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
    // Register device for notifications (future implementation for Expo Push)
    // Currently, we rely on in-app notifications via MongoDB polling.
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

// Helper functions for internal use
const sendPayrollNotification = async (employee_id, payrollData) => {
    try {
        // Find user associated with employee
        const User = require('../models/User'); // Lazy load to avoid circular dependency issues if any
        const user = await User.findOne({ employee_id });

        if (!user) {
            console.warn(`[Notification] Skipped: No user found for employee ${employee_id}`);
            return;
        }

        const month = new Date(payrollData.period_start).toLocaleString('default', { month: 'long' });

        await Notification.create({
            user_id: user.user_id,
            title: 'Fiche de paie disponible',
            message: `Votre fiche de paie pour ${month} est maintenant disponible.`,
            type: 'info',
            data: {
                payroll_id: payrollData.payroll_id,
                type: 'payroll'
            }
        });

        console.log(`[Notification] Payroll alert sent to user ${user.user_id}`);
    } catch (error) {
        console.error('Error sending payroll notification:', error);
    }
};

const sendLeaveDecisionNotification = async (employee_id, leaveData, approved) => {
    try {
        const User = require('../models/User');
        const user = await User.findOne({ employee_id });

        if (!user) {
            console.warn(`[Notification] Skipped: No user found for employee ${employee_id}`);
            return;
        }

        const status = approved ? 'Approuvée' : 'Refusée';
        const typeFR = {
            'annual': 'Congé annuel',
            'sick': 'Congé maladie',
            'maternity': 'Congé maternité',
            'unpaid': 'Congé sans solde'
        }[leaveData.leave_type] || leaveData.leave_type;

        await Notification.create({
            user_id: user.user_id,
            title: `Demande de congé ${status}`,
            message: `Votre demande de ${typeFR} a été ${status.toLowerCase()}.`,
            type: approved ? 'success' : 'warning',
            data: {
                leave_id: leaveData.leave_id,
                type: 'leave_decision'
            }
        });

        console.log(`[Notification] Leave decision sent to user ${user.user_id}`);
    } catch (error) {
        console.error('Error sending leave notification:', error);
    }
};

module.exports = router;
module.exports.sendPayrollNotification = sendPayrollNotification;
module.exports.sendLeaveDecisionNotification = sendLeaveDecisionNotification;
