const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { getSentimentCollection, getAttendanceCollection, getLeavesCollection, getNotificationsCollection, getEmployeesCollection } = require('../config/database');
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
    const attendanceSnapshot = await getAttendanceCollection()
        .where('employee_id', '==', employee_id)
        .get();

    const attendanceRecords = attendanceSnapshot.docs
        .map(doc => doc.data())
        .filter(r => r.date >= startDate && r.date <= endDate);

    // Get leave records
    const leaveSnapshot = await getLeavesCollection()
        .where('employee_id', '==', employee_id)
        .where('status', '==', 'approved')
        .get();

    const leaveRecords = leaveSnapshot.docs
        .map(doc => doc.data())
        .filter(l => {
            const start = moment(l.start_date);
            const end = moment(l.end_date);
            const monthStart = moment(startDate);
            const monthEnd = moment(endDate);
            return start.isBetween(monthStart, monthEnd, null, '[]') ||
                end.isBetween(monthStart, monthEnd, null, '[]');
        });

    // Calculate metrics
    const workingDays = moment(month, 'YYYY-MM').daysInMonth();
    const presentDays = attendanceRecords.filter(r => r.status !== 'absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;

    // Scoring (out of 10 for each category)
    const attendanceRate = (presentDays / workingDays) * 100;
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
    const previousMonth = moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM-DD');
    const pastSnapshot = await getSentimentCollection()
        .where('employee_id', '==', employee_id)
        .where('month', '==', previousMonth)
        .limit(1)
        .get();

    let trend = 'stable';
    if (!pastSnapshot.empty) {
        const pastScore = pastSnapshot.docs[0].data().overall_score;
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

        // Get unique employee IDs from attendance
        const attendanceSnapshot = await getAttendanceCollection().get();
        const employeeIds = [...new Set(attendanceSnapshot.docs.map(doc => doc.data().employee_id))];

        const results = [];

        for (const employee_id of employeeIds) {
            // Check if sentiment already exists
            const existingSnapshot = await getSentimentCollection()
                .where('employee_id', '==', employee_id)
                .where('month', '==', month)
                .limit(1)
                .get();

            if (!existingSnapshot.empty) {
                results.push({
                    employee_id,
                    status: 'already_exists'
                });
                continue;
            }

            // Calculate sentiment
            const sentimentData = await calculateSentiment(employee_id, month);

            const sentiment = {
                employee_id,
                month,
                ...sentimentData,
                report_pdf_url: null, // Generated separately
                created_at: new Date()
            };

            const sentimentId = uuidv4();
            await getSentimentCollection().doc(sentimentId).set(sentiment);

            // Trigger Alert if high risk
            if (sentiment.risk_level === 'high') {
                await getNotificationsCollection().add({
                    type: 'AI_RISK_ALERT',
                    employee_id,
                    title: 'Alerte de risque élevé (IA)',
                    message: `L'employé a un score de sentiment de ${sentiment.overall_score.toFixed(0)}/100. Une intervention est suggérée.`,
                    sentiment_id: sentimentId,
                    created_at: new Date(),
                    read: false
                });
            }

            results.push({
                employee_id,
                sentiment_id: sentimentId,
                status: 'generated',
                overall_score: sentiment.overall_score,
                sentiment: sentiment.sentiment
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

        let query = getSentimentCollection();

        if (month) {
            query = query.where('month', '==', month);
        }

        if (employee_id) {
            query = query.where('employee_id', '==', employee_id);
        }

        const snapshot = await query.get();
        let sentiments = snapshot.docs.map(doc => ({
            sentiment_id: doc.id,
            ...doc.data()
        }));

        // Sort in-memory to avoid missing index errors in Firestore
        sentiments.sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
            const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
            return dateB - dateA; // Descending
        });

        res.json({
            success: true,
            count: sentiments.length,
            sentiments
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

        let query = getSentimentCollection()
            .where('risk_level', '==', 'high');

        const snapshot = await query.get();
        let alerts = snapshot.docs.map(doc => ({
            sentiment_id: doc.id,
            ...doc.data()
        }));

        // Month filtering (in-memory) to avoid composite index requirement
        if (month) {
            alerts = alerts.filter(a => a.month === month);
        }

        // Sort by score (critical first)
        alerts.sort((a, b) => a.overall_score - b.overall_score);

        res.json({
            success: true,
            count: alerts.length,
            alerts
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
        const employeeId = req.user.employee_id || req.user.uid;

        const snapshot = await getSentimentCollection()
            .where('employee_id', '==', employeeId)
            .get();

        const history = snapshot.docs.map(doc => ({
            sentiment_id: doc.id,
            ...doc.data()
        }));

        history.sort((a, b) => b.month.localeCompare(a.month));

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
        const snapshot = await getSentimentCollection()
            .where('employee_id', '==', req.params.employee_id)
            .get();

        const history = snapshot.docs.map(doc => ({
            sentiment_id: doc.id,
            ...doc.data()
        }));

        // Sort in-memory and then limit
        history.sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(a.created_at || 0);
            const dateB = b.created_at?.toDate?.() || new Date(b.created_at || 0);
            return dateB - dateA; // Descending
        });

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
        const empDoc = await getEmployeesCollection().doc(employee_id).get();
        if (!empDoc.exists) return res.status(404).json({ success: false, message: 'Employee not found' });
        const employeeData = empDoc.data();

        const snapshot = await getSentimentCollection()
            .where('employee_id', '==', employee_id)
            .get();

        const history = snapshot.docs.map(doc => doc.data());
        history.sort((a, b) => a.month.localeCompare(b.month));

        if (history.length === 0) return res.status(404).json({ success: false, message: 'No analysis history found' });

        const doc = generateSentimentPDF(history[history.length - 1], employeeData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Behavioral_${employeeData.lastName}.pdf"`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed', error: error.message });
    }
});

module.exports = router;
