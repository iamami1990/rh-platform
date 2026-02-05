const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const Sentiment = require('../models/Sentiment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Calculate sentiment score for an employee for a month
 */
const calculateSentiment = async (employee_id, month) => {
    const startDate = moment(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
    const endDate = moment(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

    const attendanceRecords = await Attendance.find({
        employee_id,
        date: { $gte: startDate, $lte: endDate }
    });

    const leaveRecords = await Leave.find({
        employee_id,
        status: 'approved',
        $or: [
            { start_date: { $gte: startDate, $lte: endDate } },
            { end_date: { $gte: startDate, $lte: endDate } }
        ]
    });

    const workingDays = moment(month, 'YYYY-MM').daysInMonth();
    const presentDays = attendanceRecords.filter(r => r.status !== 'absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;

    const attendanceRate = (presentDays / workingDays) * 100;
    const attendance_score = attendanceRate >= 100 ? 10 : attendanceRate >= 95 ? 8 : attendanceRate >= 90 ? 6 : 4;
    const punctuality_score = lateDays === 0 ? 10 : lateDays <= 2 ? 7 : lateDays <= 5 ? 4 : 2;
    const assiduity_score = absentDays === 0 ? 10 : absentDays <= 2 ? 7 : absentDays <= 5 ? 4 : 2;
    const workload_score = 8;

    // Overall score (0-100)
    const overall_score = (attendance_score + punctuality_score + assiduity_score + workload_score) * 2.5;

    let sentiment = 'good';
    let risk_level = 'low';

    if (overall_score < 50) {
        sentiment = 'poor';
        risk_level = 'high';
    } else if (overall_score < 70) {
        sentiment = 'neutral';
        risk_level = 'medium';
    }

    const recommendations = [];
    if (lateDays > 3) recommendations.push('Address punctuality issues');
    if (absentDays > 3) recommendations.push('Review absence pattern');
    if (overall_score < 60) recommendations.push('Schedule 1-on-1 meeting');

    // Trend Calculation
    const previousMonth = moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM');
    const pastSentiment = await Sentiment.findOne({ employee_id, month: previousMonth });

    let trend = 'stable';
    if (pastSentiment) {
        if (overall_score > pastSentiment.overall_score + 5) trend = 'improving';
        else if (overall_score < pastSentiment.overall_score - 5) trend = 'declining';
    }

    return {
        attendance_score,
        punctuality_score,
        assiduity_score,
        workload_score,
        overall_score,
        sentiment,
        trend,
        risk_level,
        recommendations: recommendations.join('; '),
        metrics: {
            working_days: workingDays,
            present_days: presentDays,
            absent_days: absentDays,
            late_days: lateDays,
            attendance_rate: attendanceRate.toFixed(2)
        }
    };
};

/**
 * @route   POST /api/sentiment/generate
 * @desc    Generate sentiment analysis
 * @access  Private (Admin)
 */
router.post('/generate', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month } = req.body;
        if (!month) return res.status(400).json({ success: false, message: 'Month required' });

        const attendances = await Attendance.find({ date: { $regex: `^${month}` } }).select('employee_id');
        const employeeIds = [...new Set(attendances.map(a => a.employee_id))];

        const results = [];
        for (const employee_id of employeeIds) {
            const existing = await Sentiment.findOne({ employee_id, month });
            if (existing) {
                results.push({ employee_id, status: 'already_exists' });
                continue;
            }

            const data = await calculateSentiment(employee_id, month);
            const sentiment = await Sentiment.create({
                sentiment_id: uuidv4(),
                employee_id,
                month,
                ...data
            });

            if (sentiment.risk_level === 'high') {
                await Notification.create({
                    user_id: 'admin', // Ideally notify all admins
                    type: 'AI_RISK_ALERT',
                    title: 'Alert Sentiment Risk',
                    message: `Employee ${employee_id} at risk. Score: ${sentiment.overall_score}`,
                    data: { sentiment_id: sentiment.sentiment_id }
                });
            }

            results.push({ employee_id, status: 'generated', score: sentiment.overall_score });
        }

        res.status(201).json({ success: true, count: results.length, results });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Analysis failed', error: error.message });
    }
});

/**
 * @route   GET /api/sentiment
 * @access  Private
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { month, employee_id } = req.query;
        const query = {};
        if (month) query.month = month;
        if (employee_id) query.employee_id = employee_id;

        const sentiments = await Sentiment.find(query).sort({ created_at: -1 });
        res.json({ success: true, count: sentiments.length, sentiments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed', error: error.message });
    }
});

/**
 * @route   GET /api/sentiment/alerts
 */
router.get('/alerts', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { month } = req.query;
        const query = { risk_level: 'high' };
        if (month) query.month = month;

        const alerts = await Sentiment.find(query).sort({ overall_score: 1 });
        res.json({ success: true, count: alerts.length, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch alerts failed', error: error.message });
    }
});

/**
 * @route   GET /api/sentiment/my
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.user.uid;
        const history = await Sentiment.find({ employee_id: employeeId }).sort({ month: -1 }).limit(12);
        res.json({ success: true, history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Fetch failed', error: error.message });
    }
});

module.exports = router;
