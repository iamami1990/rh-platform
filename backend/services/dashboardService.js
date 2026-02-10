const moment = require('moment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Sentiment = require('../models/Sentiment');
const { LEAVE_ALLOCATIONS } = require('./leaveService');

/**
 * Get admin dashboard KPIs
 */
const getAdminDashboard = async () => {
    const currentMonth = moment().format('YYYY-MM');
    const today = moment().format('YYYY-MM-DD');

    const [totalEmployees, activeEmployees, todayAttendance, pendingLeaves, monthPayroll] = await Promise.all([
        Employee.countDocuments(),
        Employee.countDocuments({ status: 'active' }),
        Attendance.find({ date: today }),
        Leave.countDocuments({ status: 'pending' }),
        Payroll.find({ month: currentMonth }).lean()
    ]);

    const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;
    const absentToday = activeEmployees - presentToday;

    const totalPayroll = monthPayroll.reduce((sum, p) => sum + Number(p.net_salary || 0), 0);

    // Sentiment overview
    const sentimentRecords = await Sentiment.find({ month: currentMonth }).lean();
    const avgSentiment = sentimentRecords.length > 0
        ? sentimentRecords.reduce((sum, s) => sum + s.overall_score, 0) / sentimentRecords.length
        : 0;
    const highRisk = sentimentRecords.filter(s => s.risk_level === 'high').length;

    return {
        employees: { total: totalEmployees, active: activeEmployees },
        attendance: { present: presentToday, late: lateToday, absent: absentToday, total: activeEmployees },
        leaves: { pending: pendingLeaves },
        payroll: { total_net: totalPayroll, employees_paid: monthPayroll.length, month: currentMonth },
        sentiment: { average_score: Math.round(avgSentiment), high_risk: highRisk, total_analyzed: sentimentRecords.length }
    };
};

/**
 * Get manager dashboard KPIs (team-filtered)
 */
const getManagerDashboard = async (managerEmployeeId) => {
    const today = moment().format('YYYY-MM-DD');
    const currentMonth = moment().format('YYYY-MM');

    // Find the manager's employee record to get their department
    const manager = await Employee.findById(managerEmployeeId);
    if (!manager) {
        return { message: 'Manager profile not found', data: {} };
    }

    // Get team members in the same department
    const teamMembers = await Employee.find({
        department: manager.department,
        status: 'active'
    }).lean();

    const teamIds = teamMembers.map(m => m._id);

    const [todayAttendance, pendingLeaves, monthPayroll] = await Promise.all([
        Attendance.find({ date: today, employee: { $in: teamIds } }),
        Leave.countDocuments({ status: 'pending', employee: { $in: teamIds } }),
        Payroll.find({ month: currentMonth, employee: { $in: teamIds } }).lean()
    ]);

    const presentToday = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const lateToday = todayAttendance.filter(a => a.status === 'late').length;

    return {
        department: manager.department,
        team: { total: teamMembers.length, members: teamMembers.map(m => ({ id: m._id, name: `${m.firstName} ${m.lastName}`, position: m.position })) },
        attendance: { present: presentToday, late: lateToday, absent: teamMembers.length - presentToday, total: teamMembers.length },
        leaves: { pending: pendingLeaves },
        payroll: { total_net: monthPayroll.reduce((s, p) => s + Number(p.net_salary || 0), 0), month: currentMonth }
    };
};

/**
 * Get employee personal dashboard
 */
const getEmployeeDashboard = async (employeeId) => {
    const currentMonth = moment().format('YYYY-MM');
    const currentYear = moment().year();

    const [latestPayroll, approvedLeaves, monthAttendance, sentiment] = await Promise.all([
        Payroll.findOne({ employee: employeeId }).sort({ month: -1 }),
        Leave.find({ employee: employeeId, status: 'approved' }),
        Attendance.find({
            employee: employeeId,
            date: { $gte: moment().startOf('month').format('YYYY-MM-DD'), $lte: moment().endOf('month').format('YYYY-MM-DD') }
        }),
        Sentiment.findOne({ employee: employeeId }).sort({ month: -1 })
    ]);

    // Leave balance
    const usedDays = approvedLeaves
        .filter(l => moment(l.start_date).year() === currentYear)
        .reduce((acc, l) => {
            acc[l.leave_type] = (acc[l.leave_type] || 0) + l.days_requested;
            return acc;
        }, {});

    const annualAllocated = LEAVE_ALLOCATIONS.annual;
    const annualUsed = usedDays.annual || 0;

    return {
        payroll: latestPayroll ? { month: latestPayroll.month, net_salary: latestPayroll.net_salary, gross_salary: latestPayroll.gross_salary } : null,
        leave_balance: { annual: { allocated: annualAllocated, used: annualUsed, remaining: annualAllocated - annualUsed } },
        attendance: {
            month: currentMonth,
            present: monthAttendance.filter(a => a.status === 'present' || a.status === 'late').length,
            late: monthAttendance.filter(a => a.status === 'late').length,
            absent: monthAttendance.filter(a => a.status === 'absent').length
        },
        sentiment: sentiment ? { score: sentiment.overall_score, sentiment: sentiment.sentiment, trend: sentiment.trend } : null
    };
};

module.exports = {
    getAdminDashboard,
    getManagerDashboard,
    getEmployeeDashboard
};
