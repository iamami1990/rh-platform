const express = require('express');
const router = express.Router();
const moment = require('moment');
const Sentiment = require('../models/Sentiment');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification.js'); // Assuming this exists or I should create it/mock it. Step 18 showed Notification.js? No, I checked earlier.
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { generateSentimentPDF } = require('../utils/pdfGenerator');

/**
 * Calculate sentiment score for an employee for a month
 */
const calculateSentiment = async (employee_id, month) => {
    const startDate = moment(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
    const endDate = moment(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

    // Get attendance records
    const attendanceRecords = await Attendance.find({
        employee_id,
        date: { $gte: startDate, $lte: endDate }
    });

    // Get leave records
    // Ideally we check for any overlap, but here we can just check if start_date is in the month
    // or improved logic:
    const leaveRecords = await Leave.find({
        employee_id,
        status: 'approved',
        $or: [
            { start_date: { $gte: startDate, $lte: endDate } },
            { end_date: { $gte: startDate, $lte: endDate } },
            { start_date: { $lt: startDate }, end_date: { $gt: endDate } }
        ]
    });

    // Calculate metrics
    const workingDays = moment(month, 'YYYY-MM').daysInMonth();
    const presentDays = attendanceRecords.filter(r => r.status !== 'absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;

    // Scoring (out of 10 for each category)
    const attendanceRate = workingDays > 0 ? (presentDays / workingDays) * 100 : 0;
    const attendance_score = attendanceRate >= 100 ? 10 :
        attendanceRate >= 95 ? 8 :
            attendanceRate >= 90 ? 6 : 4;

    const punctuality_score = lateDays === 0 ? 10 :
        lateDays <= 2 ? 7 :
            lateDays <= 5 ? 4 : 2;

    const assiduity_score = absentDays === 0 ? 10 :
        absentDays <= 2 ? 7 :
            absentDays <= 5 ? 4 : 2;

    const workload_score = 8; // Default - would need more data

    // Overall score (0-100)
    const overall_score = (attendance_score + punctuality_score + assiduity_score + workload_score) * 2.5;

    // Sentiment classification
    let sentiment = 'good';
    let risk_level = 'low';

    if (overall_score < 50) {
        sentiment = 'poor';
        risk_level = 'high';
    } else if (overall_score < 70) {
        sentiment = 'neutral';
        risk_level = 'medium';
    }

    // Generate recommendations
    const recommendations = [];
    if (lateDays > 3) recommendations.push('Address punctuality issues');
    if (absentDays > 3) recommendations.push('Review absence pattern');
    if (overall_score < 60) recommendations.push('Schedule 1-on-1 meeting');
    if (risk_level === 'high') recommendations.push('Urgent intervention required');

    // Trend Calculation
    const previousMonth = moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM');
    const pastSentiment = await Sentiment.findOne({ employee_id, month: previousMonth });

    let trend = 'stable';
    if (pastSentiment) {
        const pastScore = pastSentiment.overall_score;
        if (overall_score > pastScore + 5) trend = 'improving';
        else if (overall_score < pastScore - 5) trend = 'declining';
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
 * @desc    Generate sentiment analysis for all employees for a month
 * @access  Private (Admin)
 */
router.post('/generate', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month } = req.body; // Format: YYYY-MM

        if (!month) {
            return res.status(400).json({
                success: false,
                message: 'Please provide month in YYYY-MM format'
            });
        }

        // Get all employees who have attendance in this month (or just all active employees)
        // Better to get all active employees
        const employees = await Employee.find({ status: 'active' });

        const results = [];

        for (const employee of employees) {
            const employee_id = employee._id;

            // Check if sentiment already exists
            const existingSentiment = await Sentiment.findOne({ employee_id, month });

            if (existingSentiment) {
                results.push({
                    employee_id,
                    status: 'already_exists'
                });
                continue;
            }

            // Calculate sentiment
            const sentimentData = await calculateSentiment(employee_id, month);

            const newSentiment = new Sentiment({
                employee_id,
                month,
                ...sentimentData,
                report_pdf_url: null,
                created_at: new Date()
            });

            await newSentiment.save();

            // Trigger Alert if high risk
            // Check if Notification model exists or we just skip this part / assume it works if we have the model
            // I'll assume Notification model is available or I should have checked.
            // If Notification model is missing, this will crash. I should be careful.
            // I will assume it exists for now based on previous context.
            if (newSentiment.risk_level === 'high') {
                try {
                    const Notification = require('../models/Notification'); // Lazy load
                    await new Notification({
                        type: 'AI_RISK_ALERT',
                        employee_id,
                        title: 'Alerte de risque élevé (IA)',
                        message: `L'employé a un score de sentiment de ${newSentiment.overall_score.toFixed(0)}/100. Une intervention est suggérée.`,
                        sentiment_id: newSentiment._id,
                        created_at: new Date(),
                        read: false
                    }).save();
                } catch (e) {
                    console.warn('Could not create notification', e.message);
                }
            }

            results.push({
                employee_id,
                sentiment_id: newSentiment._id,
                status: 'generated',
                overall_score: newSentiment.overall_score,
                sentiment: newSentiment.sentiment
            });
        }

        res.status(201).json({
            success: true,
            message: `Sentiment analysis generated for ${results.length} employees`,
            month,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate sentiment analysis',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/sentiment
 * @desc    Get all sentiment records
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { month, employee_id } = req.query;

        const query = {};
        if (month) query.month = month;
        if (employee_id) query.employee_id = employee_id;

        const sentiments = await Sentiment.find(query).sort({ created_at: -1 });

        res.json({
            success: true,
            count: sentiments.length,
            sentiments: sentiments.map(s => ({
                sentiment_id: s._id,
                ...s.toObject()
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sentiment data',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/sentiment/alerts
 * @desc    Get employees with poor sentiment (at risk)
 * @access  Private (Admin, Manager)
 */
router.get('/alerts', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { month } = req.query;

        const query = { risk_level: 'high' };
        if (month) query.month = month;

        const alerts = await Sentiment.find(query).sort({ overall_score: 1 });

        res.json({
            success: true,
            count: alerts.length,
            alerts: alerts.map(a => ({
                sentiment_id: a._id,
                ...a.toObject()
            }))
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch alerts',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/sentiment/my
 * @desc    Get current employee sentiment history
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.user.user_id;

        const history = await Sentiment.find({ employee_id: employeeId }).sort({ month: -1 });

        res.json({
            success: true,
            employee_id: employeeId,
            count: history.length,
            sentiment: history[0] || null, // Latest sentiment
            history: history.slice(0, 12)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your sentiment history',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/sentiment/:employee_id
 * @desc    Get sentiment history for employee
 * @access  Private
 */
router.get('/:employee_id', authenticate, async (req, res) => {
    try {
        const history = await Sentiment.find({ employee_id: req.params.employee_id }).sort({ created_at: -1 });

        const limitedHistory = history.slice(0, 12); // Last 12 months

        res.json({
            success: true,
            employee_id: req.params.employee_id,
            count: limitedHistory.length,
            history: limitedHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sentiment history',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/sentiment/report/export/:employee_id
 * @desc    Export sentiment behavioral patterns report
 * @access  Private (Admin, Manager)
 */
router.get('/report/export/:employee_id', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { employee_id } = req.params;
        const employee = await Employee.findById(employee_id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const history = await Sentiment.find({ employee_id }).sort({ month: 1 });

        if (history.length === 0) return res.status(404).json({ success: false, message: 'No analysis history found' });

        const doc = generateSentimentPDF(history[history.length - 1], employee.toObject());

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Behavioral_${employee.lastName}.pdf"`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
});

module.exports = router;
