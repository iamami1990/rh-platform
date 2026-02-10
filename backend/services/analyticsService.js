const moment = require('moment');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const Sentiment = require('../models/Sentiment');

/**
 * Get date range from time_range parameter
 */
const getDateRange = (time_range = '3months') => {
    const endDate = moment().format('YYYY-MM-DD');
    let startDate;

    switch (time_range) {
        case '1month': startDate = moment().subtract(1, 'month').format('YYYY-MM-DD'); break;
        case '6months': startDate = moment().subtract(6, 'months').format('YYYY-MM-DD'); break;
        case '1year': startDate = moment().subtract(1, 'year').format('YYYY-MM-DD'); break;
        default: startDate = moment().subtract(3, 'months').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
};

/**
 * Behavioral patterns analysis
 */
const getBehavioralPatterns = async (time_range) => {
    const { startDate, endDate } = getDateRange(time_range);

    const records = await Attendance.find({
        date: { $gte: startDate, $lte: endDate }
    }).populate('employee', 'firstName lastName department');

    // Cluster by check-in time
    const timeSlots = { 'early': 0, 'on_time': 0, 'slightly_late': 0, 'late': 0 };
    records.forEach(r => {
        if (!r.check_in_time) return;
        const hour = new Date(r.check_in_time).getHours();
        if (hour < 8) timeSlots.early++;
        else if (hour === 8) timeSlots.on_time++;
        else if (hour === 9) timeSlots.slightly_late++;
        else timeSlots.late++;
    });

    // Check-in trends by day of week
    const dayDistribution = {};
    records.forEach(r => {
        const day = moment(r.date).format('dddd');
        if (!dayDistribution[day]) dayDistribution[day] = { present: 0, absent: 0, late: 0 };
        if (r.status === 'present') dayDistribution[day].present++;
        else if (r.status === 'absent') dayDistribution[day].absent++;
        else if (r.status === 'late') dayDistribution[day].late++;
    });

    // Anomalies
    const employeeStats = {};
    records.forEach(r => {
        const empId = r.employee?._id?.toString();
        if (!empId) return;
        if (!employeeStats[empId]) {
            employeeStats[empId] = { name: `${r.employee.firstName} ${r.employee.lastName}`, lateCount: 0, absentCount: 0, total: 0 };
        }
        employeeStats[empId].total++;
        if (r.status === 'late') employeeStats[empId].lateCount++;
        if (r.status === 'absent') employeeStats[empId].absentCount++;
    });

    const anomalies = Object.values(employeeStats)
        .filter(s => s.lateCount > 5 || s.absentCount > 3)
        .map(s => ({ ...s, late_rate: ((s.lateCount / s.total) * 100).toFixed(1) + '%' }));

    return { time_range, period: { start: startDate, end: endDate }, check_in_clusters: timeSlots, day_distribution: dayDistribution, anomalies };
};

/**
 * Employee insights
 */
const getEmployeeInsights = async (employeeId, time_range) => {
    const { startDate, endDate } = getDateRange(time_range);

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }

    const attendanceRecords = await Attendance.find({
        employee: employeeId,
        date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    const leaveRecords = await Leave.find({
        employee: employeeId,
        status: 'approved',
        start_date: { $lte: endDate },
        end_date: { $gte: startDate }
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const leaveDays = leaveRecords.reduce((sum, l) => sum + (l.days_requested || 0), 0);

    // Monthly trend
    const monthlyTrend = {};
    attendanceRecords.forEach(r => {
        const m = moment(r.date).format('YYYY-MM');
        if (!monthlyTrend[m]) monthlyTrend[m] = { present: 0, late: 0, absent: 0 };
        if (r.status === 'present') monthlyTrend[m].present++;
        else if (r.status === 'late') monthlyTrend[m].late++;
        else if (r.status === 'absent') monthlyTrend[m].absent++;
    });

    // Strengths and improvements
    const strengths = [];
    const improvements = [];
    const recommendations = [];

    const attendanceRate = totalDays > 0 ? (presentDays / totalDays * 100) : 0;
    const lateRate = presentDays > 0 ? (lateDays / presentDays * 100) : 0;

    if (attendanceRate >= 95) strengths.push('Excellent taux de présence');
    else if (attendanceRate < 80) improvements.push('Taux de présence à améliorer');

    if (lateRate <= 5) strengths.push('Excellente ponctualité');
    else if (lateRate > 20) improvements.push('Ponctualité à améliorer');

    if (absentDays === 0) strengths.push('Aucune absence non justifiée');
    if (absentDays > 5) {
        improvements.push('Absences fréquentes');
        recommendations.push('Entretien individuel recommandé');
    }

    return {
        employee: { id: employee._id, name: `${employee.firstName} ${employee.lastName}`, department: employee.department },
        period: { start: startDate, end: endDate },
        performance: { attendance_rate: attendanceRate.toFixed(1), late_rate: lateRate.toFixed(1), present_days: presentDays, late_days: lateDays, absent_days: absentDays, leave_days: leaveDays },
        monthly_trend: monthlyTrend,
        strengths,
        improvements,
        recommendations
    };
};

/**
 * Turnover prediction based on sentiment
 */
const getTurnoverPrediction = async () => {
    const latestMonth = moment().subtract(1, 'month').format('YYYY-MM');
    const sentiments = await Sentiment.find({ month: latestMonth, risk_level: 'high' })
        .populate('employee', 'firstName lastName department position hireDate');

    return sentiments.map(s => ({
        employee: s.employee ? { id: s.employee._id, name: `${s.employee.firstName} ${s.employee.lastName}`, department: s.employee.department, position: s.employee.position, tenure: moment().diff(moment(s.employee.hireDate), 'months') + ' mois' } : null,
        risk_score: s.overall_score,
        risk_level: s.risk_level,
        factors: s.recommendations
    }));
};

/**
 * Productivity insights
 */
const getProductivityInsights = async (time_range) => {
    const { startDate, endDate } = getDateRange(time_range);

    const employees = await Employee.find({ status: 'active' }).lean();
    const departmentStats = {};

    for (const emp of employees) {
        const dept = emp.department || 'Other';
        if (!departmentStats[dept]) departmentStats[dept] = { employees: 0, present: 0, late: 0, absent: 0 };
        departmentStats[dept].employees++;

        const records = await Attendance.find({
            employee: emp._id,
            date: { $gte: startDate, $lte: endDate }
        });

        records.forEach(r => {
            if (r.status === 'present') departmentStats[dept].present++;
            else if (r.status === 'late') departmentStats[dept].late++;
            else if (r.status === 'absent') departmentStats[dept].absent++;
        });
    }

    // Add rates
    Object.keys(departmentStats).forEach(dept => {
        const s = departmentStats[dept];
        const total = s.present + s.late + s.absent;
        s.attendance_rate = total > 0 ? ((s.present / total) * 100).toFixed(1) + '%' : '0%';
        s.punctuality_rate = (s.present + s.late) > 0 ? ((s.present / (s.present + s.late)) * 100).toFixed(1) + '%' : '0%';
    });

    return { period: { start: startDate, end: endDate }, departments: departmentStats };
};

/**
 * Team dynamics
 */
const getTeamDynamics = async () => {
    const employees = await Employee.find({ status: 'active' }).lean();

    const departmentDistribution = {};
    const positionDistribution = {};
    const tenureBuckets = { '0-1 year': 0, '1-3 years': 0, '3-5 years': 0, '5+ years': 0 };
    let genderStats = { male: 0, female: 0, other: 0 };

    employees.forEach(emp => {
        // Department
        departmentDistribution[emp.department || 'Other'] = (departmentDistribution[emp.department || 'Other'] || 0) + 1;
        // Position
        positionDistribution[emp.position || 'Other'] = (positionDistribution[emp.position || 'Other'] || 0) + 1;
        // Tenure
        const years = moment().diff(moment(emp.hireDate), 'years');
        if (years < 1) tenureBuckets['0-1 year']++;
        else if (years < 3) tenureBuckets['1-3 years']++;
        else if (years < 5) tenureBuckets['3-5 years']++;
        else tenureBuckets['5+ years']++;
        // Gender
        if (emp.gender === 'male' || emp.gender === 'homme') genderStats.male++;
        else if (emp.gender === 'female' || emp.gender === 'femme') genderStats.female++;
        else genderStats.other++;
    });

    return {
        total_employees: employees.length,
        department_distribution: departmentDistribution,
        position_distribution: positionDistribution,
        tenure_distribution: tenureBuckets,
        diversity: genderStats
    };
};

module.exports = {
    getBehavioralPatterns,
    getEmployeeInsights,
    getTurnoverPrediction,
    getProductivityInsights,
    getTeamDynamics,
    getDateRange
};
