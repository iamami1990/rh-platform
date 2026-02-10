const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const overtimeService = require('../services/overtimeService');

/**
 * @route   POST /api/overtime
 * @desc    Create overtime request
 * @access  Private
 */
router.post('/', authenticate, auditLogger('Create Overtime Request'), async (req, res) => {
    try {
        // Permission check
        if (req.user.role === 'employee' && req.body.employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Vous ne pouvez créer une demande que pour vous-même' });
        }

        const overtime = await overtimeService.createOvertime({ requestData: req.body, requestedBy: req.user.user_id });
        res.status(201).json({ success: true, message: 'Demande d\'heures supplémentaires créée avec succès', overtime });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/overtime
 * @desc    Get all overtime requests
 * @access  Private (Admin, Manager, RH)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const overtimes = await overtimeService.getOvertimes(req.query);
        res.json({ success: true, count: overtimes.length, overtimes });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Échec de récupération' });
    }
});

/**
 * @route   GET /api/overtime/my
 * @desc    Get current employee overtime
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.user.user_id;
        const overtimes = await overtimeService.getMyOvertimes(employeeId);
        res.json({ success: true, count: overtimes.length, overtimes });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Échec de récupération' });
    }
});

/**
 * @route   GET /api/overtime/:id
 * @desc    Get overtime by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const overtime = await overtimeService.getOvertimeById(req.params.id);

        // Permission check
        if (req.user.role === 'employee' && overtime.employee_id.toString() !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Accès refusé' });
        }

        res.json({ success: true, overtime });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/overtime/:id/approve
 * @desc    Approve overtime
 * @access  Private (Admin, Manager, RH)
 */
router.put('/:id/approve', authenticate, authorize('admin', 'manager', 'rh'), auditLogger('Approve Overtime'), async (req, res) => {
    try {
        await overtimeService.approveOvertime(req.params.id, { approvedBy: req.user.user_id, manager_comments: req.body.manager_comments });
        res.json({ success: true, message: 'Heures supplémentaires approuvées' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/overtime/:id/reject
 * @desc    Reject overtime
 * @access  Private (Admin, Manager, RH)
 */
router.put('/:id/reject', authenticate, authorize('admin', 'manager', 'rh'), auditLogger('Reject Overtime'), async (req, res) => {
    try {
        await overtimeService.rejectOvertime(req.params.id, {
            approvedBy: req.user.user_id,
            rejection_reason: req.body.rejection_reason,
            manager_comments: req.body.manager_comments
        });
        res.json({ success: true, message: 'Heures supplémentaires rejetées' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/overtime/:id
 * @desc    Cancel overtime request
 * @access  Private
 */
router.delete('/:id', authenticate, auditLogger('Delete Overtime'), async (req, res) => {
    try {
        await overtimeService.cancelOvertime(req.params.id, {
            userId: req.user.user_id,
            userRole: req.user.role,
            employeeId: req.user.employee_id
        });
        res.json({ success: true, message: 'Demande annulée avec succès' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/overtime/employee/:employee_id
 * @desc    Get overtime for specific employee
 * @access  Private
 */
router.get('/employee/:employee_id', authenticate, async (req, res) => {
    try {
        if (req.user.role === 'employee' && req.params.employee_id !== req.user.employee_id) {
            return res.status(403).json({ success: false, message: 'Accès refusé' });
        }

        const overtimes = await overtimeService.getEmployeeOvertimes(req.params.employee_id);
        res.json({ success: true, count: overtimes.length, overtimes });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Échec de récupération' });
    }
});

module.exports = router;
