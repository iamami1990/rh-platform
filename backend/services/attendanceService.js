const moment = require('moment');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

/**
 * Calculate haversine distance between two points (in km)
 */
const haversineDistance = (point1, point2) => {
    const R = 6371;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLon = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Check in an employee
 */
const checkIn = async ({ targetEmployeeId, face_image_url, location, device_info, liveness_score }) => {
    if (!targetEmployeeId) {
        const err = new Error('Employee ID is required');
        err.statusCode = 400;
        throw err;
    }

    const today = moment().format('YYYY-MM-DD');
    const now = new Date();

    // Check duplicate
    const existing = await Attendance.findOne({ employee: targetEmployeeId, date: today });
    if (existing) {
        const err = new Error('Already checked in today');
        err.statusCode = 400;
        throw err;
    }

    const employee = await Employee.findById(targetEmployeeId);
    if (!employee) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }

    // Geo-fencing
    if (employee.workplace_location && employee.workplace_location.lat && location) {
        const distance = haversineDistance(employee.workplace_location, location);
        if (distance > 0.5) {
            const err = new Error('Location mismatch. You must be at the workplace to check-in.');
            err.statusCode = 403;
            err.distance = `${(distance * 1000).toFixed(0)}m`;
            throw err;
        }
    }

    // Liveness check
    const isLive = liveness_score ? liveness_score > 0.8 : true;
    if (!isLive) {
        const err = new Error('Liveness detection failed. Please use a real person.');
        err.statusCode = 403;
        throw err;
    }

    // Shift configuration
    const configStartTime = employee.work_start_time || '08:00';
    const [startHour, startMin] = configStartTime.split(':').map(Number);
    const startTime = moment().set({ hour: startHour, minute: startMin, second: 0 });
    const checkInTime = moment(now);
    const delayMinutes = checkInTime.isAfter(startTime) ? checkInTime.diff(startTime, 'minutes') : 0;
    const status = delayMinutes > 0 ? 'late' : 'present';

    // Normalize inputs
    const normalizedLocation = typeof location === 'string'
        ? { address: location } : (location || null);
    const normalizedDeviceInfo = typeof device_info === 'string'
        ? { device_name: device_info } : (device_info || null);

    const newAttendance = new Attendance({
        employee: targetEmployeeId,
        employee_id: targetEmployeeId,
        date: today,
        check_in_time: now,
        check_out_time: null,
        face_image_url: face_image_url || null,
        location: normalizedLocation,
        device_info: normalizedDeviceInfo,
        status,
        delay_minutes: delayMinutes,
        notes: ''
    });

    await newAttendance.save();

    return {
        attendance: { attendance_id: newAttendance._id, ...newAttendance.toObject() },
        delayMinutes
    };
};

/**
 * Check out an employee
 */
const checkOut = async (targetEmployeeId) => {
    if (!targetEmployeeId) {
        const err = new Error('Employee ID is required');
        err.statusCode = 400;
        throw err;
    }

    const today = moment().format('YYYY-MM-DD');
    const attendance = await Attendance.findOne({ employee: targetEmployeeId, date: today });

    if (!attendance) {
        const err = new Error('No check-in found for today');
        err.statusCode = 400;
        throw err;
    }

    if (attendance.check_out_time) {
        const err = new Error('Already checked out today');
        err.statusCode = 400;
        throw err;
    }

    attendance.check_out_time = new Date();
    await attendance.save();
};

/**
 * Get all attendance records with filters
 */
const getAttendanceRecords = async (filters = {}) => {
    const { startDate, endDate, employee_id, status, date } = filters;
    const query = {};

    if (employee_id) query.employee = employee_id;
    if (status) query.status = status;

    if (date) {
        query.date = date;
    } else if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = startDate;
        if (endDate) query.date.$lte = endDate;
    }

    const records = await Attendance.find(query)
        .populate('employee', 'firstName lastName')
        .sort({ created_at: -1 });

    return records.map(r => ({
        attendance_id: r._id,
        employee_name: r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : undefined,
        ...r.toObject()
    }));
};

/**
 * Get attendance history for a specific employee
 */
const getEmployeeAttendance = async (employeeId, limit = 30) => {
    const records = await Attendance.find({ employee: employeeId })
        .sort({ created_at: -1 })
        .limit(limit);

    return records.map(r => ({ attendance_id: r._id, ...r.toObject() }));
};

module.exports = {
    checkIn,
    checkOut,
    getAttendanceRecords,
    getEmployeeAttendance,
    haversineDistance
};
