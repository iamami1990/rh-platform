const express = require('express');
const router = express.Router();
const moment = require('moment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const Sentiment = require('../models/Sentiment');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard KPIs
 * @access  Private (Admin)
 */
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');
        const currentMonth = moment().format('YYYY-MM');

        // Total employees
        const totalEmployees = await Employee.countDocuments({ status: 'active' });

        // Employees on leave today
        const onLeaveToday = await Leave.countDocuments({
            status: 'approved',
            start_date: { $lte: today },
            end_date: { $gte: today }
        });

        // Today's attendance
        const todayAttendance = await Attendance.find({ date: today });
        const presentToday = todayAttendance.length;
        const lateToday = todayAttendance.filter(r => r.status === 'late').length;
        const attendanceRate = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(2) : 0;

        // Payroll stats for current month
        const payrolls = await Payroll.find({ month: currentMonth });
        const payrollGenerated = payrolls.length;
        const totalSalaryMass = payrolls.reduce((sum, p) => sum + (p.net_salary || 0), 0);

        // Sentiment overview
        const sentiments = await Sentiment.find({ month: currentMonth });
        const avgSentiment = sentiments.length > 0
            ? (sentiments.reduce((sum, s) => sum + s.overall_score, 0) / sentiments.length).toFixed(2)
            : 0;

        const atRiskEmployees = sentiments.filter(s => s.risk_level === 'high').length;

        res.json({
            success: true,
            dashboard: {
                employees: {
                    total: totalEmployees,
                    active: totalEmployees,
                    on_leave: onLeaveToday
                },
                attendance: {
                    today: {
                        present: presentToday,
                        late: lateToday,
                        rate: attendanceRate
                    }
                },
                payroll: {
                    month: currentMonth,
                    generated: payrollGenerated,
                    total_mass: totalSalaryMass.toFixed(2)
                },
                sentiment: {
                    average_score: avgSentiment,
                    at_risk: atRiskEmployees
                }
            }
        });
    } catch (error) {
        console.error('Dashboard Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin dashboard',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dashboard/manager
 * @desc    Get manager dashboard KPIs
 * @access  Private (Manager)
 */
router.get('/manager', authenticate, authorize('manager'), async (req, res) => {
    try {
        // TODO: Filter by manager's team if relationships exist
        // For now returning empty or simplified
        res.json({
            success: true,
            message: 'Manager dashboard - to be implemented with team filtering',
            dashboard: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch manager dashboard',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/dashboard/employee
 * @desc    Get employee dashboard KPIs
 * @access  Private (Employee)
 */
router.get('/employee', authenticate, async (req, res) => {
    try {
        const employee_id = req.user.employee_id;

        if (!employee_id) {
            return res.status(400).json({
                success: false,
                message: 'No employee_id associated with this user'
            });
        }

        const today = moment().format('YYYY-MM-DD');
        const currentMonth = moment().format('YYYY-MM');

        // Latest payroll
        const latestPayroll = await Payroll.findOne({ employee_id }).sort({ generated_at: -1 });

        // Leave balance (Simplified calc or fetch from a dedicated optimized endpoint later)
        const approvedLeaves = await Leave.find({
            employee_id,
            status: 'approved',
            leave_type: 'annual' // Simplified for dashboard
        });

        const usedAnnualDays = approvedLeaves.reduce((sum, l) => sum + l.days_requested, 0);

        const leaveBalance = {
            allocated: 25,
            used: usedAnnualDays,
            remaining: 25 - usedAnnualDays
        };

        // Attendance this month
        // Regex for date string YYYY-MM
        const thisMonthRecords = await Attendance.find({
            employee_id,
            date: { $regex: `^${currentMonth}` }
        });

        const presentDays = thisMonthRecords.length;
        const lateDays = thisMonthRecords.filter(r => r.status === 'late').length;

        // Latest sentiment
        const latestSentiment = await Sentiment.findOne({ employee_id }).sort({ created_at: -1 });

        res.json({
            success: true,
            dashboard: {
                payroll: latestPayroll ? {
                    month: latestPayroll.month,
                    net_salary: latestPayroll.net_salary,
                    status: latestPayroll.status
                } : null,
                leave_balance: leaveBalance,
                attendance: {
                    month: currentMonth,
                    present_days: presentDays,
                    late_days: lateDays
                },
                sentiment: latestSentiment ? {
                    score: latestSentiment.overall_score,
                    sentiment: latestSentiment.sentiment,
                    month: latestSentiment.month
                } : null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee dashboard',
            error: error.message
        });
    }
});

module.exports = router;
