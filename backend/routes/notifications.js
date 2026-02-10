const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * In-app Notification Routes (MongoDB)
 */

/**
 * @route   GET /api/notifications
 * @desc    Get notifications for current user (or specific user if admin/rh/manager)
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const { user_id } = req.query;
        let targetUserId = req.user.user_id;

        if (user_id && ['admin', 'manager', 'rh'].includes(req.user.role)) {
            targetUserId = user_id;
        }

        const notifications = await Notification.find({ user: targetUserId })
            .sort({ createdAt: -1 })
            .limit(200);

        res.json({
            success: true,
            count: notifications.length,
            notifications: notifications.map(n => ({
                notification_id: n._id,
                ...n.toObject()
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put('/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        if (notification.user.toString() !== req.user.user_id && !['admin', 'manager', 'rh'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        notification.read = true;
        await notification.save();

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notification' });
    }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read for current user
 * @access  Private
 */
router.put('/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.user_id, read: false },
            { $set: { read: true } }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update notifications' });
    }
});

/**
 * @route   POST /api/notifications/send
 * @desc    Create a notification for a specific user
 * @access  Admin/Manager/RH
 */
router.post('/send', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const { user_id, title, body, type = 'info', data } = req.body;
        if (!user_id || !title || !body) {
            return res.status(400).json({ success: false, message: 'user_id, title, and body are required' });
        }

        const notification = await Notification.create({
            user: user_id,
            title,
            body,
            type,
            data: data || null
        });

        res.json({
            success: true,
            message: 'Notification created',
            notification_id: notification._id
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create notification' });
    }
});

module.exports = router;
