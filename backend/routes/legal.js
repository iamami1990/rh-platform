const express = require('express');
const router = express.Router();
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

/**
 * @route   GET /api/legal/cnss/:month
 * @desc    Generate CNSS Monthly Declaration (Bordereau CNSS)
 * @access  Private (Admin)
 */
router.get('/cnss/:month', authenticate, authorize('admin'), auditLogger('Generate CNSS Report'), async (req, res) => {
    try {
        const { month } = req.params;

        // Get all payrolls for the month
        const payrolls = await Payroll.find({ month });

        if (payrolls.length === 0) {
            return res.status(404).json({ success: false, message: 'Aucune paie pour ce mois' });
        }

        // Calculate totals
        const totalGrossSalaries = payrolls.reduce((sum, p) => sum + Number(p.total_gross || 0), 0);
        const totalEmployeeCNSS = payrolls.reduce((sum, p) => sum + Number(p.deductions?.cnss || 0), 0);
        const totalEmployerCNSS = payrolls.reduce((sum, p) => sum + Number(p.total_gross || 0) * 0.1657, 0);
        const totalCNSS = totalEmployeeCNSS + totalEmployerCNSS;

        // Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`CNSS ${month}`);

        // Header
        worksheet.columns = [
            { header: 'Matricule', key: 'matricule', width: 15 },
            { header: 'Nom Complet', key: 'name', width: 30 },
            { header: 'CIN', key: 'cin', width: 12 },
            { header: 'Sal. Brut (TND)', key: 'gross', width: 15 },
            { header: 'CNSS Employé (9.18%)', key: 'cnss_employee', width: 20 },
            { header: 'CNSS Employeur (16.57%)', key: 'cnss_employer', width: 20 },
            { header: 'Total CNSS', key: 'cnss_total', width: 15 }
        ];

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };

        // Add data
        for (const payroll of payrolls) {
            const employee = await Employee.findById(payroll.employee || payroll.employee_id);
            const employeeData = employee ? employee.toObject() : {};

            const employerCNSS = Number(payroll.total_gross || 0) * 0.1657;

            worksheet.addRow({
                matricule: employeeData.matricule || 'N/A',
                name: payroll.employee_name,
                cin: employeeData.cin || 'N/A',
                gross: Number(payroll.total_gross || 0).toFixed(3),
                cnss_employee: Number(payroll.deductions?.cnss || 0).toFixed(3),
                cnss_employer: employerCNSS.toFixed(3),
                cnss_total: (Number(payroll.deductions?.cnss || 0) + employerCNSS).toFixed(3)
            });
        }

        // Add totals row
        const totalsRow = worksheet.addRow({
            matricule: '',
            name: 'TOTAL',
            cin: '',
            gross: totalGrossSalaries.toFixed(3),
            cnss_employee: totalEmployeeCNSS.toFixed(3),
            cnss_employer: totalEmployerCNSS.toFixed(3),
            cnss_total: totalCNSS.toFixed(3)
        });
        totalsRow.font = { bold: true };
        totalsRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFEB9C' }
        };

        // Send response
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="CNSS_Bordereau_${month}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('CNSS REPORT ERROR:', error);
        res.status(500).json({ success: false, message: 'Échec génération bordereau CNSS', error: error.message });
    }
});

/**
 * @route   GET /api/legal/ir-annual/:year
 * @desc    Generate Annual IR Declaration
 * @access  Private (Admin)
 */
router.get('/ir-annual/:year', authenticate, authorize('admin'), auditLogger('Generate IR Annual Report'), async (req, res) => {
    try {
        const { year } = req.params;

        // Get all payrolls for the year (filter in query)
        const payrolls = await Payroll.find({ month: { $regex: `^${year}` } });

        if (payrolls.length === 0) {
            return res.status(404).json({ success: false, message: 'Aucune donnée pour cette année' });
        }

        // Group by employee
        const employeeIRMap = {};
        payrolls.forEach(p => {
            const empId = (p.employee || p.employee_id).toString();
            if (!employeeIRMap[empId]) {
                employeeIRMap[empId] = {
                    employee_name: p.employee_name,
                    total_gross: 0,
                    total_irpp: 0,
                    months_count: 0
                };
            }
            employeeIRMap[empId].total_gross += Number(p.total_gross || 0);
            employeeIRMap[empId].total_irpp += Number(p.deductions?.irpp || 0);
            employeeIRMap[empId].months_count++;
        });

        // Generate Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`IR ${year}`);

        worksheet.columns = [
            { header: 'ID Employé', key: 'employee_id', width: 20 },
            { header: 'Nom Complet', key: 'name', width: 30 },
            { header: 'Revenus Annuels (TND)', key: 'gross', width: 20 },
            { header: 'IRPP Retenu (TND)', key: 'irpp', width: 20 },
            { header: 'Mois travaillés', key: 'months', width: 15 }
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF70AD47' }
        };

        let totalGross = 0;
        let totalIRPP = 0;

        for (const [employee_id, data] of Object.entries(employeeIRMap)) {
            worksheet.addRow({
                employee_id,
                name: data.employee_name,
                gross: data.total_gross.toFixed(3),
                irpp: data.total_irpp.toFixed(3),
                months: data.months_count
            });
            totalGross += data.total_gross;
            totalIRPP += data.total_irpp;
        }

        // Totals
        const totalsRow = worksheet.addRow({
            employee_id: '',
            name: 'TOTAL',
            gross: totalGross.toFixed(3),
            irpp: totalIRPP.toFixed(3),
            months: ''
        });
        totalsRow.font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="IR_Annual_${year}.xlsx"`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('IR ANNUAL REPORT ERROR:', error);
        res.status(500).json({ success: false, message: 'Échec génération déclaration IR', error: error.message });
    }
});

/**
 * @route   GET /api/legal/work-certificate/:employee_id
 * @desc    Generate Work Certificate (Attestation de Travail)
 * @access  Private (Admin, Manager)
 */
router.get('/work-certificate/:employee_id', authenticate, authorize('admin', 'manager'), auditLogger('Generate Work Certificate'), async (req, res) => {
    try {
        const { employee_id } = req.params;

        const employee = await Employee.findById(employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employé non trouvé' });
        }

        // Generate PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        // Company Header
        doc.fontSize(16)
            .font('Helvetica-Bold')
            .text('OLYMPIA HR PLATFORM', { align: 'center' })
            .fontSize(10)
            .font('Helvetica')
            .text('Plateforme Intelligente de Gestion RH', { align: 'center' })
            .moveDown(2);

        // Title
        doc.fontSize(14)
            .font('Helvetica-Bold')
            .text('ATTESTATION DE TRAVAIL', { align: 'center' })
            .moveDown(2);

        // Content
        doc.fontSize(11)
            .font('Helvetica')
            .text(`Je soussigné(e), Directeur(rice) de OLYMPIA HR, certifie par la présente que :`, { align: 'left' })
            .moveDown();

        doc.fontSize(12)
            .font('Helvetica-Bold')
            .text(`${employee.firstName} ${employee.lastName}`)
            .font('Helvetica')
            .moveDown();

        doc.text(`CIN: ${employee.cin || 'N/A'}`)
            .text(`Né(e) le: ${employee.birthDate || 'N/A'}`)
            .text(`Adresse: ${employee.address || 'N/A'}`)
            .moveDown();

        doc.text(`Occupe le poste de: ${employee.position}`)
            .text(`Au sein du département: ${employee.department}`)
            .text(`Depuis le: ${moment(employee.hireDate).format('DD/MM/YYYY')}`)
            .moveDown();

        const seniority = moment().diff(moment(employee.hireDate), 'months');
        const years = Math.floor(seniority / 12);
        const months = seniority % 12;

        doc.text(`Ancienneté: ${years} an(s) et ${months} mois`)
            .moveDown(2);

        doc.text('Cette attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.')
            .moveDown(2);

        // Date & Signature
        doc.text(`Fait à Tunis, le ${moment().format('DD/MM/YYYY')}`, { align: 'right' })
            .moveDown(2);

        doc.text('Le Directeur', { align: 'right' })
            .moveDown(3);

        doc.text('_____________________', { align: 'right' })
            .text('Signature et Cachet', { align: 'right' });

        // Footer
        doc.fontSize(8)
            .text('Document généré automatiquement par Olympia HR Platform', 50, 750, { align: 'center' });

        // Send response
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Attestation_Travail_${employee.lastName}.pdf"`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('WORK CERTIFICATE ERROR:', error);
        res.status(500).json({ success: false, message: 'Échec génération attestation', error: error.message });
    }
});

/**
 * @route   GET /api/legal/salary-certificate/:employee_id
 * @desc    Generate Salary Certificate (Certificat de Salaire)
 * @access  Private (Admin)
 */
router.get('/salary-certificate/:employee_id', authenticate, authorize('admin'), auditLogger('Generate Salary Certificate'), async (req, res) => {
    try {
        const { employee_id } = req.params;

        const employee = await Employee.findById(employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employé non trouvé' });
        }

        // Get last 3 months payroll
        const currentMonth = moment().format('YYYY-MM');
        const last3Months = [
            currentMonth,
            moment().subtract(1, 'month').format('YYYY-MM'),
            moment().subtract(2, 'month').format('YYYY-MM')
        ];

        const payrolls = await Payroll.find({
            employee_id,
            month: { $in: last3Months }
        }).sort({ month: -1 });

        const averageNet = payrolls.length > 0
            ? payrolls.reduce((sum, p) => sum + Number(p.net_salary || 0), 0) / payrolls.length
            : Number(employee.salary_brut || 0);

        // Generate PDF
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        doc.fontSize(16).font('Helvetica-Bold').text('CERTIFICAT DE SALAIRE', { align: 'center' }).moveDown(2);

        doc.fontSize(11).font('Helvetica')
            .text(`Je soussigné(e), certifie que ${employee.firstName} ${employee.lastName}, employé(e) au sein de notre établissement, perçoit un salaire mensuel de:`)
            .moveDown();

        doc.fontSize(14).font('Helvetica-Bold')
            .text(`${averageNet.toFixed(3)} TND NET`, { align: 'center' })
            .moveDown();

        doc.fontSize(11).font('Helvetica')
            .text(`(Salaire net moyen des 3 derniers mois)`)
            .moveDown(2);

        if (payrolls.length > 0) {
            doc.text('Détails:').moveDown(0.5);
            payrolls.forEach(p => {
                doc.text(`- ${moment(p.month, 'YYYY-MM').format('MMMM YYYY')}: ${Number(p.net_salary).toFixed(3)} TND`);
            });
            doc.moveDown(2);
        }

        doc.text('Cette attestation est délivrée pour servir et valoir ce que de droit.')
            .moveDown(2);

        doc.text(`Fait à Tunis, le ${moment().format('DD/MM/YYYY')}`, { align: 'right' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Certificat_Salaire_${employee.lastName}.pdf"`);

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error('SALARY CERTIFICATE ERROR:', error);
        res.status(500).json({ success: false, message: 'Échec génération certificat', error: error.message });
    }
});

module.exports = router;
