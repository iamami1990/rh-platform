const moment = require('moment');
const Sentiment = require('../models/Sentiment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Calculate sentiment score for a single employee for a given month
 */
const calculateSentiment = (metrics) => {
    const { working_days, present_days, absent_days, late_days, leave_days } = metrics;

    // Attendance score (0-10)
    const attendance_rate = working_days > 0 ? (present_days / working_days) * 100 : 0;
    const attendance_score = Math.min(10, (attendance_rate / 10));

    // Punctuality score (0-10)
    const late_rate = present_days > 0 ? (late_days / present_days) * 100 : 0;
    const punctuality_score = Math.max(0, 10 - (late_rate / 5));

    // Assiduity score (0-10)
    const absence_rate = working_days > 0 ? (absent_days / working_days) * 100 : 0;
    const assiduity_score = Math.max(0, 10 - absence_rate);

    // Workload score (0-10) - based on leave patterns
    const leave_rate = working_days > 0 ? (leave_days / working_days) * 100 : 0;
    const workload_score = leave_rate > 30 ? 4 : leave_rate > 15 ? 6 : 8;

    // Overall score (0-100)
    const overall_score = Math.round(
        (attendance_score * 30 + punctuality_score * 25 + assiduity_score * 25 + workload_score * 20) / 10
    );

    // Determine sentiment
    let sentiment = 'positive';
    if (overall_score < 40) sentiment = 'negative';
    else if (overall_score < 65) sentiment = 'neutral';

    // Risk level
    let risk_level = 'low';
    if (overall_score < 40) risk_level = 'high';
    else if (overall_score < 60) risk_level = 'medium';

    // Generate recommendations
    let recommendations = '';
    if (late_days > 5) recommendations += 'Suivi ponctualité recommandé. ';
    if (absent_days > 3) recommendations += 'Entretien individuel suggéré pour comprendre les absences. ';
    if (overall_score < 50) recommendations += 'Programme d\'accompagnement RH recommandé. ';
    if (overall_score >= 80) recommendations += 'Félicitations et reconnaissance recommandées. ';

    return {
        attendance_score: Math.round(attendance_score * 10) / 10,
        punctuality_score: Math.round(punctuality_score * 10) / 10,
        assiduity_score: Math.round(assiduity_score * 10) / 10,
        workload_score: Math.round(workload_score * 10) / 10,
        overall_score,
        sentiment,
        risk_level,
        recommendations: recommendations.trim(),
        metrics: { working_days, present_days, absent_days, late_days, leave_days, attendance_rate: Math.round(attendance_rate * 10) / 10 }
    };
};

/**
 * Generate sentiment for all employees for a given month
 */
const generateMonthlySentiment = async (month) => {
    if (!month) {
        const err = new Error('Month (YYYY-MM) is required');
        err.statusCode = 400;
        throw err;
    }

    const startDate = moment(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
    const endDate = moment(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');
    const employees = await Employee.find({ status: 'active' });
    const results = [];

    for (const employee of employees) {
        const existing = await Sentiment.findOne({ employee: employee._id, month });
        if (existing) {
            results.push({ employee_id: employee._id, status: 'already_exists' });
            continue;
        }

        const attendanceRecords = await Attendance.find({
            employee: employee._id,
            date: { $gte: startDate, $lte: endDate }
        });

        const leaveRecords = await Leave.find({
            employee: employee._id,
            status: 'approved',
            start_date: { $lte: endDate },
            end_date: { $gte: startDate }
        });

        const working_days = 22;
        const present_days = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const absent_days = attendanceRecords.filter(r => r.status === 'absent').length;
        const late_days = attendanceRecords.filter(r => r.status === 'late').length;
        const leave_days = leaveRecords.reduce((sum, l) => sum + (l.days_requested || 0), 0);

        const sentimentData = calculateSentiment({ working_days, present_days, absent_days, late_days, leave_days });

        // Determine trend
        const previousSentiment = await Sentiment.findOne({
            employee: employee._id,
            month: moment(month, 'YYYY-MM').subtract(1, 'month').format('YYYY-MM')
        });

        let trend = 'stable';
        if (previousSentiment) {
            if (sentimentData.overall_score > previousSentiment.overall_score + 5) trend = 'improving';
            else if (sentimentData.overall_score < previousSentiment.overall_score - 5) trend = 'declining';
        }

        const newSentiment = new Sentiment({
            employee: employee._id,
            employee_id: employee._id,
            month,
            ...sentimentData,
            trend,
            generated_at: new Date()
        });

        await newSentiment.save();

        // Notify if high risk
        if (sentimentData.risk_level === 'high') {
            const user = await User.findOne({ $or: [{ employee: employee._id }, { employee_id: employee._id }] }).select('_id');
            if (user) {
                await Notification.create({
                    user: user._id,
                    title: 'Alerte Sentiment - Risque Elevé',
                    body: `Votre score de satisfaction est de ${sentimentData.overall_score}%. ${sentimentData.recommendations}`,
                    type: 'warning',
                    data: { sentiment_id: newSentiment._id }
                });
            }
        }

        results.push({
            employee_id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            status: 'generated',
            ...sentimentData
        });
    }

    return results;
};

/**
 * Get sentiment records with filters
 */
const getSentiments = async (filters = {}) => {
    const { month, risk_level, department } = filters;
    const query = {};
    if (month) query.month = month;
    if (risk_level) query.risk_level = risk_level;

    let sentiments = await Sentiment.find(query).populate('employee', 'firstName lastName department').sort({ overall_score: 1 });

    if (department) {
        sentiments = sentiments.filter(s => s.employee && s.employee.department === department);
    }

    return sentiments;
};

/**
 * Get sentiment alerts (high risk)
 */
const getSentimentAlerts = async (limit = 10) => {
    return Sentiment.find({ risk_level: 'high' })
        .populate('employee', 'firstName lastName department')
        .sort({ generated_at: -1 })
        .limit(limit);
};

/**
 * Get personal sentiment history
 */
const getPersonalSentiment = async (employeeId, limit = 12) => {
    return Sentiment.find({ employee: employeeId })
        .sort({ month: -1 })
        .limit(limit);
};

module.exports = {
    calculateSentiment,
    generateMonthlySentiment,
    getSentiments,
    getSentimentAlerts,
    getPersonalSentiment
};
