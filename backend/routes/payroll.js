const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const PDFDocument = require('pdfkit');
const { getPayrollCollection, getEmployeesCollection, getAttendanceCollection } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { generatePayrollPDF } = require('../utils/pdfGenerator');
const { generateSEPAXML } = require('../utils/sepaGenerator');
const { sendEmail } = require('../utils/emailService');
const ExcelJS = require('exceljs');

/**
 * Calculate payroll for an employee for a specific month
 */
/**
 * Calculate payroll for an employee for a specific month
 * Implements Tunisian Tax Law (Loi de Finances 2025)
 */
const calculatePayroll = async (employee_id, month) => {
    const empDoc = await getEmployeesCollection().doc(employee_id).get();
    if (!empDoc.exists) throw new Error('Employee not found');
    const employee = empDoc.data();

    const startDate = moment(month, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
    const endDate = moment(month, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

    const attendanceSnapshot = await getAttendanceCollection()
        .where('employee_id', '==', employee_id)
        .get();

    const attendanceRecords = attendanceSnapshot.docs
        .map(doc => doc.data())
        .filter(r => r.date >= startDate && r.date <= endDate);

    const workingDays = 22; // Standard working days/month in Tunisia
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absentDays = attendanceRecords.filter(r => r.status === 'absent').length;
    const lateDays = attendanceRecords.filter(r => r.status === 'late').length;

    const base_salary = Number(employee.salary_brut || 0);

    // ==============================================
    // OVERTIME CALCULATION (Approved only)
    // ==============================================
    const { getOvertimeCollection } = require('../config/database');
    const overtimeSnapshot = await getOvertimeCollection()
        .where('employee_id', '==', employee_id)
        .where('month', '==', month)
        .where('status', '==', 'approved')
        .get();

    let overtime_pay = 0;
    let overtime_hours = 0;
    const overtimeDetails = [];

    overtimeSnapshot.docs.forEach(doc => {
        const ot = doc.data();
        const baseHourlyRate = base_salary / (22 * 8); // 22 jours * 8h
        let rateMultiplier = 1.25; // Default 125%
        if (ot.rate_type === '150%') rateMultiplier = 1.5;
        if (ot.rate_type === '200%') rateMultiplier = 2.0;

        const amount = baseHourlyRate * ot.hours * rateMultiplier;
        overtime_pay += amount;
        overtime_hours += ot.hours;

        overtimeDetails.push({
            date: ot.date,
            hours: ot.hours,
            rate_type: ot.rate_type,
            amount: amount,
            reason: ot.reason
        });
    });
    // ==============================================

    const bonuses = {
        seniority: calculateSeniorityBonus(employee.hireDate, base_salary),
        attendance: (lateDays === 0 && absentDays === 0) ? base_salary * 0.05 : 0,
        other: 0
    };
    const total_bonuses = Object.values(bonuses).reduce((a, b) => Number(a) + Number(b), 0);

    const allowances = {
        transport: Number(employee.transport_allowance || 60), // Standard minimum
        prime_presence: 5.850, // Typical standard fixed bonus
        other: 0
    };
    const total_allowances = Object.values(allowances).reduce((a, b) => Number(a) + Number(b), 0);

    const total_gross = Number(base_salary) + Number(overtime_pay) + Number(total_bonuses) + Number(total_allowances);

    // --- TUNISIAN DEDUCTIONS CALCULATIONS ---

    // 1. CNSS (9.18% for employee)
    const cnss = total_gross * 0.0918;

    // 2. Taxable Income
    const taxable_income = total_gross - cnss;

    // 3. Professional Expenses (10% capped at 2000 TND/year)
    const monthly_prof_expenses = Math.min(taxable_income * 0.10, 2000 / 12);

    // 4. Family Deductions (Annual)
    // Chef de famille: 300, Children: 100 each (up to 4)
    let annual_family_deducted = 0;
    if (employee.marital_status === 'married' || employee.marital_status === 'marié') {
        annual_family_deducted += 300;
    }
    const children_count = parseInt(employee.children_count || 0);
    annual_family_deducted += Math.min(children_count, 4) * 100;

    const monthly_family_deductions = annual_family_deducted / 12;

    // 5. IRPP Calculation (2025 Scale)
    const annual_taxable_base = (taxable_income - monthly_prof_expenses) * 12 - annual_family_deducted;
    const annual_irpp = calculateIRPP2025(annual_taxable_base);
    const irpp = annual_irpp / 12;

    // 6. CSS (Contribution Sociale de Solidarité - 0.5% withheld)
    const css = irpp * 0.005;

    // 7. Absence deduction
    let absence_deduction = 0;
    if (absentDays > 0) {
        absence_deduction = (base_salary / workingDays) * absentDays;
    }

    const deductions = {
        cnss,
        irpp,
        css,
        absenteeism: absence_deduction,
        other: 0
    };

    const total_deductions = Object.values(deductions).reduce((a, b) => Number(a) + Number(b), 0);
    const net_salary = Number(total_gross) - Number(total_deductions);

    return {
        gross_salary: base_salary,
        overtime_hours,
        overtime_pay,
        overtime_details: overtimeDetails,
        total_gross,
        bonuses,
        allowances,
        deductions,
        total_deductions,
        net_salary,
        working_days: workingDays,
        present_days: presentDays,
        absent_days: absentDays,
        late_days: lateDays,
        tax_details: {
            annual_taxable_base,
            annual_irpp,
            monthly_irpp: irpp,
            css
        }
    };
};

/**
 * Calculate seniority bonus (Tunisian standard usually follows convention)
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
 * NEW IRPP 2025 Scale (Tunisia Finance Act 2025)
 * 8 progressive tranches
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
 * @route   POST /api/payroll/generate
 * @desc    Generate payroll for all employees for a month
 * @access  Private (Admin)
 */
router.post('/generate', authenticate, authorize('admin'), auditLogger('Generate Payroll'), async (req, res) => {
    try {
        const { month } = req.body; // Format: YYYY-MM

        if (!month) {
            return res.status(400).json({
                success: false,
                message: 'Please provide month in YYYY-MM format'
            });
        }

        // Get all active employees
        const empSnapshot = await getEmployeesCollection()
            .where('status', '==', 'active')
            .get();

        const results = [];

        for (const empDoc of empSnapshot.docs) {
            const employee_id = empDoc.id;

            // Check if payroll already exists
            const existingSnapshot = await getPayrollCollection()
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

            // Calculate payroll
            const payrollData = await calculatePayroll(employee_id, month);

            const employee = empDoc.data();
            const payroll = {
                employee_id,
                employee_name: `${employee.firstName} ${employee.lastName}`,
                month,
                ...payrollData,
                pdf_url: null, // Generated separately
                status: 'generated',
                generated_at: new Date(),
                paid_at: null
            };

            const payrollId = uuidv4();
            await getPayrollCollection().doc(payrollId).set(payroll);

            results.push({
                employee_id,
                payroll_id: payrollId,
                status: 'generated',
                net_salary: payroll.net_salary
            });
        }

        res.status(201).json({
            success: true,
            message: `Payroll generated for ${results.length} employees`,
            month,
            results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to generate payroll',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payroll/my
 * @desc    Get current employee payroll records
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        // Authenticated user ID is in req.user.uid
        // We need to find the employee_id linked to this user or use it directly
        // Assuming req.user contains the employee_id if it's an employee
        const employeeId = req.user.employee_id || req.user.uid;

        const snapshot = await getPayrollCollection()
            .where('employee_id', '==', employeeId)
            .get();

        const payrolls = snapshot.docs.map(doc => ({
            payroll_id: doc.id,
            ...doc.data()
        }));

        payrolls.sort((a, b) => b.month.localeCompare(a.month));

        res.json({
            success: true,
            count: payrolls.length,
            payrolls
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your payrolls',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payroll
 * @desc    Get all payroll records
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month, employee_id } = req.query;

        let query = getPayrollCollection();

        if (month) {
            query = query.where('month', '==', month);
        }

        if (employee_id) {
            query = query.where('employee_id', '==', employee_id);
        }

        const snapshot = await query.get();
        let payrolls = snapshot.docs.map(doc => ({
            payroll_id: doc.id,
            ...doc.data()
        }));

        // Sort in-memory to avoid missing index errors in Firestore
        payrolls.sort((a, b) => {
            const dateA = a.generated_at?.toDate?.() || new Date(a.generated_at);
            const dateB = b.generated_at?.toDate?.() || new Date(b.generated_at);
            return dateB - dateA; // Descending
        });

        res.json({
            success: true,
            count: payrolls.length,
            payrolls
        });
    } catch (error) {
        console.error('FETCH PAYROLL ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payroll',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payroll/report
 * @desc    Get payroll summary report
 * @access  Private (Admin)
 */
router.get('/report', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({
                success: false,
                message: 'Please provide month parameter'
            });
        }

        const snapshot = await getPayrollCollection()
            .where('month', '==', month)
            .get();

        const payrolls = snapshot.docs.map(doc => doc.data());

        const report = {
            month,
            total_employees: payrolls.length,
            total_gross: payrolls.reduce((sum, p) => sum + Number(p.total_gross || 0), 0),
            total_deductions: payrolls.reduce((sum, p) => sum + Number(p.total_deductions || 0), 0),
            total_net: payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0),
            total_cnss: payrolls.reduce((sum, p) => sum + Number(p.deductions?.cnss || 0), 0),
            total_tax: payrolls.reduce((sum, p) => sum + Number(p.deductions?.income_tax || 0), 0)
        };

        res.json({
            success: true,
            report
        });
    } catch (error) {
        console.error('GENERATE REPORT ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payroll/:id
 * @desc    Get payroll by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const doc = await getPayrollCollection().doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Payroll not found'
            });
        }

        res.json({
            success: true,
            payroll: {
                payroll_id: doc.id,
                ...doc.data()
            }
        });
    } catch (error) {
        console.error('FETCH PAYROLL BY ID ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payroll',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payroll/:id/pdf
 * @desc    Export payroll as PDF
 * @access  Private
 */
router.get('/:id/pdf', authenticate, async (req, res) => {
    try {
        const payrollDoc = await getPayrollCollection().doc(req.params.id).get();
        if (!payrollDoc.exists) {
            return res.status(404).json({ success: false, message: 'Payroll not found' });
        }
        const payrollData = payrollDoc.data();

        const employeeDoc = await getEmployeesCollection().doc(payrollData.employee_id).get();
        if (!employeeDoc.exists) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        const employeeData = employeeDoc.data();

        // Get employee name for filename
        const filename = `Payslip_${employeeData.lastName}_${payrollData.month}.pdf`;

        // Generate PDF
        const doc = await generatePayrollPDF(payrollData, employeeData);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe the PDF document to the response
        doc.pipe(res);
        doc.end();

    } catch (error) {
        console.error('GENERATE PDF ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/payroll/export/sepa/:month
 * @desc    Export month payroll as SEPA XML
 * @access  Private (Admin)
 */
router.get('/export/sepa/:month', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month } = req.params;

        // Get all payrolls for the month
        const snapshot = await getPayrollCollection()
            .where('month', '==', month)
            .get();

        const payrolls = snapshot.docs.map(doc => doc.data());

        if (payrolls.length === 0) {
            return res.status(404).json({ success: false, message: 'No payroll found for this month' });
        }

        // Generate SEPA XML
        const companyData = {
            name: 'OLYMPIA HR',
            iban: 'TN59 1234 5678 9012 3456 7890',
            bic: 'OLYMTNTT'
        };

        const xml = generateSEPAXML(payrolls, companyData);

        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="SEPA_PAYROLL_${month}.xml"`);
        res.status(200).send(xml);

    } catch (error) {
        console.error('SEPA EXPORT ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to generate SEPA export', error: error.message });
    }
});

/**
 * @route   POST /api/payroll/:id/send-email
 * @desc    Send payslip PDF via email
 * @access  Private (Admin)
 */
router.post('/:id/send-email', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payrollDoc = await getPayrollCollection().doc(req.params.id).get();
        if (!payrollDoc.exists) {
            return res.status(404).json({ success: false, message: 'Payroll not found' });
        }
        const payrollData = payrollDoc.data();

        const employeeDoc = await getEmployeesCollection().doc(payrollData.employee_id).get();
        if (!employeeDoc.exists) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        const employeeData = employeeDoc.data();

        // Generate PDF
        const pdfDoc = await generatePayrollPDF(payrollData, employeeData);

        // Accumulate PDF buffer
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);

            // Send Email
            await sendEmail({
                to: employeeData.email,
                subject: `Bulletin de paie - ${moment(payrollData.month, 'YYYY-MM').format('MMMM YYYY')}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Bonjour ${employeeData.firstName},</h2>
                        <p>Veuillez trouver ci-joint votre bulletin de paie pour le mois de <strong>${moment(payrollData.month, 'YYYY-MM').format('MMMM YYYY')}</strong>.</p>
                        <p>Cordialement,<br>L'équipe Olympia HR</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Payslip_${payrollData.month}.pdf`,
                        content: pdfBuffer
                    }
                ]
            });

            res.json({ success: true, message: 'Email sent successfully' });
        });
        pdfDoc.end();

    } catch (error) {
        console.error('SEND PAYSLIP EMAIL ERROR:', error);
        res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
    }
});

/**
 * @route   GET /api/payroll/export/excel/:month
 * @desc    Export month payroll as Excel
 * @access  Private (Admin)
 */
router.get('/export/excel/:month', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month } = req.params;
        const snapshot = await getPayrollCollection().where('month', '==', month).get();
        const payrolls = snapshot.docs.map(doc => doc.data());

        if (payrolls.length === 0) {
            return res.status(404).json({ success: false, message: 'No data found' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payroll ' + month);

        worksheet.columns = [
            { header: 'Employee', key: 'name', width: 25 },
            { header: 'Gross Salary', key: 'gross', width: 15 },
            { header: 'CNSS', key: 'cnss', width: 15 },
            { header: 'IRPP', key: 'irpp', width: 15 },
            { header: 'CSS', key: 'css', width: 15 },
            { header: 'Net Salary', key: 'net', width: 15 }
        ];

        payrolls.forEach(p => {
            worksheet.addRow({
                name: p.employee_name,
                gross: p.total_gross.toFixed(3),
                cnss: p.deductions.cnss.toFixed(3),
                irpp: p.deductions.irpp.toFixed(3),
                css: p.deductions.css.toFixed(3),
                net: p.net_salary.toFixed(3)
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="Payroll_${month}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Excel export failed', error: error.message });
    }
});

/**
 * @route   GET /api/payroll/statutory/cnss/:month
 * @desc    CNSS Monthly Statutory Report
 */
router.get('/statutory/cnss/:month', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { month } = req.params;
        const snapshot = await getPayrollCollection().where('month', '==', month).get();
        const payrolls = snapshot.docs.map(doc => doc.data());

        const cnssSummary = {
            period: month,
            total_salaries: payrolls.reduce((s, p) => s + p.total_gross, 0),
            employee_share: payrolls.reduce((s, p) => s + p.deductions.cnss, 0),
            employer_share: payrolls.reduce((s, p) => s + p.total_gross * 0.1657, 0), // 16.57% standard employer share in Tunisia
            total_payable: 0
        };
        cnssSummary.total_payable = cnssSummary.employee_share + cnssSummary.employer_share;

        res.json({ success: true, report: cnssSummary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'CNSS report failed', error: error.message });
    }
});

module.exports = router;
