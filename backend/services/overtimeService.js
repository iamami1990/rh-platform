const moment = require('moment');
const Overtime = require('../models/Overtime');
const Employee = require('../models/Employee');

// Working hours config
const WORKING_DAYS_PER_MONTH = parseInt(process.env.WORKING_DAYS_PER_MONTH || '22');
const HOURS_PER_DAY = parseInt(process.env.HOURS_PER_DAY || '8');

/**
 * Rate multipliers for overtime pay
 */
const RATE_MULTIPLIERS = {
    '125%': 1.25,
    '150%': 1.5,
    '200%': 2.0
};

/**
 * Create overtime request
 */
const createOvertime = async ({ requestData, requestedBy }) => {
    const { employee_id, date, hours, start_time, end_time, rate_type, overtime_category, reason, description, project_id, task_name } = requestData;

    // Validation
    if (hours > 12) {
        const err = new Error('Les heures supplémentaires ne peuvent pas dépasser 12 heures par jour');
        err.statusCode = 400;
        throw err;
    }

    if (!RATE_MULTIPLIERS[rate_type]) {
        const err = new Error('Type de taux invalide');
        err.statusCode = 400;
        throw err;
    }

    const employee = await Employee.findById(employee_id);
    if (!employee) {
        const err = new Error('Employé non trouvé');
        err.statusCode = 404;
        throw err;
    }

    const overtimeMonth = moment(date, 'YYYY-MM-DD').format('YYYY-MM');
    const baseSalary = Number(employee.salary_brut || 0);
    const baseHourlyRate = baseSalary / (WORKING_DAYS_PER_MONTH * HOURS_PER_DAY);
    const rateMultiplier = RATE_MULTIPLIERS[rate_type] || 1.25;
    const amount = baseHourlyRate * hours * rateMultiplier;

    const newOvertime = new Overtime({
        employee_id,
        date,
        month: overtimeMonth,
        hours,
        start_time: start_time || null,
        end_time: end_time || null,
        rate_type,
        overtime_category: overtime_category || 'regular',
        reason,
        description: description || '',
        project_id: project_id || null,
        task_name: task_name || null,
        status: 'pending',
        requested_by: requestedBy,
        approved_by: null,
        approved_at: null,
        rejection_reason: null,
        amount,
        base_hourly_rate: baseHourlyRate,
        manager_comments: ''
    });

    await newOvertime.save();
    return { overtime_id: newOvertime._id, ...newOvertime.toObject() };
};

/**
 * Get all overtime requests with filters
 */
const getOvertimes = async (filters = {}) => {
    const { employee_id, month, status } = filters;
    const query = {};
    if (employee_id) query.employee_id = employee_id;
    if (status) query.status = status;
    if (month) query.month = month;

    const overtimes = await Overtime.find(query).sort({ created_at: -1 });
    return overtimes.map(o => ({ overtime_id: o._id, ...o.toObject() }));
};

/**
 * Get overtime by ID
 */
const getOvertimeById = async (id) => {
    const overtime = await Overtime.findById(id);
    if (!overtime) {
        const err = new Error('Demande d\'heures supplémentaires non trouvée');
        err.statusCode = 404;
        throw err;
    }
    return { overtime_id: overtime._id, ...overtime.toObject() };
};

/**
 * Get current employee's overtime requests
 */
const getMyOvertimes = async (employeeId) => {
    const overtimes = await Overtime.find({ employee_id: employeeId }).sort({ date: -1 });
    return overtimes.map(o => ({ overtime_id: o._id, ...o.toObject() }));
};

/**
 * Get overtime for a specific employee
 */
const getEmployeeOvertimes = async (employeeId) => {
    const overtimes = await Overtime.find({ employee_id: employeeId }).sort({ date: -1 });
    return overtimes.map(o => ({ overtime_id: o._id, ...o.toObject() }));
};

/**
 * Approve overtime request
 */
const approveOvertime = async (id, { approvedBy, manager_comments }) => {
    const overtime = await Overtime.findById(id);
    if (!overtime) {
        const err = new Error('Demande non trouvée');
        err.statusCode = 404;
        throw err;
    }

    if (overtime.status !== 'pending') {
        const err = new Error(`Cette demande a déjà été ${overtime.status}`);
        err.statusCode = 400;
        throw err;
    }

    overtime.status = 'approved';
    overtime.approved_by = approvedBy;
    overtime.approved_at = new Date();
    overtime.manager_comments = manager_comments || '';
    await overtime.save();
};

/**
 * Reject overtime request
 */
const rejectOvertime = async (id, { approvedBy, rejection_reason, manager_comments }) => {
    const overtime = await Overtime.findById(id);
    if (!overtime) {
        const err = new Error('Demande non trouvée');
        err.statusCode = 404;
        throw err;
    }

    if (overtime.status !== 'pending') {
        const err = new Error(`Cette demande a déjà été ${overtime.status}`);
        err.statusCode = 400;
        throw err;
    }

    overtime.status = 'rejected';
    overtime.approved_by = approvedBy;
    overtime.approved_at = new Date();
    overtime.rejection_reason = rejection_reason;
    overtime.manager_comments = manager_comments || '';
    await overtime.save();
};

/**
 * Cancel overtime request (soft delete)
 */
const cancelOvertime = async (id, { userId, userRole, employeeId }) => {
    const overtime = await Overtime.findById(id);
    if (!overtime) {
        const err = new Error('Demande non trouvée');
        err.statusCode = 404;
        throw err;
    }

    if (userRole === 'employee') {
        if (overtime.employee_id.toString() !== employeeId) {
            const err = new Error('Accès refusé');
            err.statusCode = 403;
            throw err;
        }
        if (overtime.status !== 'pending') {
            const err = new Error('Vous ne pouvez annuler qu\'une demande en attente');
            err.statusCode = 400;
            throw err;
        }
    }

    overtime.status = 'cancelled';
    await overtime.save();
};

module.exports = {
    createOvertime,
    getOvertimes,
    getOvertimeById,
    getMyOvertimes,
    getEmployeeOvertimes,
    approveOvertime,
    rejectOvertime,
    cancelOvertime,
    WORKING_DAYS_PER_MONTH,
    HOURS_PER_DAY,
    RATE_MULTIPLIERS
};
