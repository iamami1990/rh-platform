const express = require('express');
const router = express.Router();
// const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   POST /api/attendance/check-in
 * @desc    Record employee check-in
 * @access  Private (Employee)
 */
router.post('/check-in', authenticate, async (req, res) => {
    try {
        const { face_image_url, location, device_info } = req.body;
        const employee_id = req.body.employee_id || req.user.employee_id;

        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message: 'Employee ID is required. Please ensure your profile is complete.'
            });
        }

        console.log(`[${new Date().toISOString()}] Check-in attempt for employee: ${employee_id}`);

        const today = moment().format('YYYY-MM-DD');
        const now = new Date();

        // Check if already checked in today
        const existingAttendance = await Attendance.findOne({
            employee_id,
            date: today
        });

        if (existingAttendance) {
            return res.status(400).json({
                success: false,
                message: 'Already checked in today'
            });
        }

        // Get employee data
        const employee = await Employee.findById(employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // 1. Anti-fraud: Geo-fencing (Simplified)
        if (employee.workplace_location && employee.workplace_location.lat && location) {
            const R = 6371; // Radius of the earth in km
            const dLat = (location.lat - employee.workplace_location.lat) * Math.PI / 180;
            const dLon = (location.lng - employee.workplace_location.lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(employee.workplace_location.lat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = R * c; // Distance in km

            if (distance > 0.5) { // 500 meters threshold
                return res.status(403).json({
                    success: false,
                    message: 'Location mismatch. You must be at the workplace to check-in.',
                    distance: `${(distance * 1000).toFixed(0)}m`
                });
            }
        }

        // 2. Anti-fraud: Liveness check
        const isLive = req.body.liveness_score ? req.body.liveness_score > 0.8 : true;
        if (!isLive) {
            return res.status(403).json({ success: false, message: 'Liveness detection failed. Please use a real person.' });
        }

        // 3. Shift Configurability
        const configStartTime = employee.work_start_time || '08:00';
        const [startHour, startMin] = configStartTime.split(':').map(Number);

        const startTime = moment().set({ hour: startHour, minute: startMin, second: 0 });
        const checkInTime = moment(now);
        const delayMinutes = checkInTime.isAfter(startTime)
            ? checkInTime.diff(startTime, 'minutes')
            : 0;

        const status = delayMinutes > 0 ? 'late' : 'present';

        // Create attendance record
        const newAttendance = new Attendance({
            employee_id,
            date: today,
            check_in_time: now,
            check_out_time: null,
            face_image_url: face_image_url || null,
            location: location || null,
            device_info: device_info || null,
            status,
            delay_minutes: delayMinutes,
            notes: ''
        });

        await newAttendance.save();

        res.status(201).json({
            success: true,
            message: `Check-in successful${delayMinutes > 0 ? ` (${delayMinutes} min late)` : ''}`,
            attendance: {
                attendance_id: newAttendance._id,
                ...newAttendance.toObject()
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Check-in failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/attendance/check-out
 * @desc    Record employee check-out
 * @access  Private (Employee)
 */
router.post('/check-out', authenticate, async (req, res) => {
    try {
        const { employee_id } = req.body;
        const today = moment().format('YYYY-MM-DD');

        // Find today's attendance record
        const attendance = await Attendance.findOne({
            employee_id,
            date: today
        });

        if (!attendance) {
            return res.status(400).json({
                success: false,
                message: 'No check-in found for today'
            });
        }

        if (attendance.check_out_time) {
            return res.status(400).json({
                success: false,
                message: 'Already checked out today'
            });
        }

        // Update check-out time
        attendance.check_out_time = new Date();
        await attendance.save();

        res.json({
            success: true,
            message: 'Check-out successful'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Check-out failed',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/attendance
 * @desc    Get all attendance records
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { startDate, endDate, employee_id, status } = req.query;

        const query = {};

        // Apply filters
        if (employee_id) query.employee_id = employee_id;
        if (status) query.status = status;

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = startDate;
            if (endDate) query.date.$lte = endDate;
        }

        const records = await Attendance.find(query).sort({ created_at: -1 });

        res.json({
            success: true,
            count: records.length,
            attendance: records.map(r => ({
                attendance_id: r._id,
                ...r.toObject()
            }))
        });
    } catch (error) {
        console.error('FETCH ATTENDANCE ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/attendance/employee/:id
 * @desc    Get attendance history for specific employee
 * @access  Private
 */
router.get('/employee/:id', authenticate, async (req, res) => {
    try {
        const records = await Attendance.find({ employee_id: req.params.id })
            .sort({ created_at: -1 })
            .limit(30);

        res.json({
            success: true,
            count: records.length,
            attendance: records.map(r => ({
                attendance_id: r._id,
                ...r.toObject()
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance history',
            error: error.message
        });
    }
});

module.exports = router;
