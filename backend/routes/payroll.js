const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const payrollService = require('../services/payrollService');
const { generatePayrollPDF } = require('../utils/pdfGenerator');
const { generateSEPAXML } = require('../utils/sepaGenerator');
const { sendEmail } = require('../utils/emailService');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const moment = require('moment');
const ExcelJS = require('exceljs');

/**
 * @route   POST /api/payroll/generate
 * @desc    Generate payroll for all employees
 * @access  Private (Admin)
 */
router.post('/generate', authenticate, authorize('admin'), auditLogger('Generate Payroll'), async (req, res) => {
    try {
        const results = await payrollService.generateMonthlyPayroll(req.body.month);
        res.status(201).json({ success: true, message: `Payroll generated for ${results.length} employees`, month: req.body.month, results });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/payroll/my
 * @desc    Get current employee payrolls
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.user.user_id;
        const payrolls = await payrollService.getMyPayrolls(employeeId);
        res.json({ success: true, count: payrolls.length, payrolls });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch your payrolls' });
    }
});

/**
 * @route   GET /api/payroll
 * @desc    Get all payrolls
 * @access  Private (Admin)
 */
router.get('/', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payrolls = await payrollService.getPayrolls(req.query);
        res.json({ success: true, count: payrolls.length, payrolls });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch payroll' });
    }
});

/**
 * @route   GET /api/payroll/report
 * @desc    Payroll summary report
 * @access  Private (Admin)
 */
router.get('/report', authenticate, authorize('admin'), async (req, res) => {
    try {
        const report = await payrollService.getPayrollReport(req.query.month);
        res.json({ success: true, report });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/payroll/:id
 * @desc    Get payroll by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const payroll = await payrollService.getPayrollById(req.params.id);
        res.json({ success: true, payroll });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/payroll/:id/pdf
 * @desc    Export payroll as PDF
 * @access  Private
 */
router.get('/:id/pdf', authenticate, async (req, res) => {
    try {
        const payrollDoc = await Payroll.findById(req.params.id);
        if (!payrollDoc) return res.status(404).json({ success: false, message: 'Payroll not found' });

        const employeeDoc = await Employee.findById(payrollDoc.employee || payrollDoc.employee_id);
        if (!employeeDoc) return res.status(404).json({ success: false, message: 'Employee not found' });

        const filename = `Payslip_${employeeDoc.lastName}_${payrollDoc.month}.pdf`;
        const doc = await generatePayrollPDF(payrollDoc.toObject(), employeeDoc.toObject());

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);
        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
});

/**
 * @route   GET /api/payroll/export/sepa/:month
 * @desc    Export SEPA XML
 * @access  Private (Admin)
 */
router.get('/export/sepa/:month', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payrolls = await Payroll.find({ month: req.params.month }).lean();
        if (payrolls.length === 0) return res.status(404).json({ success: false, message: 'No payroll found for this month' });

        const companyData = {
            name: process.env.COMPANY_NAME || 'OLYMPIA HR',
            iban: process.env.COMPANY_IBAN || 'TN59 1234 5678 9012 3456 7890',
            bic: process.env.COMPANY_BIC || 'OLYMTNTT'
        };

        const xml = generateSEPAXML(payrolls, companyData);
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', `attachment; filename="SEPA_PAYROLL_${req.params.month}.xml"`);
        res.status(200).send(xml);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to generate SEPA export' });
    }
});

/**
 * @route   POST /api/payroll/:id/send-email
 * @desc    Send payslip via email
 * @access  Private (Admin)
 */
router.post('/:id/send-email', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payrollDoc = await Payroll.findById(req.params.id);
        if (!payrollDoc) return res.status(404).json({ success: false, message: 'Payroll not found' });

        const employeeDoc = await Employee.findById(payrollDoc.employee || payrollDoc.employee_id);
        if (!employeeDoc) return res.status(404).json({ success: false, message: 'Employee not found' });

        const payrollData = payrollDoc.toObject();
        const employeeData = employeeDoc.toObject();

        const pdfDoc = await generatePayrollPDF(payrollData, employeeData);
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', async () => {
            const pdfBuffer = Buffer.concat(chunks);
            await sendEmail({
                to: employeeData.email,
                subject: `Bulletin de paie - ${moment(payrollData.month, 'YYYY-MM').format('MMMM YYYY')}`,
                html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Bonjour ${employeeData.firstName},</h2>
                    <p>Veuillez trouver ci-joint votre bulletin de paie pour <strong>${moment(payrollData.month, 'YYYY-MM').format('MMMM YYYY')}</strong>.</p>
                    <p>Cordialement,<br>L'équipe Olympia HR</p>
                </div>`,
                attachments: [{ filename: `Payslip_${payrollData.month}.pdf`, content: pdfBuffer }]
            });
            res.json({ success: true, message: 'Email sent successfully' });
        });
        pdfDoc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send email' });
    }
});

/**
 * @route   GET /api/payroll/export/excel/:month
 * @desc    Export payroll as Excel
 * @access  Private (Admin)
 */
router.get('/export/excel/:month', authenticate, authorize('admin'), async (req, res) => {
    try {
        const payrolls = await Payroll.find({ month: req.params.month }).lean();
        if (payrolls.length === 0) return res.status(404).json({ success: false, message: 'No data found' });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Payroll ' + req.params.month);
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
        res.setHeader('Content-Disposition', `attachment; filename="Payroll_${req.params.month}.xlsx"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Excel export failed' });
    }
});

/**
 * @route   GET /api/payroll/statutory/cnss/:month
 * @desc    CNSS statutory report
 * @access  Private (Admin)
 */
router.get('/statutory/cnss/:month', authenticate, authorize('admin'), async (req, res) => {
    try {
        const report = await payrollService.getCNSSReport(req.params.month);
        res.json({ success: true, report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'CNSS report failed' });
    }
});

module.exports = router;
