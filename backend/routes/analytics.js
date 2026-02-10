const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

/**
 * @route   GET /api/analytics/behavioral-patterns
 * @desc    Get behavioral patterns across all employees
 * @access  Private (Admin, Manager)
 */
router.get('/behavioral-patterns', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const patterns = await analyticsService.getBehavioralPatterns(req.query.time_range);
        res.json({ success: true, patterns });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to analyze behavioral patterns' });
    }
});

/**
 * @route   GET /api/analytics/employee-insights/:employee_id
 * @desc    Get comprehensive insights for specific employee
 * @access  Private (Admin, Manager)
 */
router.get('/employee-insights/:employee_id', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const insights = await analyticsService.getEmployeeInsights(req.params.employee_id, req.query.time_range);
        res.json({ success: true, employee_id: req.params.employee_id, insights });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message || 'Failed to generate insights' });
    }
});

/**
 * @route   GET /api/analytics/turnover-prediction
 * @desc    Predict employees at risk of leaving
 * @access  Private (Admin, Manager)
 */
router.get('/turnover-prediction', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const predictions = await analyticsService.getTurnoverPrediction();
        res.json({ success: true, total_at_risk: predictions.length, predictions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to predict turnover' });
    }
});

/**
 * @route   GET /api/analytics/productivity-insights
 * @desc    Get productivity metrics and trends
 * @access  Private (Admin, Manager)
 */
router.get('/productivity-insights', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const productivity = await analyticsService.getProductivityInsights(req.query.time_range);
        res.json({ success: true, productivity });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to analyze productivity' });
    }
});

/**
 * @route   GET /api/analytics/team-dynamics
 * @desc    Analyze team composition and dynamics
 * @access  Private (Admin, Manager)
 */
router.get('/team-dynamics', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const dynamics = await analyticsService.getTeamDynamics();
        res.json({ success: true, dynamics });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to analyze team dynamics' });
    }
});

module.exports = router;
