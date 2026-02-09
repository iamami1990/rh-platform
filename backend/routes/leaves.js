const express = require('express');
const router = express.Router();
const moment = require('moment');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadSingle } = require('../middleware/upload');

/**
 * @route   POST /api/leaves
 * @desc    Create leave request with optional justification upload
 * @access  Private (Employee)
 */
router.post('/', authenticate, uploadSingle('justification'), auditLogger('Submit Leave Request'), async (req, res) => {
    try {
        const { employee_id, leave_type, start_date, end_date, reason } = req.body;
        const targetEmployeeId = req.user.role === 'employee' ? req.user.employee_id : (employee_id || req.user.employee_id);

        if (!targetEmployeeId) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required. Please ensure your profile is complete.'
            });
        }

        if (req.user.role === 'employee' && employee_id && employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Handle file upload if present
        let document_url = req.body.document_url || null;
        if (req.file && req.fileUrl) {
            document_url = req.fileUrl;
        }

        // Calculate days requested
        const start = moment(start_date);
        const end = moment(end_date);
        const days_requested = end.diff(start, 'days') + 1;

        const newLeave = new Leave({
            employee: targetEmployeeId,
            employee_id: targetEmployeeId,
            leave_type, // 'annual', 'sick', 'maternity', 'unpaid'
            start_date,
            end_date,
            days_requested,
            status: 'pending',
            reason: reason || '',
            document_url: document_url || null,
            approved_by: null,
            created_at: new Date(),
            approved_at: null
        });

        await newLeave.save();

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            leave: {
                leave_id: newLeave._id,
                ...newLeave.toObject()
            }
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] CREATE LEAVE ERROR:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to create leave request',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/leaves
 * @desc    Get all leave requests
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const { status, employee_id } = req.query;

        const query = {};

        if (status) query.status = status;
        if (employee_id) query.employee = employee_id;

        const leaves = await Leave.find(query).sort({ created_at: -1 });

        res.json({
            success: true,
            count: leaves.length,
            leaves: leaves.map(l => ({
                leave_id: l._id,
                ...l.toObject()
            }))
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] FETCH LEAVES ERROR:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leaves',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/leaves/calendar
 * @desc    Get all approved leaves for calendar view
 * @access  Private (Admin, Manager)
 */
router.get('/calendar', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'approved' }).populate('employee', 'firstName lastName');

        const events = leaves.map(l => ({
            id: l._id,
            title: `${l.employee ? (l.employee.firstName + ' ' + l.employee.lastName) : 'Unknown'} - ${l.leave_type}`,
            start: l.start_date,
            end: l.end_date,
            color: l.leave_type === 'annual' ? '#4caf50' :
                l.leave_type === 'sick' ? '#f44336' :
                    l.leave_type === 'maternity' ? '#e91e63' : '#9c27b0',
            extendedProps: {
                employee_id: l.employee?._id,
                leave_type: l.leave_type,
                reason: l.reason
            }
        }));

        res.json({
            success: true,
            events
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch calendar data', error: error.message });
    }
});

/**
 * @route   PUT /api/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Admin, Manager)
 */
router.put('/:id/approve', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                approved_by: req.user.user_id,
                approved_at: new Date()
            },
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        const user = await User.findOne({ $or: [{ employee: leave.employee }, { employee_id: leave.employee }] }).select('_id');
        if (user) {
            await Notification.create({
                user: user._id,
                title: 'Demande de conge approuvee',
                body: `Votre demande de conge du ${leave.start_date} au ${leave.end_date} a ete approuvee.`,
                type: 'success',
                data: { leave_id: leave._id }
            });
        }

        res.json({
            success: true,
            message: 'Leave request approved'
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] APPROVE LEAVE ERROR:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve leave',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Admin, Manager)
 */
router.put('/:id/reject', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const leave = await Leave.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                approved_by: req.user.user_id,
                approved_at: new Date()
            },
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        const user = await User.findOne({ $or: [{ employee: leave.employee }, { employee_id: leave.employee }] }).select('_id');
        if (user) {
            await Notification.create({
                user: user._id,
                title: 'Demande de conge refusee',
                body: `Votre demande de conge du ${leave.start_date} au ${leave.end_date} a ete refusee.`,
                type: 'warning',
                data: { leave_id: leave._id }
            });
        }

        res.json({
            success: true,
            message: 'Leave request rejected'
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] REJECT LEAVE ERROR:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject leave',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/leaves/balance/:employee_id
 * @desc    Get leave balance for employee
 * @access  Private
 */
router.get('/balance/:employee_id', authenticate, async (req, res) => {
    try {
        const currentYear = moment().year();

        if (req.user.role === 'employee' && req.params.employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Get approved leaves for current year
        const leaves = await Leave.find({
            employee: req.params.employee_id,
            status: 'approved'
        });

        // Calculate used days by leave type
        const usedDays = leaves
            .filter(l => moment(l.start_date).year() === currentYear)
            .reduce((acc, l) => {
                acc[l.leave_type] = (acc[l.leave_type] || 0) + l.days_requested;
                return acc;
            }, {});

        // Standard allocations (can be customized per employee)
        const allocations = {
            annual: 25,
            sick: 15,
            maternity: 90,
            unpaid: 999
        };

        const balance = Object.keys(allocations).reduce((acc, type) => {
            acc[type] = {
                allocated: allocations[type],
                used: usedDays[type] || 0,
                remaining: allocations[type] - (usedDays[type] || 0)
            };
            return acc;
        }, {});

        res.json({
            success: true,
            employee_id: req.params.employee_id,
            year: currentYear,
            balance
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] FETCH LEAVE BALANCE ERROR:`, error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave balance',
            error: error.message
        });
    }
});

module.exports = router;
