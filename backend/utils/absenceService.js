const moment = require('moment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');

const markAbsencesForDate = async (dateStr) => {
    const activeEmployees = await Employee.find({ status: 'active' }).select('_id');
    if (activeEmployees.length === 0) return { created: 0 };

    const existing = await Attendance.find({ date: dateStr }).select('employee');
    const attended = new Set(existing.map(a => (a.employee || a.employee_id).toString()));

    const onLeave = await Leave.find({
        status: 'approved',
        start_date: { $lte: dateStr },
        end_date: { $gte: dateStr }
    }).select('employee');
    const leaveSet = new Set(onLeave.map(l => (l.employee || l.employee_id).toString()));

    const toCreate = activeEmployees
        .filter(e => !attended.has(e._id.toString()) && !leaveSet.has(e._id.toString()))
        .map(e => ({
            employee: e._id,
            employee_id: e._id,
            date: dateStr,
            status: 'absent',
            delay_minutes: 0
        }));

    if (toCreate.length === 0) return { created: 0 };

    try {
        await Attendance.insertMany(toCreate, { ordered: false });
        return { created: toCreate.length };
    } catch (err) {
        if (err.code === 11000) {
            return { created: 0 };
        }
        throw err;
    }
};

const ensureAbsencesUpToDate = async (daysBack = 1) => {
    const results = [];
    for (let i = daysBack; i >= 1; i--) {
        const dateStr = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const result = await markAbsencesForDate(dateStr);
        results.push({ date: dateStr, ...result });
    }
    return results;
};

module.exports = {
    markAbsencesForDate,
    ensureAbsencesUpToDate
};
