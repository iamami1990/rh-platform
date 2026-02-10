const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadSingle } = require('../middleware/upload');
const leaveService = require('../services/leaveService');

/**
 * @route   POST /api/leaves
 * @desc    Create leave request
 * @access  Private
 */
router.post('/', authenticate, uploadSingle('justification'), auditLogger('Submit Leave Request'), async (req, res) => {
    try {
        const { employee_id, leave_type, start_date, end_date, reason } = req.body;
        const targetEmployeeId = req.user.role === 'employee' ? req.user.employee_id : (employee_id || req.user.employee_id);

        // Permission check
        if (req.user.role === 'employee' && employee_id && employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Handle file upload
        let document_url = req.body.document_url || null;
        if (req.file && req.fileUrl) document_url = req.fileUrl;

        const leave = await leaveService.createLeaveRequest({ targetEmployeeId, leave_type, start_date, end_date, reason, document_url });
        res.status(201).json({ success: true, message: 'Leave request submitted successfully', leave });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/leaves
 * @desc    Get all leave requests
 * @access  Private (Admin, Manager, RH)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const leaves = await leaveService.getLeaves(req.query);
        res.json({ success: true, count: leaves.length, leaves });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch leaves' });
    }
});

/**
 * @route   GET /api/leaves/calendar
 * @desc    Get approved leaves for calendar
 * @access  Private (Admin, Manager, RH)
 */
router.get('/calendar', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const events = await leaveService.getCalendarLeaves();
        res.json({ success: true, events });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch calendar data' });
    }
});

/**
 * @route   PUT /api/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Admin, Manager, RH)
 */
router.put('/:id/approve', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        await leaveService.approveLeave(req.params.id, req.user.user_id);
        res.json({ success: true, message: 'Leave request approved' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Admin, Manager, RH)
 */
router.put('/:id/reject', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        await leaveService.rejectLeave(req.params.id, req.user.user_id);
        res.json({ success: true, message: 'Leave request rejected' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/leaves/balance/:employee_id
 * @desc    Get leave balance
 * @access  Private
 */
router.get('/balance/:employee_id', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'employee' && req.params.employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const balance = await leaveService.getLeaveBalance(req.params.employee_id);
        res.json({ success: true, ...balance });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch leave balance' });
    }
});

module.exports = router;
