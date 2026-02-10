const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const attendanceService = require('../services/attendanceService');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Record employee check-in
 * @access  Private
 */
router.post('/check-in', authenticate, async (req, res) => {
    try {
        const { employee_id, face_image_url, location, device_info, liveness_score } = req.body;
        const targetEmployeeId = req.user.role === 'employee' ? req.user.employee_id : (employee_id || req.user.employee_id);

        const result = await attendanceService.checkIn({ targetEmployeeId, face_image_url, location, device_info, liveness_score });

        res.status(201).json({
            success: true,
            message: `Check-in successful${result.delayMinutes > 0 ? ` (${result.delayMinutes} min late)` : ''}`,
            attendance: result.attendance
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message, distance: error.distance });
    }
});

/**
 * @route   POST /api/attendance/check-out
 * @desc    Record employee check-out
 * @access  Private
 */
router.post('/check-out', authenticate, async (req, res) => {
    try {
        const { employee_id } = req.body;
        const targetEmployeeId = req.user.role === 'employee' ? req.user.employee_id : (employee_id || req.user.employee_id);

        await attendanceService.checkOut(targetEmployeeId);
        res.json({ success: true, message: 'Check-out successful' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/attendance
 * @desc    Get all attendance records
 * @access  Private (Admin, Manager, RH)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const records = await attendanceService.getAttendanceRecords(req.query);
        res.json({ success: true, count: records.length, attendance: records });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch attendance' });
    }
});

/**
 * @route   GET /api/attendance/employee/:id
 * @desc    Get attendance history for specific employee
 * @access  Private
 */
router.get('/employee/:id', authenticate, async (req, res) => {
    try {
        // Permission check stays in route – it needs req.user context
        if (req.user.role === 'employee' && req.params.id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const records = await attendanceService.getEmployeeAttendance(req.params.id);
        res.json({ success: true, count: records.length, attendance: records });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch attendance history' });
    }
});

module.exports = router;
