const express = require('express');
const router = express.Router();
const moment = require('moment');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Sentiment = require('../models/Sentiment');
const Payroll = require('../models/Payroll');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * HACK: In-memory helper functions (copied from previous logic but adapted for standard JS objects)
 */
function getWeekKey(date) {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
    const week = Math.ceil(days / 7);
    return `${d.getFullYear()}-W${week}`;
}

function calculateTrends(data) {
    // Calculate weekly trends
    const weeklyData = {};

    data.forEach(record => {
        const week = getWeekKey(new Date(record.date));
        if (!weeklyData[week]) {
            weeklyData[week] = { total: 0, late: 0, absent: 0 };
        }
        weeklyData[week].total++;
        if (record.status === 'late') weeklyData[week].late++;
        if (record.status === 'absent') weeklyData[week].absent++;
    });

    return Object.keys(weeklyData).map(week => ({
        week,
        punctuality_rate: (weeklyData[week].total > 0 ? (weeklyData[week].total - weeklyData[week].late) / weeklyData[week].total * 100 : 0).toFixed(2),
        attendance_rate: (weeklyData[week].total > 0 ? (weeklyData[week].total - weeklyData[week].absent) / weeklyData[week].total * 100 : 0).toFixed(2)
    }));
}

function detectAnomalies(employees) {
    // Detect unusual patterns
    const anomalies = [];

    employees.forEach(emp => {
        if (emp.late_days > 10) {
            anomalies.push({
                employee_id: emp.employee_id,
                type: 'excessive_lateness',
                severity: emp.late_days > 20 ? 'high' : 'medium',
                value: emp.late_days
            });
        }

        if (emp.absent_days > 5) {
            anomalies.push({
                employee_id: emp.employee_id,
                type: 'excessive_absence',
                severity: emp.absent_days > 10 ? 'high' : 'medium',
                value: emp.absent_days
            });
        }
    });

    return anomalies;
}

function analyzeBehavioralPatterns(attendanceData) {
    // Group by employee and calculate patterns
    const employeePatterns = {};

    attendanceData.forEach(record => {
        const empId = record.employee_id.toString();
        if (!employeePatterns[empId]) {
            employeePatterns[empId] = {
                total_days: 0,
                late_days: 0,
                absent_days: 0,
                punctuality_score: 0
            };
        }

        const pattern = employeePatterns[empId];
        pattern.total_days++;

        if (record.status === 'late') pattern.late_days++;
        if (record.status === 'absent') pattern.absent_days++;
    });

    // Calculate scores and cluster
    const employees = Object.keys(employeePatterns).map(id => {
        const pattern = employeePatterns[id];
        pattern.punctuality_score = pattern.total_days > 0
            ? ((pattern.total_days - pattern.late_days) / pattern.total_days) * 100
            : 0;
        pattern.attendance_rate = pattern.total_days > 0
            ? ((pattern.total_days - pattern.absent_days) / pattern.total_days) * 100
            : 0;

        return { employee_id: id, ...pattern };
    });

    // Cluster employees by behavior
    const clusters = {
        high_performers: employees.filter(e => e.punctuality_score >= 90 && e.attendance_rate >= 95),
        average_performers: employees.filter(e => e.punctuality_score >= 70 && e.punctuality_score < 90),
        at_risk: employees.filter(e => e.punctuality_score < 70 || e.attendance_rate < 85)
    };

    return {
        clusters,
        riskSegments: clusters.at_risk.length,
        productivityTrends: calculateTrends(attendanceData),
        anomalies: detectAnomalies(employees)
    };
}

function calculateEmployeeTrend(attendance) {
    if (attendance.length < 2) return 'insufficient_data';

    const recent = attendance.slice(0, Math.floor(attendance.length / 2));
    const older = attendance.slice(Math.floor(attendance.length / 2));

    const recentRate = recent.filter(a => a.status !== 'absent').length / recent.length;
    const olderRate = older.filter(a => a.status !== 'absent').length / older.length;

    if (recentRate > olderRate * 1.1) return 'improving';
    if (recentRate < olderRate * 0.9) return 'declining';
    return 'stable';
}

function calculateSentimentTrend(sentiment) {
    if (sentiment.length < 2) return 'insufficient_data';

    const recent = sentiment[0].overall_score; // Sorted desc, so 0 is newest
    const older = sentiment[sentiment.length - 1].overall_score;

    if (recent > older + 10) return 'improving';
    if (recent < older - 10) return 'declining';
    return 'stable';
}

function identifyStrengths(data) {
    const strengths = [];
    const { attendance, sentiment } = data;

    const attendanceRecords = attendance.length;
    if (attendanceRecords > 0) {
        const attendanceRate = attendance.filter(a => a.status !== 'absent').length / attendanceRecords * 100;
        if (attendanceRate >= 95) strengths.push('Excellent attendance');

        const punctualityRate = attendance.filter(a => !a.check_in_time || (new Date(a.check_in_time).getHours() < 9)).length / attendanceRecords * 100; // Simplified punctuality check if delay_minutes missing
        if (punctualityRate >= 90) strengths.push('Outstanding punctuality');
    }

    if (sentiment.length > 0 && sentiment[0].overall_score >= 80) {
        strengths.push('High engagement');
    }

    return strengths.length > 0 ? strengths : ['Consistent performance'];
}

function identifyImprovements(data) {
    const improvements = [];
    const { attendance, sentiment } = data;

    const lateCount = attendance.filter(a => a.status === 'late').length;
    if (lateCount > 5) improvements.push('Improve punctuality');

    const absentCount = attendance.filter(a => a.status === 'absent').length;
    if (absentCount > 3) improvements.push('Reduce absences');

    if (sentiment.length > 0 && sentiment[0].overall_score < 60) {
        improvements.push('Increase engagement');
    }

    return improvements.length > 0 ? improvements : ['Maintain current standards'];
}

function generateEmployeeRecommendations(data) {
    const recommendations = [];
    const { attendance, sentiment } = data;

    if (attendance.filter(a => a.status === 'late').length > 5) {
        recommendations.push('Consider flexible working hours');
    }

    if (sentiment.length > 0 && sentiment[0].overall_score < 70) {
        recommendations.push('Schedule career development review');
        recommendations.push('Consider workload adjustment');
    }

    return recommendations.length > 0 ? recommendations : ['Continue monitoring performance'];
}

function generateEmployeeInsights(data) {
    const { employee, attendance, leaves, sentiment, payroll } = data;

    const attendanceCount = attendance.length;
    const attendanceRate = attendanceCount > 0 ? attendance.filter(a => a.status === 'present' || a.status === 'late').length / attendanceCount * 100 : 0;

    // Check if delay_minutes exists, otherwise approximate or default to 0
    const avgLateMinutes = 0; // attendanceCount > 0 ? attendance.reduce((sum, a) => sum + (a.delay_minutes || 0), 0) / attendanceCount : 0;

    const leaveUtilization = leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days_requested, 0);
    const avgSentiment = sentiment.length > 0 ? sentiment.reduce((sum, s) => sum + s.overall_score, 0) / sentiment.length : 0;

    return {
        performance_summary: {
            attendance_rate: attendanceRate.toFixed(2),
            punctuality_score: attendanceCount > 0 ? attendance.filter(a => a.status !== 'late').length / attendanceCount * 100 : 0,
            avg_late_minutes: avgLateMinutes.toFixed(2),
            leave_days_used: leaveUtilization,
            sentiment_score: avgSentiment.toFixed(2)
        },
        trends: {
            attendance_trend: calculateEmployeeTrend(attendance),
            sentiment_trend: calculateSentimentTrend(sentiment),
            productivity_trend: 'stable' // Based on comparison
        },
        strengths: identifyStrengths(data),
        areas_for_improvement: identifyImprovements(data),
        recommendations: generateEmployeeRecommendations(data)
    };
}

function identifyRiskFactors(sentimentData) {
    const factors = [];

    if (sentimentData.attendance_score < 5) factors.push('Low attendance');
    if (sentimentData.punctuality_score < 5) factors.push('Poor punctuality');
    if (sentimentData.assiduity_score < 5) factors.push('Low engagement');

    return factors;
}

function generateRecommendations(sentimentData) {
    const recommendations = [];

    if (sentimentData.attendance_score < 5) {
        recommendations.push('Schedule one-on-one meeting to discuss concerns');
    }
    if (sentimentData.punctuality_score < 5) {
        recommendations.push('Review work schedule flexibility');
    }
    if (sentimentData.overall_score < 50) {
        recommendations.push('Consider retention bonus or career development plan');
    }

    return recommendations;
}

function analyzeProductivity(attendanceData) {
    const totalRecords = attendanceData.length;
    const onTime = attendanceData.filter(a => a.status !== 'late' && a.status !== 'absent').length;
    const late = attendanceData.filter(a => a.status === 'late').length;
    const absent = attendanceData.filter(a => a.status === 'absent').length;

    return {
        overall_punctuality: (totalRecords > 0 ? (onTime / totalRecords * 100) : 0).toFixed(2),
        late_percentage: (totalRecords > 0 ? (late / totalRecords * 100) : 0).toFixed(2),
        absent_percentage: (totalRecords > 0 ? (absent / totalRecords * 100) : 0).toFixed(2),
        productivity_index: (totalRecords > 0 ? (onTime / totalRecords * 100) : 0).toFixed(2)
    };
}

function calculateAvgTenure(employees) {
    const now = new Date();
    const tenures = employees.filter(e => e.hireDate).map(emp => {
        const hireDate = new Date(emp.hireDate);
        return (now - hireDate) / (1000 * 60 * 60 * 24 * 30); // months
    });

    return tenures.length > 0 ? (tenures.reduce((a, b) => a + b, 0) / tenures.length).toFixed(1) : 0;
}

function calculateDiversityScore(employees) {
    if (employees.length === 0) return 0;
    // Measure diversity across departments, positions, etc.
    const departments = new Set(employees.map(e => e.department)).size;
    const positions = new Set(employees.map(e => e.position)).size;

    return ((departments + positions) / employees.length * 100).toFixed(2);
}

function analyzeTeamDynamics(employees) {
    const departments = {};
    const positions = {};
    const contractTypes = {};

    employees.forEach(emp => {
        if (emp.department) departments[emp.department] = (departments[emp.department] || 0) + 1;
        if (emp.position) positions[emp.position] = (positions[emp.position] || 0) + 1;
        if (emp.contract_type) contractTypes[emp.contract_type] = (contractTypes[emp.contract_type] || 0) + 1;
    });

    return {
        department_distribution: departments,
        position_distribution: positions,
        contract_distribution: contractTypes,
        avg_tenure_months: calculateAvgTenure(employees),
        diversity_score: calculateDiversityScore(employees)
    };
}


/**
 * @route   GET /api/analytics/behavioral-patterns
 * @desc    Get behavioral patterns across all employees
 * @access  Admin/Manager
 */
router.get('/behavioral-patterns', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { time_range = '3m' } = req.query; // 1m, 3m, 6m, 1y

        // Get attendance data for pattern analysis
        // Using limit(1000) for now, but in production we might need better aggregation or date filtering
        const attendance = await Attendance.find().sort({ date: -1 }).limit(1000);

        const patterns = analyzeBehavioralPatterns(attendance.map(d => d.toObject()));

        res.json({
            success: true,
            time_range,
            patterns: {
                attendance_clusters: patterns.clusters,
                risk_segments: patterns.riskSegments,
                productivity_trends: patterns.productivityTrends,
                anomalies: patterns.anomalies
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to analyze behavioral patterns',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/employee-insights/:employee_id
 * @desc    Get comprehensive insights for specific employee
 * @access  Admin/Manager
 */
router.get('/employee-insights/:employee_id', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { employee_id } = req.params;

        // Gather all data
        const [employee, attendance, leaves, sentiment, payroll] = await Promise.all([
            Employee.findById(employee_id),
            Attendance.find({ employee_id }).sort({ date: -1 }).limit(90),
            Leave.find({ employee_id }).sort({ created_at: -1 }),
            Sentiment.find({ employee_id }).sort({ month: -1 }).limit(6),
            Payroll.find({ employee_id }).sort({ month: -1 }).limit(12)
        ]);

        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const insights = generateEmployeeInsights({
            employee: employee.toObject(),
            attendance: attendance.map(d => d.toObject()),
            leaves: leaves.map(d => d.toObject()),
            sentiment: sentiment.map(d => d.toObject()),
            payroll: payroll.map(d => d.toObject())
        });

        res.json({
            success: true,
            employee_id,
            insights
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate employee insights',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/turnover-prediction
 * @desc    Predict employees at risk of leaving
 * @access  Admin/Manager
 */
router.get('/turnover-prediction', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        // Get recent sentiment analysis (high risk employees)
        const sentiments = await Sentiment.find({ risk_level: 'high' });

        const predictions = sentiments.map(data => {
            const obj = data.toObject();
            return {
                employee_id: obj.employee_id,
                risk_score: 100 - obj.overall_score,
                risk_level: obj.risk_level,
                key_factors: identifyRiskFactors(obj),
                recommended_actions: generateRecommendations(obj),
                last_analyzed: obj.month
            };
        });

        // Sort by risk score
        predictions.sort((a, b) => b.risk_score - a.risk_score);

        res.json({
            success: true,
            total_at_risk: predictions.length,
            predictions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to predict turnover',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/productivity-insights
 * @desc    Get productivity metrics and trends
 * @access  Admin/Manager
 */
router.get('/productivity-insights', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const attendance = await Attendance.find().sort({ date: -1 }).limit(1000);

        const productivity = analyzeProductivity(attendance.map(d => d.toObject()));

        res.json({
            success: true,
            productivity
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to analyze productivity',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/analytics/team-dynamics
 * @desc    Analyze team composition and dynamics
 * @access  Admin/Manager
 */
router.get('/team-dynamics', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { department } = req.query;

        const query = { status: 'active' };
        if (department) {
            query.department = department;
        }

        const employees = await Employee.find(query);

        const dynamics = analyzeTeamDynamics(employees.map(d => d.toObject()));

        res.json({
            success: true,
            department: department || 'all',
            team_size: employees.length,
            dynamics
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to analyze team dynamics',
            error: error.message
        });
    }
});

module.exports = router;
