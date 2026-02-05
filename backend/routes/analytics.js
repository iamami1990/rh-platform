const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Sentiment = require('../models/Sentiment');
const Payroll = require('../models/Payroll');
const Leave = require('../models/Leave');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/analytics/behavioral-patterns
 * @desc    Get behavioral patterns across all employees
 * @access  Admin/Manager
 */
router.get('/behavioral-patterns', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        // Fetch last 1000 attendance records
        const attendanceData = await Attendance.find().sort({ date: -1 }).limit(1000);
        const patterns = analyzeBehavioralPatterns(attendanceData);

        res.json({
            success: true,
            patterns: {
                attendance_clusters: patterns.clusters,
                risk_segments: patterns.riskSegments,
                productivity_trends: patterns.productivityTrends,
                anomalies: patterns.anomalies
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Analytics failed', error: error.message });
    }
});

/**
 * @route   GET /api/analytics/employee-insights/:employee_id
 */
router.get('/employee-insights/:employee_id', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { employee_id } = req.params;

        const [employee, attendance, leaves, sentiment, payroll] = await Promise.all([
            Employee.findOne({ employee_id }),
            Attendance.find({ employee_id }).sort({ date: -1 }).limit(90),
            Leave.find({ employee_id }),
            Sentiment.find({ employee_id }).sort({ month: -1 }).limit(6),
            Payroll.find({ employee_id }).sort({ month: -1 }).limit(12)
        ]);

        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const insights = generateEmployeeInsights({
            employee,
            attendance,
            leaves,
            sentiment,
            payroll
        });

        res.json({ success: true, employee_id, insights });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Insights failed', error: error.message });
    }
});

// Helper Functions
function analyzeBehavioralPatterns(attendanceData) {
    const employeePatterns = {};

    attendanceData.forEach(record => {
        if (!employeePatterns[record.employee_id]) {
            employeePatterns[record.employee_id] = { total: 0, late: 0, absent: 0 };
        }
        const p = employeePatterns[record.employee_id];
        p.total++;
        if (record.status === 'late') p.late++;
        if (record.status === 'absent') p.absent++;
    });

    const employees = Object.keys(employeePatterns).map(id => {
        const p = employeePatterns[id];
        return {
            employee_id: id,
            punctuality_score: p.total > 0 ? ((p.total - p.late) / p.total) * 100 : 0,
            attendance_rate: p.total > 0 ? ((p.total - p.absent) / p.total) * 100 : 0,
            late_days: p.late,
            absent_days: p.absent
        };
    });

    const clusters = {
        high_performers: employees.filter(e => e.punctuality_score >= 90 && e.attendance_rate >= 95),
        average_performers: employees.filter(e => e.punctuality_score >= 70 && e.punctuality_score < 90),
        at_risk: employees.filter(e => e.punctuality_score < 70 || e.attendance_rate < 85)
    };

    return {
        clusters,
        riskSegments: clusters.at_risk.length,
        productivityTrends: [], // Simplified
        anomalies: employees.filter(e => e.late_days > 10 || e.absent_days > 5)
    };
}

function generateEmployeeInsights(data) {
    const { attendance, sentiment } = data;
    const attendanceRate = attendance.length > 0 ? attendance.filter(a => a.status !== 'absent').length / attendance.length * 100 : 0;
    const avgSentiment = sentiment.length > 0 ? sentiment.reduce((sum, s) => sum + s.overall_score, 0) / sentiment.length : 0;

    return {
        performance_summary: {
            attendance_rate: attendanceRate.toFixed(2),
            sentiment_score: avgSentiment.toFixed(2)
        },
        recommendations: avgSentiment < 50 ? ['Discussion needed'] : ['Maintain good work']
    };
}

module.exports = router;
