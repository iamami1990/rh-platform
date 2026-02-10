const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { generateSentimentPDF } = require('../utils/pdfGenerator');
const Employee = require('../models/Employee');
const Sentiment = require('../models/Sentiment');
const sentimentService = require('../services/sentimentService');

/**
 * @route   POST /api/sentiment/generate
 * @desc    Generate sentiment analysis for all employees for a month
 * @access  Private (Admin)
 */
router.post('/generate', authenticate, authorize('admin'), auditLogger('Generate Sentiment'), async (req, res) => {
    try {
        const results = await sentimentService.generateMonthlySentiment(req.body.month);
        res.status(201).json({ success: true, message: `Sentiment generated for ${results.length} employees`, month: req.body.month, results });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/sentiment
 * @desc    Get all sentiment records
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const sentiments = await sentimentService.getSentiments(req.query);
        res.json({ success: true, count: sentiments.length, sentiments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch sentiment data' });
    }
});

/**
 * @route   GET /api/sentiment/alerts
 * @desc    Get employees with poor sentiment (high risk)
 * @access  Private (Admin, Manager)
 */
router.get('/alerts', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const alerts = await sentimentService.getSentimentAlerts();
        res.json({ success: true, count: alerts.length, alerts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
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
        const history = await sentimentService.getPersonalSentiment(employeeId);
        res.json({
            success: true,
            employee_id: employeeId,
            count: history.length,
            sentiment: history[0] || null,
            history: history.slice(0, 12)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch sentiment history' });
    }
});

/**
 * @route   GET /api/sentiment/:employee_id
 * @desc    Get sentiment history for specific employee
 * @access  Private
 */
router.get('/:employee_id', authenticate, async (req, res) => {
    try {
        const history = await sentimentService.getPersonalSentiment(req.params.employee_id);
        res.json({ success: true, employee_id: req.params.employee_id, count: history.length, history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch sentiment history' });
    }
});

/**
 * @route   GET /api/sentiment/report/export/:employee_id
 * @desc    Export sentiment behavioral report as PDF
 * @access  Private (Admin, Manager)
 */
router.get('/report/export/:employee_id', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.employee_id);
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const history = await Sentiment.find({ employee: req.params.employee_id }).sort({ month: 1 });
        if (history.length === 0) return res.status(404).json({ success: false, message: 'No analysis history found' });

        const doc = generateSentimentPDF(history[history.length - 1], employee.toObject());

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Behavioral_${employee.lastName}.pdf"`);
        doc.pipe(res);
        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Export failed' });
    }
});

module.exports = router;
