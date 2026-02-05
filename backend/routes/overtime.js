const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Overtime = require('../models/Overtime');
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

// Validation helpers (Simplified)
const validateCreateOvertime = (data) => {
    // Basic validation
    if (!data.employee_id || !data.date || !data.hours) {
        return { error: { details: [{ message: 'Missing required fields' }] } };
    }
    return { value: data };
};
const validateApproveOvertime = (data) => ({ value: data });
const validateRejectOvertime = (data) => ({ value: data });


/**
 * @route   POST /api/overtime
 * @desc    Create overtime request
 * @access  Private
 */
router.post('/', authenticate, auditLogger('Create Overtime Request'), async (req, res) => {
    try {
        const { error, value } = validateCreateOvertime(req.body);
        if (error) return res.status(400).json({ success: false, message: 'Validation error' });

        const { employee_id, date, hours, start_time, end_time, rate_type, overtime_category, reason, description } = value;

        if (req.user.role === 'employee' && employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const employee = await Employee.findOne({ employee_id });
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const overtimeMonth = moment(date, 'YYYY-MM-DD').format('YYYY-MM');
        const baseSalary = Number(employee.salary_brut || 0);
        const baseHourlyRate = baseSalary / (22 * 8); // 22 days * 8 hours

        let rateMultiplier = 1.25;
        if (rate_type === '150%') rateMultiplier = 1.5;
        if (rate_type === '200%') rateMultiplier = 2.0;

        const amount = baseHourlyRate * hours * rateMultiplier;

        const overtime = await Overtime.create({
            overtime_id: uuidv4(),
            employee_id,
            date,
            month: overtimeMonth,
            hours,
            start_time,
            end_time,
            rate_type,
            overtime_category: overtime_category || 'regular',
            reason,
            description: description || '',
            status: 'pending',
            requested_by: req.user.user_id,
            amount,
            base_hourly_rate: baseHourlyRate,
        });

        res.status(201).json({ success: true, message: 'Overtime created', overtime });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Creation failed', error: error.message });
    }
});

/**
 * @route   GET /api/overtime
 * @desc    Get all overtime requests
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { employee_id, month, status } = req.query;
        const query = {};
        if (employee_id) query.employee_id = employee_id;
        if (status) query.status = status;
        if (month) query.month = month;

        const overtimes = await Overtime.find(query).sort({ created_at: -1 });
        res.json({ success: true, count: overtimes.length, overtimes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed', error: error.message });
    }
});

/**
 * @route   GET /api/overtime/my
 * @desc    Get current employee overtime
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.user.user_id;
        const overtimes = await Overtime.find({ employee_id: employeeId }).sort({ date: -1 });
        res.json({ success: true, count: overtimes.length, overtimes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed', error: error.message });
    }
});

/**
 * @route   PUT /api/overtime/:id/approve
 * @desc    Approve overtime
 * @access  Private (Admin, Manager)
 */
router.put('/:id/approve', authenticate, authorize('admin', 'manager'), auditLogger('Approve Overtime'), async (req, res) => {
    try {
        const { manager_comments } = req.body;
        const overtime = await Overtime.findOne({ overtime_id: req.params.id });

        if (!overtime) return res.status(404).json({ success: false, message: 'Overtime not found' });
        if (overtime.status !== 'pending') return res.status(400).json({ success: false, message: 'Not pending' });

        overtime.status = 'approved';
        overtime.approved_by = req.user.user_id;
        overtime.approved_at = new Date();
        overtime.manager_comments = manager_comments || '';
        overtime.updated_at = new Date();
        await overtime.save();

        res.json({ success: true, message: 'Overtime approved' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Approval failed', error: error.message });
    }
});

/**
 * @route   PUT /api/overtime/:id/reject
 * @desc    Reject overtime
 * @access  Private (Admin, Manager)
 */
router.put('/:id/reject', authenticate, authorize('admin', 'manager'), auditLogger('Reject Overtime'), async (req, res) => {
    try {
        const { rejection_reason, manager_comments } = req.body;
        const overtime = await Overtime.findOne({ overtime_id: req.params.id });

        if (!overtime) return res.status(404).json({ success: false, message: 'Overtime not found' });
        if (overtime.status !== 'pending') return res.status(400).json({ success: false, message: 'Not pending' });

        overtime.status = 'rejected';
        overtime.approved_by = req.user.user_id;
        overtime.approved_at = new Date();
        overtime.rejection_reason = rejection_reason || '';
        overtime.manager_comments = manager_comments || '';
        overtime.updated_at = new Date();
        await overtime.save();

        res.json({ success: true, message: 'Overtime rejected' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Rejection failed', error: error.message });
    }
});

module.exports = router;
