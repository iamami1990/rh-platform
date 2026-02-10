const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const dashboardService = require('../services/dashboardService');

/**
 * @route   GET /api/dashboard/admin
 * @desc    Get admin dashboard KPIs
 * @access  Private (Admin)
 */
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
    try {
        const dashboard = await dashboardService.getAdminDashboard();
        res.json({ success: true, dashboard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch admin dashboard' });
    }
});

/**
 * @route   GET /api/dashboard/manager
 * @desc    Get manager dashboard KPIs (team-filtered, fully implemented)
 * @access  Private (Manager)
 */
router.get('/manager', authenticate, authorize('manager'), async (req, res) => {
    try {
        const dashboard = await dashboardService.getManagerDashboard(req.user.employee_id);
        res.json({ success: true, dashboard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch manager dashboard' });
    }
});

/**
 * @route   GET /api/dashboard/employee
 * @desc    Get employee dashboard KPIs
 * @access  Private
 */
router.get('/employee', authenticate, async (req, res) => {
    try {
        const employee_id = req.user.employee_id;
        if (!employee_id) {
            return res.status(400).json({ success: false, message: 'No employee_id associated with this user' });
        }

        const dashboard = await dashboardService.getEmployeeDashboard(employee_id);
        res.json({ success: true, dashboard });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch employee dashboard' });
    }
});

module.exports = router;
