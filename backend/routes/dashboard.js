const express = require('express');
const router = express.Router();
const moment = require('moment');
const {
    getEmployeesCollection,
    getAttendanceCollection,
    getLeavesCollection,
    getPayrollCollection,
    getSentimentCollection
} = require('../config/database');
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
        const empSnapshot = await getEmployeesCollection()
            .where('status', '==', 'active')
            .get();
        const totalEmployees = empSnapshot.size;

        // Employees on leave today
        const leavesSnapshot = await getLeavesCollection()
            .where('status', '==', 'approved')
            .get();

        const onLeaveToday = leavesSnapshot.docs.filter(doc => {
            const leave = doc.data();
            return today >= leave.start_date && today <= leave.end_date;
        }).length;

        // Today's attendance
        const todayAttendance = await getAttendanceCollection()
            .where('date', '==', today)
            .get();

        const presentToday = todayAttendance.size;
        const lateToday = todayAttendance.docs.filter(doc => doc.data().status === 'late').length;
        const attendanceRate = totalEmployees > 0 ? ((presentToday / totalEmployees) * 100).toFixed(2) : 0;

        // Payroll stats for current month
        const payrollSnapshot = await getPayrollCollection()
            .where('month', '==', currentMonth)
            .get();

        const payrollGenerated = payrollSnapshot.size;
        const totalSalaryMass = payrollSnapshot.docs
            .reduce((sum, doc) => sum + (doc.data().net_salary || 0), 0);

        // Sentiment overview
        const sentimentSnapshot = await getSentimentCollection()
            .where('month', '==', currentMonth)
            .get();

        const sentimentData = sentimentSnapshot.docs.map(doc => doc.data());
        const avgSentiment = sentimentData.length > 0
            ? (sentimentData.reduce((sum, s) => sum + s.overall_score, 0) / sentimentData.length).toFixed(2)
            : 0;

        const atRiskEmployees = sentimentData.filter(s => s.risk_level === 'high').length;

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
        // TODO: Filter by manager's team (requires manager_id relationship)
        // For now, return similar to admin but could be filtered

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
        const latestPayroll = await getPayrollCollection()
            .where('employee_id', '==', employee_id)
            .orderBy('generated_at', 'desc')
            .limit(1)
            .get();

        const payroll = latestPayroll.empty ? null : latestPayroll.docs[0].data();

        // Leave balance
        const approvedLeaves = await getLeavesCollection()
            .where('employee_id', '==', employee_id)
            .where('status', '==', 'approved')
            .get();

        const usedAnnualDays = approvedLeaves.docs
            .filter(doc => doc.data().leave_type === 'annual')
            .reduce((sum, doc) => sum + doc.data().days_requested, 0);

        const leaveBalance = {
            allocated: 25,
            used: usedAnnualDays,
            remaining: 25 - usedAnnualDays
        };

        // Attendance this month
        const monthAttendance = await getAttendanceCollection()
            .where('employee_id', '==', employee_id)
            .get();

        const thisMonthRecords = monthAttendance.docs
            .map(doc => doc.data())
            .filter(r => r.date.startsWith(currentMonth));

        const presentDays = thisMonthRecords.length;
        const lateDays = thisMonthRecords.filter(r => r.status === 'late').length;

        // Latest sentiment
        const latestSentiment = await getSentimentCollection()
            .where('employee_id', '==', employee_id)
            .orderBy('created_at', 'desc')
            .limit(1)
            .get();

        const sentiment = latestSentiment.empty ? null : latestSentiment.docs[0].data();

        res.json({
            success: true,
            dashboard: {
                payroll: payroll ? {
                    month: payroll.month,
                    net_salary: payroll.net_salary,
                    status: payroll.status
                } : null,
                leave_balance: leaveBalance,
                attendance: {
                    month: currentMonth,
                    present_days: presentDays,
                    late_days: lateDays
                },
                sentiment: sentiment ? {
                    score: sentiment.overall_score,
                    sentiment: sentiment.sentiment,
                    month: sentiment.month
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
