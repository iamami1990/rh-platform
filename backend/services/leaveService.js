const moment = require('moment');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Standard leave allocations (configurable per company)
const LEAVE_ALLOCATIONS = {
    annual: parseInt(process.env.LEAVE_ANNUAL || '25'),
    sick: parseInt(process.env.LEAVE_SICK || '15'),
    maternity: parseInt(process.env.LEAVE_MATERNITY || '90'),
    unpaid: 999
};

/**
 * Create a leave request
 */
const createLeaveRequest = async ({ targetEmployeeId, leave_type, start_date, end_date, reason, document_url }) => {
    if (!targetEmployeeId) {
        const err = new Error('Employee ID is required');
        err.statusCode = 400;
        throw err;
    }

    const start = moment(start_date);
    const end = moment(end_date);
    const days_requested = end.diff(start, 'days') + 1;

    const newLeave = new Leave({
        employee: targetEmployeeId,
        employee_id: targetEmployeeId,
        leave_type,
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
    return { leave_id: newLeave._id, ...newLeave.toObject() };
};

/**
 * Get all leave requests with filters
 */
const getLeaves = async (filters = {}) => {
    const { status, employee_id } = filters;
    const query = {};
    if (status) query.status = status;
    if (employee_id) query.employee = employee_id;

    const leaves = await Leave.find(query).sort({ created_at: -1 });
    return leaves.map(l => ({ leave_id: l._id, ...l.toObject() }));
};

/**
 * Get approved leaves for calendar view
 */
const getCalendarLeaves = async () => {
    const leaves = await Leave.find({ status: 'approved' }).populate('employee', 'firstName lastName');

    return leaves.map(l => ({
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
};

/**
 * Helper to find the User document linked to an employee
 */
const findUserForEmployee = async (employeeId) => {
    return User.findOne({
        $or: [{ employee: employeeId }, { employee_id: employeeId }]
    }).select('_id');
};

/**
 * Approve a leave request
 */
const approveLeave = async (leaveId, approvedBy) => {
    const leave = await Leave.findByIdAndUpdate(
        leaveId,
        { status: 'approved', approved_by: approvedBy, approved_at: new Date() },
        { new: true }
    );

    if (!leave) {
        const err = new Error('Leave request not found');
        err.statusCode = 404;
        throw err;
    }

    // Notify employee
    const user = await findUserForEmployee(leave.employee);
    if (user) {
        await Notification.create({
            user: user._id,
            title: 'Demande de conge approuvee',
            body: `Votre demande de conge du ${leave.start_date} au ${leave.end_date} a ete approuvee.`,
            type: 'success',
            data: { leave_id: leave._id }
        });
    }
};

/**
 * Reject a leave request
 */
const rejectLeave = async (leaveId, rejectedBy) => {
    const leave = await Leave.findByIdAndUpdate(
        leaveId,
        { status: 'rejected', approved_by: rejectedBy, approved_at: new Date() },
        { new: true }
    );

    if (!leave) {
        const err = new Error('Leave request not found');
        err.statusCode = 404;
        throw err;
    }

    const user = await findUserForEmployee(leave.employee);
    if (user) {
        await Notification.create({
            user: user._id,
            title: 'Demande de conge refusee',
            body: `Votre demande de conge du ${leave.start_date} au ${leave.end_date} a ete refusee.`,
            type: 'warning',
            data: { leave_id: leave._id }
        });
    }
};

/**
 * Get leave balance for an employee
 */
const getLeaveBalance = async (employeeId) => {
    const currentYear = moment().year();

    const leaves = await Leave.find({
        employee: employeeId,
        status: 'approved'
    });

    const usedDays = leaves
        .filter(l => moment(l.start_date).year() === currentYear)
        .reduce((acc, l) => {
            acc[l.leave_type] = (acc[l.leave_type] || 0) + l.days_requested;
            return acc;
        }, {});

    const balance = Object.keys(LEAVE_ALLOCATIONS).reduce((acc, type) => {
        acc[type] = {
            allocated: LEAVE_ALLOCATIONS[type],
            used: usedDays[type] || 0,
            remaining: LEAVE_ALLOCATIONS[type] - (usedDays[type] || 0)
        };
        return acc;
    }, {});

    return { employee_id: employeeId, year: currentYear, balance };
};

module.exports = {
    createLeaveRequest,
    getLeaves,
    getCalendarLeaves,
    approveLeave,
    rejectLeave,
    getLeaveBalance,
    LEAVE_ALLOCATIONS
};
