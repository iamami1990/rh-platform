const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const moment = require('moment');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const FaceEmbedding = require('../models/FaceEmbedding');
const KioskLog = require('../models/KioskLog');
const { getEmbeddingFromBase64, findBestMatch } = require('../utils/faceRecognition');

const logKiosk = async ({ employee, action, success, reason, device_info, meta }) => {
    try {
        return await KioskLog.create({
            employee,
            action,
            success,
            reason: reason || null,
            device_info: device_info || null,
            meta: meta || null
        });
    } catch (e) {
        console.warn('Kiosk log failed:', e.message);
        return null;
    }
};

const resolveEmployeeByPin = async ({ employee_id, email, pin }) => {
    if (!pin) return null;
    let user = null;

    if (employee_id) {
        user = await User.findOne({ $or: [{ employee: employee_id }, { employee_id }] });
    } else if (email) {
        user = await User.findOne({ email });
    }

    if (!user || !user.kiosk_pin_hash) return null;
    const isValid = await bcrypt.compare(pin, user.kiosk_pin_hash);
    if (!isValid) return null;
    return user.employee || user.employee_id;
};

const resolveEmployeeByFace = async (image_base64) => {
    if (!image_base64) return null;
    const embedding = await getEmbeddingFromBase64(image_base64);
    if (!embedding) return null;

    const storedEmbeddings = await FaceEmbedding.find({});
    const match = findBestMatch(embedding, storedEmbeddings, 0.5);
    if (!match) return null;
    return match.match.employee || match.match.employee_id;
};

const computeAttendanceStatus = (employee, now) => {
    const configStartTime = employee.work_start_time || '08:00';
    const [startHour, startMin] = configStartTime.split(':').map(Number);
    const startTime = moment(now).set({ hour: startHour, minute: startMin, second: 0 });
    const checkInTime = moment(now);
    const delayMinutes = checkInTime.isAfter(startTime) ? checkInTime.diff(startTime, 'minutes') : 0;
    return { status: delayMinutes > 0 ? 'late' : 'present', delayMinutes };
};

/**
 * @route   POST /api/kiosk/verify
 * @desc    Verify identity by face, with PIN fallback
 */
router.post('/verify', async (req, res) => {
    const { image_base64, pin, employee_id, email, device_info } = req.body;
    try {
        if (!image_base64 && !pin) {
            return res.status(400).json({ success: false, message: 'image_base64 or pin is required' });
        }
        let employeeId = await resolveEmployeeByFace(image_base64);
        let method = employeeId ? 'face' : null;

        if (!employeeId) {
            employeeId = await resolveEmployeeByPin({ employee_id, email, pin });
            method = employeeId ? 'pin' : null;
        }

        if (!employeeId) {
            await logKiosk({ action: 'verify', success: false, reason: 'Identity not verified', device_info });
            return res.status(401).json({ success: false, message: 'Identity not verified' });
        }

        await logKiosk({ employee: employeeId, action: 'verify', success: true, device_info, meta: { method } });
        return res.json({ success: true, employee_id: employeeId.toString(), method });
    } catch (error) {
        await logKiosk({ action: 'verify', success: false, reason: error.message, device_info });
        return res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

/**
 * @route   POST /api/kiosk/check-in
 * @desc    Kiosk check-in
 */
router.post('/check-in', async (req, res) => {
    const { image_base64, pin, employee_id, email, location, device_info, face_image_url } = req.body;
    try {
        if (!image_base64 && !pin) {
            return res.status(400).json({ success: false, message: 'image_base64 or pin is required' });
        }
        const verifiedEmployeeId = (await resolveEmployeeByFace(image_base64)) ||
            (await resolveEmployeeByPin({ employee_id, email, pin }));

        if (!verifiedEmployeeId) {
            await logKiosk({ action: 'check_in', success: false, reason: 'Identity not verified', device_info });
            return res.status(401).json({ success: false, message: 'Identity not verified' });
        }

        const employee = await Employee.findById(verifiedEmployeeId);
        if (!employee) {
            await logKiosk({ action: 'check_in', success: false, reason: 'Employee not found', device_info });
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const today = moment().format('YYYY-MM-DD');
        const existing = await Attendance.findOne({ employee: verifiedEmployeeId, date: today });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Already checked in today' });
        }

        const now = new Date();
        const { status, delayMinutes } = computeAttendanceStatus(employee, now);

        const kioskLog = await logKiosk({
            employee: verifiedEmployeeId,
            action: 'check_in',
            success: true,
            device_info
        });

        const normalizedLocation = typeof location === 'string'
            ? { address: location }
            : (location || null);

        const attendance = await Attendance.create({
            employee: verifiedEmployeeId,
            employee_id: verifiedEmployeeId,
            date: today,
            check_in_time: now,
            status,
            delay_minutes: delayMinutes,
            location: normalizedLocation,
            device_info: device_info || null,
            face_image_url: face_image_url || null,
            kiosk_log_id: kioskLog ? kioskLog._id : null
        });

        res.status(201).json({
            success: true,
            message: 'Check-in successful',
            attendance_id: attendance._id
        });
    } catch (error) {
        await logKiosk({ action: 'check_in', success: false, reason: error.message, device_info });
        res.status(500).json({ success: false, message: 'Check-in failed' });
    }
});

/**
 * @route   POST /api/kiosk/check-out
 * @desc    Kiosk check-out
 */
router.post('/check-out', async (req, res) => {
    const { image_base64, pin, employee_id, email, device_info } = req.body;
    try {
        if (!image_base64 && !pin) {
            return res.status(400).json({ success: false, message: 'image_base64 or pin is required' });
        }
        const verifiedEmployeeId = (await resolveEmployeeByFace(image_base64)) ||
            (await resolveEmployeeByPin({ employee_id, email, pin }));

        if (!verifiedEmployeeId) {
            await logKiosk({ action: 'check_out', success: false, reason: 'Identity not verified', device_info });
            return res.status(401).json({ success: false, message: 'Identity not verified' });
        }

        const today = moment().format('YYYY-MM-DD');
        const attendance = await Attendance.findOne({ employee: verifiedEmployeeId, date: today });
        if (!attendance) {
            return res.status(400).json({ success: false, message: 'No check-in found for today' });
        }

        if (attendance.check_out_time) {
            return res.status(400).json({ success: false, message: 'Already checked out today' });
        }

        attendance.check_out_time = new Date();
        await attendance.save();

        const kioskLog = await logKiosk({
            employee: verifiedEmployeeId,
            action: 'check_out',
            success: true,
            device_info
        });

        if (kioskLog) {
            attendance.kiosk_log_id = kioskLog._id;
            await attendance.save();
        }

        res.json({ success: true, message: 'Check-out successful' });
    } catch (error) {
        await logKiosk({ action: 'check_out', success: false, reason: error.message, device_info });
        res.status(500).json({ success: false, message: 'Check-out failed' });
    }
});

/**
 * @route   POST /api/kiosk/leave
 * @desc    Kiosk leave request
 */
router.post('/leave', async (req, res) => {
    const { image_base64, pin, employee_id, email, leave_type, start_date, end_date, reason, device_info } = req.body;
    try {
        if (!leave_type || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'leave_type, start_date, and end_date are required' });
        }
        if (!image_base64 && !pin) {
            return res.status(400).json({ success: false, message: 'image_base64 or pin is required' });
        }
        const verifiedEmployeeId = (await resolveEmployeeByFace(image_base64)) ||
            (await resolveEmployeeByPin({ employee_id, email, pin }));

        if (!verifiedEmployeeId) {
            await logKiosk({ action: 'leave_request', success: false, reason: 'Identity not verified', device_info });
            return res.status(401).json({ success: false, message: 'Identity not verified' });
        }

        const start = moment(start_date);
        const end = moment(end_date);
        const days_requested = end.diff(start, 'days') + 1;

        const leave = await Leave.create({
            employee: verifiedEmployeeId,
            employee_id: verifiedEmployeeId,
            leave_type,
            start_date,
            end_date,
            days_requested,
            status: 'pending',
            reason: reason || ''
        });

        await logKiosk({
            employee: verifiedEmployeeId,
            action: 'leave_request',
            success: true,
            device_info,
            meta: { leave_id: leave._id }
        });

        res.status(201).json({ success: true, message: 'Leave request submitted', leave_id: leave._id });
    } catch (error) {
        await logKiosk({ action: 'leave_request', success: false, reason: error.message, device_info });
        res.status(500).json({ success: false, message: 'Leave request failed' });
    }
});

/**
 * @route   POST /api/kiosk/payroll-slip
 * @desc    Kiosk payroll slip request
 */
router.post('/payroll-slip', async (req, res) => {
    const { image_base64, pin, employee_id, email, device_info } = req.body;
    try {
        if (!image_base64 && !pin) {
            return res.status(400).json({ success: false, message: 'image_base64 or pin is required' });
        }
        const verifiedEmployeeId = (await resolveEmployeeByFace(image_base64)) ||
            (await resolveEmployeeByPin({ employee_id, email, pin }));

        if (!verifiedEmployeeId) {
            await logKiosk({ action: 'payroll_slip', success: false, reason: 'Identity not verified', device_info });
            return res.status(401).json({ success: false, message: 'Identity not verified' });
        }

        const payroll = await Payroll.findOne({ employee: verifiedEmployeeId }).sort({ month: -1 });
        if (!payroll) {
            return res.status(404).json({ success: false, message: 'No payroll found' });
        }

        await logKiosk({
            employee: verifiedEmployeeId,
            action: 'payroll_slip',
            success: true,
            device_info,
            meta: { payroll_id: payroll._id }
        });

        res.json({
            success: true,
            payroll_id: payroll._id,
            month: payroll.month,
            net_salary: payroll.net_salary,
            pdf_url: `/api/payroll/${payroll._id}/pdf`
        });
    } catch (error) {
        await logKiosk({ action: 'payroll_slip', success: false, reason: error.message, device_info });
        res.status(500).json({ success: false, message: 'Payroll request failed' });
    }
});

module.exports = router;
