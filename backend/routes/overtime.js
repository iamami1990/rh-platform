const express = require('express');
const router = express.Router();
const moment = require('moment');
const Overtime = require('../models/Overtime');
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

/**
 * @route   POST /api/overtime
 * @desc    Create overtime request
 * @access  Private (Employee can request for themselves, Manager/Admin for anyone)
 */
router.post('/', authenticate, auditLogger('Create Overtime Request'), async (req, res) => {
    try {
        const { employee_id, date, hours, start_time, end_time, rate_type, overtime_category, reason, description, project_id, task_name } = req.body;

        // Permission check
        if (req.user.role === 'employee' && employee_id !== req.user.employee_id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez créer une demande que pour vous-même'
            });
        }

        // Get employee
        const employee = await Employee.findById(employee_id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employé non trouvé' });
        }

        const overtimeMonth = moment(date, 'YYYY-MM-DD').format('YYYY-MM');

        // Calculate base hourly rate
        const baseSalary = Number(employee.salary_brut || 0);
        const baseHourlyRate = baseSalary / (22 * 8); // 22 working days * 8 hours

        // Calculate amount based on rate type
        let rateMultiplier = 1.25; // Default 125%
        if (rate_type === '150%') rateMultiplier = 1.5;
        if (rate_type === '200%') rateMultiplier = 2.0;

        const amount = baseHourlyRate * hours * rateMultiplier;

        const newOvertime = new Overtime({
            employee_id,
            date,
            month: overtimeMonth,
            hours,
            start_time: start_time || null,
            end_time: end_time || null,
            rate_type,
            overtime_category: overtime_category || 'regular',
            reason,
            description: description || '',
            project_id: project_id || null,
            task_name: task_name || null,
            status: 'pending',
            requested_by: req.user.user_id,
            approved_by: null,
            approved_at: null,
            rejection_reason: null,
            amount,
            base_hourly_rate: baseHourlyRate,
            manager_comments: ''
        });

        await newOvertime.save();

        res.status(201).json({
            success: true,
            message: 'Demande d\'heures supplémentaires créée avec succès',
            overtime: {
                overtime_id: newOvertime._id,
                ...newOvertime.toObject()
            }
        });
    } catch (error) {
        console.error('CREATE OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de la création',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/overtime
 * @desc    Get all overtime requests with filters
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager', 'rh'), async (req, res) => {
    try {
        const { employee_id, month, status } = req.query;

        const query = {};
        if (employee_id) query.employee_id = employee_id;
        if (status) query.status = status;
        if (month) query.month = month;

        const overtimes = await Overtime.find(query).sort({ created_at: -1 });

        res.json({
            success: true,
            count: overtimes.length,
            overtimes: overtimes.map(o => ({
                overtime_id: o._id,
                ...o.toObject()
            }))
        });
    } catch (error) {
        console.error('FETCH OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de récupération',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/overtime/my
 * @desc    Get current employee overtime requests
 * @access  Private (Employee)
 */
router.get('/my', authenticate, async (req, res) => {
    try {
        const employeeId = req.user.employee_id || req.user.user_id;

        const overtimes = await Overtime.find({ employee_id: employeeId }).sort({ date: -1 });

        res.json({
            success: true,
            count: overtimes.length,
            overtimes: overtimes.map(o => ({
                overtime_id: o._id,
                ...o.toObject()
            }))
        });
    } catch (error) {
        console.error('FETCH MY OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de récupération',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/overtime/:id
 * @desc    Get overtime by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({
                success: false,
                message: 'Demande d\'heures supplémentaires non trouvée'
            });
        }

        // Permission check
        if (req.user.role === 'employee' && overtime.employee_id.toString() !== req.user.employee_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        res.json({
            success: true,
            overtime: {
                overtime_id: overtime._id,
                ...overtime.toObject()
            }
        });
    } catch (error) {
        console.error('FETCH OVERTIME BY ID ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de récupération',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/overtime/:id/approve
 * @desc    Approve overtime request
 * @access  Private (Manager, Admin)
 */
router.put('/:id/approve', authenticate, authorize('admin', 'manager', 'rh'), auditLogger('Approve Overtime'), async (req, res) => {
    try {
        const { manager_comments } = req.body;
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        if (overtime.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cette demande a déjà été ${overtime.status}`
            });
        }

        overtime.status = 'approved';
        overtime.approved_by = req.user.user_id;
        overtime.approved_at = new Date();
        overtime.manager_comments = manager_comments || '';

        await overtime.save();

        res.json({
            success: true,
            message: 'Heures supplémentaires approuvées'
        });
    } catch (error) {
        console.error('APPROVE OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de l\'approbation',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/overtime/:id/reject
 * @desc    Reject overtime request
 * @access  Private (Manager, Admin)
 */
router.put('/:id/reject', authenticate, authorize('admin', 'manager', 'rh'), auditLogger('Reject Overtime'), async (req, res) => {
    try {
        const { rejection_reason, manager_comments } = req.body;
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        if (overtime.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cette demande a déjà été ${overtime.status}`
            });
        }

        overtime.status = 'rejected';
        overtime.approved_by = req.user.user_id;
        overtime.approved_at = new Date();
        overtime.rejection_reason = rejection_reason;
        overtime.manager_comments = manager_comments || '';

        await overtime.save();

        res.json({
            success: true,
            message: 'Heures supplémentaires rejetées'
        });
    } catch (error) {
        console.error('REJECT OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec du rejet',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/overtime/:id
 * @desc    Delete/Cancel overtime request
 * @access  Private (Employee can cancel own pending, Admin can delete any)
 */
router.delete('/:id', authenticate, auditLogger('Delete Overtime'), async (req, res) => {
    try {
        const overtime = await Overtime.findById(req.params.id);

        if (!overtime) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        // Permission check
        if (req.user.role === 'employee') {
            if (overtime.employee_id.toString() !== req.user.employee_id) {
                return res.status(403).json({
                    success: false,
                    message: 'Accès refusé'
                });
            }
            if (overtime.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: 'Vous ne pouvez annuler qu\'une demande en attente'
                });
            }
        }

        // Hard delete or Soft delete? Let's do soft delete as per audit requirements potentially, 
        // but Mongoose makes hard delete easy. The previous code did soft delete 'cancelled'.
        overtime.status = 'cancelled';
        await overtime.save();

        res.json({
            success: true,
            message: 'Demande annulée avec succès'
        });
    } catch (error) {
        console.error('DELETE OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de la suppression',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/overtime/employee/:employee_id
 * @desc    Get overtime for specific employee
 * @access  Private (Admin, Manager, or own data)
 */
router.get('/employee/:employee_id', authenticate, async (req, res) => {
    try {
        const { employee_id } = req.params;

        // Permission check
        if (req.user.role === 'employee' && employee_id !== req.user.employee_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        const overtimes = await Overtime.find({ employee_id }).sort({ date: -1 });

        res.json({
            success: true,
            count: overtimes.length,
            overtimes: overtimes.map(o => ({
                overtime_id: o._id,
                ...o.toObject()
            }))
        });
    } catch (error) {
        console.error('FETCH EMPLOYEE OVERTIME ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Échec de récupération',
            error: error.message
        });
    }
});

module.exports = router;
