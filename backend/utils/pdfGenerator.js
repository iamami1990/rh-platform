const PDFDocument = require('pdfkit');
const moment = require('moment');
const QRCode = require('qrcode');

/**
 * Generate payroll bulletin PDF
 * @param {Object} payrollData - Payroll data
 * @param {Object} employeeData - Employee data
 * @returns {Promise<PDFDocument>} PDF stream
 */
const generatePayrollPDF = async (payrollData, employeeData) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Header - Company Info
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('OLYMPIA HR PLATFORM', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text('Plateforme Intelligente de Gestion RH', { align: 'center' })
        .moveDown();

    // Title
    doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('BULLETIN DE PAIE', { align: 'center' })
        .moveDown();

    // Period
    doc.fontSize(10)
        .font('Helvetica')
        .text(`Période: ${moment(payrollData.month, 'YYYY-MM').format('MMMM YYYY')}`, { align: 'center' })
        .moveDown(2);

    // Employee Information
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('INFORMATIONS EMPLOYÉ', { underline: true })
        .moveDown(0.5);

    doc.fontSize(10)
        .font('Helvetica')
        .text(`Nom complet: ${employeeData.firstName} ${employeeData.lastName}`)
        .text(`Email: ${employeeData.email}`)
        .text(`Département: ${employeeData.department}`)
        .text(`Poste: ${employeeData.position}`)
        .text(`Type de contrat: ${employeeData.contract_type}`)
        .moveDown(2);

    // Divider line
    doc.moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown();

    // Salary Details Table Header
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('DÉTAILS DE LA RÉMUNÉRATION', { underline: true })
        .moveDown(0.5);

    const startY = doc.y;
    const col1X = 50;
    const col2X = 400;

    // Gross Salary Section
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('SALAIRE BRUT', col1X, startY);

    let currentY = startY + 20;

    doc.font('Helvetica')
        .text('Salaire de base', col1X, currentY)
        .text(`${Number(payrollData.gross_salary || 0).toFixed(3)} DT`, col2X, currentY);

    currentY += 15;

    // Overtime Hours
    if (payrollData.overtime_hours > 0) {
        doc.text(`Heures supplémentaires (${payrollData.overtime_hours}h)`, col1X, currentY)
            .text(`${Number(payrollData.overtime_pay || 0).toFixed(3)} DT`, col2X, currentY);
        currentY += 15;

        // Detail overtime by rate if available
        if (payrollData.overtime_details && payrollData.overtime_details.length > 0) {
            payrollData.overtime_details.forEach(ot => {
                doc.fontSize(8)
                    .text(`  - ${ot.date}: ${ot.hours}h à ${ot.rate_type}`, col1X + 10, currentY)
                    .text(`${Number(ot.amount).toFixed(3)} DT`, col2X, currentY);
                currentY += 12;
            });
            doc.fontSize(10); // Reset font size
        }
    }

    // Bonuses
    const bonusTotal = Object.values(payrollData.bonuses).reduce((a, b) => a + b, 0);
    if (bonusTotal > 0) {
        doc.font('Helvetica-Bold')
            .text('PRIMES', col1X, currentY);
        currentY += 15;

        doc.font('Helvetica');
        if (payrollData.bonuses.seniority > 0) {
            doc.text('Prime d\'ancienneté', col1X, currentY)
                .text(`${Number(payrollData.bonuses.seniority).toFixed(3)} DT`, col2X, currentY);
            currentY += 15;
        }
        if (payrollData.bonuses.attendance > 0) {
            doc.text('Prime d\'assiduité', col1X, currentY)
                .text(`${Number(payrollData.bonuses.attendance).toFixed(3)} DT`, col2X, currentY);
            currentY += 15;
        }
        if (payrollData.bonuses.performance > 0) {
            doc.text('Prime de performance', col1X, currentY)
                .text(`${Number(payrollData.bonuses.performance).toFixed(3)} DT`, col2X, currentY);
            currentY += 15;
        }
    }

    // Allowances
    const allowanceTotal = Object.values(payrollData.allowances).reduce((a, b) => a + b, 0);
    if (allowanceTotal > 0) {
        doc.font('Helvetica-Bold')
            .text('INDEMNITÉS', col1X, currentY);
        currentY += 15;

        doc.font('Helvetica');
        if (payrollData.allowances.transport > 0) {
            doc.text('Indemnité de transport', col1X, currentY)
                .text(`${Number(payrollData.allowances.transport).toFixed(3)} DT`, col2X, currentY);
            currentY += 15;
        }
        if (payrollData.allowances.meals > 0) {
            doc.text('Indemnité de repas', col1X, currentY)
                .text(`${Number(payrollData.allowances.meals).toFixed(3)} DT`, col2X, currentY);
            currentY += 15;
        }
        if (payrollData.allowances.prime_presence > 0) {
            doc.text('Prime de présence', col1X, currentY)
                .text(`${Number(payrollData.allowances.prime_presence).toFixed(3)} DT`, col2X, currentY);
            currentY += 15;
        }
    }

    currentY += 10;

    // Total Gross
    doc.font('Helvetica-Bold')
        .fontSize(11)
        .text('TOTAL BRUT', col1X, currentY)
        .text(`${Number(payrollData.total_gross || 0).toFixed(3)} DT`, col2X, currentY);

    currentY += 25;

    // Deductions Section
    doc.fontSize(10)
        .font('Helvetica-Bold')
        .text('DÉDUCTIONS', col1X, currentY);
    currentY += 20;

    doc.font('Helvetica')
        .text('Cotisation CNSS (9.18%)', col1X, currentY)
        .text(`-${Number(payrollData.deductions?.cnss || 0).toFixed(3)} DT`, col2X, currentY);
    currentY += 15;

    doc.text('Impôt sur le Revenu (IRPP)', col1X, currentY)
        .text(`-${Number(payrollData.deductions?.irpp || 0).toFixed(3)} DT`, col2X, currentY);
    currentY += 15;

    if (payrollData.deductions?.css > 0) {
        doc.text('Contrib. Sociale de Solidarité (CSS)', col1X, currentY)
            .text(`-${Number(payrollData.deductions.css).toFixed(3)} DT`, col2X, currentY);
        currentY += 15;
    }

    if (payrollData.deductions?.absenteeism > 0) {
        doc.text(`Déduction absences (${payrollData.absent_days} j)`, col1X, currentY)
            .text(`-${Number(payrollData.deductions.absenteeism).toFixed(3)} DT`, col2X, currentY);
        currentY += 15;
    }

    currentY += 10;

    // Total Deductions
    doc.font('Helvetica-Bold')
        .fontSize(11)
        .text('TOTAL DÉDUCTIONS', col1X, currentY)
        .text(`-${Number(payrollData.total_deductions || 0).toFixed(3)} DT`, col2X, currentY);

    currentY += 25;

    // Divider line
    doc.moveTo(50, currentY)
        .lineTo(550, currentY)
        .stroke();

    currentY += 15;

    // NET SALARY - Highlighted
    doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1976d2')
        .text('SALAIRE NET À PAYER', col1X, currentY)
        .text(`${Number(payrollData.net_salary || 0).toFixed(3)} DT`, col2X, currentY)
        .fillColor('black');

    currentY += 30;

    // Attendance Summary
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('RÉSUMÉ DE PRÉSENCE', col1X, currentY);

    currentY += 20;

    doc.fontSize(10)
        .font('Helvetica')
        .text(`Jours ouvrables: ${payrollData.working_days}`, col1X, currentY)
        .text(`Jours présents: ${payrollData.present_days}`, col1X, currentY + 15)
        .text(`Jours absents: ${payrollData.absent_days}`, col1X, currentY + 30)
        .text(`Jours de retard: ${payrollData.late_days}`, col1X, currentY + 45);

    // QR Code for verification
    try {
        const qrData = JSON.stringify({
            id: payrollData.payroll_id,
            emp: employeeData._id,
            month: payrollData.month,
            net: payrollData.net_salary
        });
        const qrCodeDataUrl = await QRCode.toDataURL(qrData);
        doc.image(qrCodeDataUrl, 480, 710, { width: 60 });
        doc.fontSize(7).text('Vérification QR', 485, 775);
    } catch (err) {
        console.error('QR Code Generation Error:', err);
    }

    // Footer
    doc.fontSize(8)
        .font('Helvetica')
        .text(
            'Ce document est généré automatiquement par Olympia HR Platform',
            50,
            750,
            { align: 'center', width: 400 }
        )
        .text(
            `Généré le: ${moment().format('DD/MM/YYYY HH:mm')}`,
            50,
            762,
            { align: 'center', width: 400 }
        );

    return doc;
};

/**
 * Generate sentiment report PDF
 * @param {Object} sentimentData - Sentiment analysis data
 * @param {Object} employeeData - Employee data
 * @returns {PDFDocument} PDF stream
 */
const generateSentimentPDF = (sentimentData, employeeData) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Header
    doc.fontSize(20)
        .font('Helvetica-Bold')
        .text('RAPPORT DE SENTIMENT', { align: 'center' })
        .fontSize(10)
        .font('Helvetica')
        .text('Analyse Comportementale IA', { align: 'center' })
        .moveDown(2);

    // Employee Info
    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`Employé: ${employeeData.firstName} ${employeeData.lastName}`)
        .fontSize(10)
        .font('Helvetica')
        .text(`Département: ${employeeData.department}`)
        .text(`Période: ${moment(sentimentData.month, 'YYYY-MM').format('MMMM YYYY')}`)
        .moveDown(2);

    // Overall Score - Highlighted
    const scoreColor = sentimentData.overall_score >= 70 ? '#4caf50' :
        sentimentData.overall_score >= 50 ? '#ff9800' : '#f44336';

    doc.fontSize(16)
        .font('Helvetica-Bold')
        .fillColor(scoreColor)
        .text(`SCORE GLOBAL: ${sentimentData.overall_score}/100`, { align: 'center' })
        .fontSize(12)
        .text(`Sentiment: ${sentimentData.sentiment.toUpperCase()}`, { align: 'center' })
        .fillColor('black')
        .moveDown(2);

    // Detailed Scores
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('SCORES DÉTAILLÉS')
        .moveDown(0.5);

    const scores = [
        { label: 'Présence', value: sentimentData.attendance_score },
        { label: 'Ponctualité', value: sentimentData.punctuality_score },
        { label: 'Assiduité', value: sentimentData.assiduity_score },
        { label: 'Charge de travail', value: sentimentData.workload_score }
    ];

    scores.forEach(score => {
        doc.fontSize(10)
            .font('Helvetica')
            .text(`${score.label}:`, 50, doc.y)
            .text(`${score.value}/10`, 400, doc.y - 10);
    });

    doc.moveDown(2);

    // Metrics
    doc.fontSize(11)
        .font('Helvetica-Bold')
        .text('MÉTRIQUES')
        .moveDown(0.5);

    doc.fontSize(10)
        .font('Helvetica')
        .text(`Jours ouvrables: ${sentimentData.metrics.working_days}`)
        .text(`Jours présents: ${sentimentData.metrics.present_days}`)
        .text(`Jours absents: ${sentimentData.metrics.absent_days}`)
        .text(`Jours de retard: ${sentimentData.metrics.late_days}`)
        .text(`Taux de présence: ${sentimentData.metrics.attendance_rate}%`)
        .moveDown(2);

    // Risk Level
    const riskColor = sentimentData.risk_level === 'low' ? '#4caf50' :
        sentimentData.risk_level === 'medium' ? '#ff9800' : '#f44336';

    doc.fontSize(12)
        .font('Helvetica-Bold')
        .text('NIVEAU DE RISQUE: ')
        .fillColor(riskColor)
        .text(sentimentData.risk_level.toUpperCase(), { continued: true })
        .fillColor('black')
        .moveDown(2);

    // Recommendations
    if (sentimentData.recommendations) {
        doc.fontSize(11)
            .font('Helvetica-Bold')
            .text('RECOMMANDATIONS')
            .moveDown(0.5);

        doc.fontSize(10)
            .font('Helvetica')
            .text(sentimentData.recommendations, { width: 500 });
    }

    // Footer
    doc.fontSize(8)
        .text(
            `Généré automatiquement par Olympia HR Platform - ${moment().format('DD/MM/YYYY')}`,
            50,
            750,
            { align: 'center', width: 500 }
        );

    return doc;
};

module.exports = {
    generatePayrollPDF,
    generateSentimentPDF
};
