const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadToStorage } = require('../utils/fileUpload');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

/**
 * @route   POST /api/leaves
 * @desc    Create leave request with optional justification upload
 * @access  Private (Employee)
 */
router.post('/', authenticate, upload.single('justification'), auditLogger('Submit Leave Request'), async (req, res) => {
    try {
        const { employee_id, leave_type, start_date, end_date, reason } = req.body;

        // Handle file upload if present
        let document_url = req.body.document_url || null;
        if (req.file) {
            document_url = await uploadToStorage(req.file, `leaves/${employee_id}`);
        }

        // Calculate days requested
        const start = moment(start_date);
        const end = moment(end_date);
        const days_requested = end.diff(start, 'days') + 1;

        const leaveId = uuidv4();

        const leave = await Leave.create({
            leave_id: leaveId,
            employee_id,
            leave_type, // 'annual', 'sick', 'maternity', 'unpaid'
            start_date,
            end_date,
            days_requested,
            status: 'pending',
            reason: reason || '',
            document_url: document_url || null, // Assuming Schema handles this gracefully (if strict, add to schema)
            approved_by: null,
            created_at: new Date(),
            approved_at: null
        });

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            leave
        });
    } catch (error) {
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
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { status, employee_id } = req.query;

        const query = {};

        if (status) query.status = status;
        if (employee_id) query.employee_id = employee_id;

        const leaves = await Leave.find(query).sort({ created_at: -1 });

        res.json({
            success: true,
            count: leaves.length,
            leaves
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
router.get('/calendar', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const leaves = await Leave.find({ status: 'approved' });

        // Fetch employee names for each leave
        const employeeIds = [...new Set(leaves.map(l => l.employee_id))];
        const employees = await Employee.find({ employee_id: { $in: employeeIds } });

        const employeeMap = {};
        employees.forEach(emp => {
            employeeMap[emp.employee_id] = `${emp.firstName} ${emp.lastName}`;
        });

        const events = leaves.map(l => ({
            id: l.leave_id,
            title: `${employeeMap[l.employee_id] || 'Unknown'} - ${l.leave_type}`,
            start: l.start_date,
            end: l.end_date,
            color: l.leave_type === 'annual' ? '#4caf50' :
                l.leave_type === 'sick' ? '#f44336' :
                    l.leave_type === 'maternity' ? '#e91e63' : '#9c27b0',
            extendedProps: {
                employee_id: l.employee_id,
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
router.put('/:id/approve', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const leave = await Leave.findOneAndUpdate(
            { leave_id: req.params.id },
            {
                status: 'approved',
                approved_by: req.user.user_id,
                approved_at: new Date()
            },
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        // Send notification logic here (mocked for now or use Notification model)
        // const { sendLeaveDecisionNotification } = require('./notifications');
        // await sendLeaveDecisionNotification(leave.employee_id, leave, true);

        res.json({
            success: true,
            message: 'Leave request approved'
        });
    } catch (error) {
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
router.put('/:id/reject', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const leave = await Leave.findOneAndUpdate(
            { leave_id: req.params.id },
            {
                status: 'rejected',
                approved_by: req.user.user_id,
                approved_at: new Date()
            },
            { new: true }
        );

        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave not found' });
        }

        res.json({
            success: true,
            message: 'Leave request rejected'
        });
    } catch (error) {
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

        const leaves = await Leave.find({
            employee_id: req.params.employee_id,
            status: 'approved'
        });

        // Calculate used days by leave type
        const usedDays = leaves
            .filter(l => moment(l.start_date).year() === currentYear)
            .reduce((acc, l) => {
                acc[l.leave_type] = (acc[l.leave_type] || 0) + l.days_requested;
                return acc;
            }, {});

        // Standard allocations
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
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave balance',
            error: error.message
        });
    }
});

module.exports = router;
