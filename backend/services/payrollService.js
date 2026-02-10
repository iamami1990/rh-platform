const moment = require('moment');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Overtime = require('../models/Overtime');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ExcelJS = require('exceljs');
const { generatePayrollPDF } = require('../utils/pdfGenerator');
const { generateSEPAXML } = require('../utils/sepaGenerator');
const { sendEmail } = require('../utils/emailService');

// Working hours config (reuse from overtimeService constants)
const WORKING_DAYS_PER_MONTH = parseInt(process.env.WORKING_DAYS_PER_MONTH || '22');
const HOURS_PER_DAY = parseInt(process.env.HOURS_PER_DAY || '8');

// Tunisian employer CNSS rate
const CNSS_EMPLOYER_RATE = parseFloat(process.env.CNSS_EMPLOYER_RATE || '0.1657');

/**
 * IRPP 2025 Scale (Tunisia Finance Act 2025) – 8 progressive tranches
 */
const calculateIRPP2025 = (annualIncome) => {
    if (annualIncome <= 5000) return 0;

    let tax = 0;
    const tranches = [
        { limit: 5000, rate: 0 },
        { limit: 10000, rate: 0.15 },
        { limit: 20000, rate: 0.25 },
        { limit: 30000, rate: 0.30 },
        { limit: 40000, rate: 0.33 },
        { limit: 50000, rate: 0.36 },
        { limit: 70000, rate: 0.38 },
        { limit: Infinity, rate: 0.40 }
    ];

    let previousLimit = 0;
    for (const tranche of tranches) {
        if (annualIncome > previousLimit) {
            const taxableInThisTranche = Math.min(annualIncome, tranche.limit) - previousLimit;
            tax += taxableInThisTranche * tranche.rate;
            previousLimit = tranche.limit;
        } else {
            break;
        }
    }
    return tax;
};

/**
 * Calculate seniority bonus (Tunisian convention)
 */
const calculateSeniorityBonus = (hireDate, baseSalary) => {
    if (!hireDate) return 0;
    const years = moment().diff(moment(hireDate), 'years');
    if (years >= 20) return baseSalary * 0.20;
    if (years >= 15) return baseSalary * 0.15;
    if (years >= 10) return baseSalary * 0.10;
    if (years >= 5) return baseSalary * 0.05;
    if (years >= 2) return baseSalary * 0.03;
    return 0;
};

/**
 * Calculate payroll for a single employee for a given month
 */
const calculatePayroll = async (employee_id, month) => {
    const employee = await Employee.findById(employee_id);
    if (!employee) throw new Error('Employee not found');

    const startDate = moment(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
    const endDate = moment(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

    const attendanceRecords = await Attendance.find({
        employee: employee_id,
        date: { $gte: startDate, $lte: endDate }
    });

    const workingDays = WORKING_DAYS_PER_MONTH;
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;

    const base_salary = Number(employee.salary_brut || 0);

    // Overtime
    const overtimeRecords = await Overtime.find({ employee_id, month, status: 'approved' });

    let overtime_pay = 0;
    let overtime_hours = 0;
    const overtimeDetails = [];

    overtimeRecords.forEach(ot => {
        const baseHourlyRate = base_salary / (WORKING_DAYS_PER_MONTH * HOURS_PER_DAY);
        let rateMultiplier = 1.25;
        if (ot.rate_type === '150%') rateMultiplier = 1.5;
        if (ot.rate_type === '200%') rateMultiplier = 2.0;

        const amount = baseHourlyRate * ot.hours * rateMultiplier;
        overtime_pay += amount;
        overtime_hours += ot.hours;
        overtimeDetails.push({ date: ot.date, hours: ot.hours, rate_type: ot.rate_type, amount, reason: ot.reason });
    });

    const bonuses = {
        seniority: calculateSeniorityBonus(employee.hireDate, base_salary),
        attendance: (lateDays === 0 && absentDays === 0) ? base_salary * 0.05 : 0,
        other: 0
    };
    const total_bonuses = Object.values(bonuses).reduce((a, b) => Number(a) + Number(b), 0);

    const allowances = {
        transport: Number(employee.transport_allowance || 60),
        prime_presence: 5.850,
        other: 0
    };
    const total_allowances = Object.values(allowances).reduce((a, b) => Number(a) + Number(b), 0);

    const total_gross = Number(base_salary) + Number(overtime_pay) + Number(total_bonuses) + Number(total_allowances);

    // Tunisian deductions
    const cnss = total_gross * 0.0918;
    const taxable_income = total_gross - cnss;
    const monthly_prof_expenses = Math.min(taxable_income * 0.10, 2000 / 12);

    let annual_family_deducted = 0;
    if (employee.marital_status === 'married' || employee.marital_status === 'marié') {
        annual_family_deducted += 300;
    }
    annual_family_deducted += Math.min(parseInt(employee.children_count || 0), 4) * 100;

    const annual_taxable_base = (taxable_income - monthly_prof_expenses) * 12 - annual_family_deducted;
    const annual_irpp = calculateIRPP2025(annual_taxable_base);
    const irpp = annual_irpp / 12;
    const css = irpp * 0.005;

    let absence_deduction = 0;
    if (absentDays > 0) {
        absence_deduction = (base_salary / workingDays) * absentDays;
    }

    const deductions = { cnss, irpp, css, absenteeism: absence_deduction, other: 0 };
    const total_deductions = Object.values(deductions).reduce((a, b) => Number(a) + Number(b), 0);
    const net_salary = Number(total_gross) - Number(total_deductions);

    return {
        gross_salary: base_salary, overtime_hours, overtime_pay, overtime_details: overtimeDetails,
        total_gross, bonuses, allowances, deductions, total_deductions, net_salary,
        working_days: workingDays, present_days: presentDays, absent_days: absentDays, late_days: lateDays,
        tax_details: { annual_taxable_base, annual_irpp, monthly_irpp: irpp, css }
    };
};

/**
 * Generate payroll for all active employees for a month
 */
const generateMonthlyPayroll = async (month) => {
    if (!month) {
        const err = new Error('Please provide month in YYYY-MM format');
        err.statusCode = 400;
        throw err;
    }

    const employees = await Employee.find({ status: 'active' });
    const results = [];

    for (const employee of employees) {
        const employee_id = employee._id;
        const existingPayroll = await Payroll.findOne({ employee: employee_id, month });

        if (existingPayroll) {
            results.push({ employee_id, status: 'already_exists' });
            continue;
        }

        const payrollData = await calculatePayroll(employee_id, month);

        const newPayroll = new Payroll({
            employee: employee_id,
            employee_id,
            employee_name: `${employee.firstName} ${employee.lastName}`,
            month,
            ...payrollData,
            pdf_url: null,
            status: 'generated',
            generated_at: new Date(),
            paid_at: null
        });

        await newPayroll.save();

        // Notify employee
        const user = await User.findOne({ $or: [{ employee: employee_id }, { employee_id }] }).select('_id');
        if (user) {
            await Notification.create({
                user: user._id,
                title: 'Bulletin de paie disponible',
                body: `Votre bulletin de paie pour ${month} est disponible.`,
                type: 'info',
                data: { payroll_id: newPayroll._id, month }
            });
        }

        results.push({ employee_id, payroll_id: newPayroll._id, status: 'generated', net_salary: newPayroll.net_salary });
    }

    return results;
};

/**
 * Format payroll for API response
 */
const formatPayroll = (p) => ({
    payroll_id: p._id,
    base_salary: p.gross_salary,
    bonuses_total: Object.values(p.bonuses || {}).reduce((a, b) => Number(a) + Number(b), 0),
    deductions_total: Object.values(p.deductions || {}).reduce((a, b) => Number(a) + Number(b), 0),
    ...p.toObject()
});

/**
 * Get payrolls for a specific employee
 */
const getMyPayrolls = async (employeeId) => {
    const payrolls = await Payroll.find({ employee: employeeId }).sort({ month: -1 });
    return payrolls.map(formatPayroll);
};

/**
 * Get all payrolls with filters
 */
const getPayrolls = async (filters = {}) => {
    const { month, employee_id } = filters;
    const query = {};
    if (month) query.month = month;
    if (employee_id) query.employee = employee_id;

    const payrolls = await Payroll.find(query).sort({ generated_at: -1 });
    return payrolls.map(formatPayroll);
};

/**
 * Get payroll summary report for a month
 */
const getPayrollReport = async (month) => {
    if (!month) {
        const err = new Error('Please provide month parameter');
        err.statusCode = 400;
        throw err;
    }

    const payrolls = await Payroll.find({ month });
    return {
        month,
        total_employees: payrolls.length,
        total_gross: payrolls.reduce((sum, p) => sum + Number(p.total_gross || 0), 0),
        total_deductions: payrolls.reduce((sum, p) => sum + Number(p.total_deductions || 0), 0),
        total_net: payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0),
        total_cnss: payrolls.reduce((sum, p) => sum + Number(p.deductions?.cnss || 0), 0),
        total_tax: payrolls.reduce((sum, p) => sum + Number(p.deductions?.irpp || 0), 0)
    };
};

/**
 * Get payroll by ID
 */
const getPayrollById = async (id) => {
    const payroll = await Payroll.findById(id);
    if (!payroll) {
        const err = new Error('Payroll not found');
        err.statusCode = 404;
        throw err;
    }
    return formatPayroll(payroll);
};

/**
 * CNSS statutory report for a month
 */
const getCNSSReport = async (month) => {
    const payrolls = await Payroll.find({ month }).lean();
    return {
        period: month,
        total_salaries: payrolls.reduce((s, p) => s + p.total_gross, 0),
        employee_share: payrolls.reduce((s, p) => s + p.deductions.cnss, 0),
        employer_share: payrolls.reduce((s, p) => s + p.total_gross * CNSS_EMPLOYER_RATE, 0),
        total_payable: payrolls.reduce((s, p) => s + p.deductions.cnss, 0) +
            payrolls.reduce((s, p) => s + p.total_gross * CNSS_EMPLOYER_RATE, 0)
    };
};

module.exports = {
    calculatePayroll,
    calculateIRPP2025,
    calculateSeniorityBonus,
    generateMonthlyPayroll,
    getMyPayrolls,
    getPayrolls,
    getPayrollReport,
    getPayrollById,
    getCNSSReport,
    formatPayroll,
    WORKING_DAYS_PER_MONTH,
    CNSS_EMPLOYER_RATE
};
