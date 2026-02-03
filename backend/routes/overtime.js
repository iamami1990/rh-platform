const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { getOvertimeCollection, getEmployeesCollection } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { validateCreateOvertime, validateApproveOvertime, validateRejectOvertime } = require('../models');

/**
 * @route   POST /api/overtime
 * @desc    Create overtime request
 * @access  Private (Employee can request for themselves, Manager/Admin for anyone)
 */
router.post('/', authenticate, auditLogger('Create Overtime Request'), async (req, res) => {
    try {
        // Validate input
        const { error, value } = validateCreateOvertime(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const { employee_id, date, hours, start_time, end_time, rate_type, overtime_category, reason, description, project_id, task_name } = value;

        // Permission check: employees can only create for themselves
        if (req.user.role === 'employee' && employee_id !== req.user.employee_id) {
            return res.status(403).json({
                success: false,
                message: 'Vous ne pouvez créer une demande que pour vous-même'
            });
        }

        // Get employee data for calculations
        const empDoc = await getEmployeesCollection().doc(employee_id).get();
        if (!empDoc.exists) {
            return res.status(404).json({ success: false, message: 'Employé non trouvé' });
        }
        const employee = empDoc.data();

        // Calculate month from date
        const overtimeMonth = moment(date, 'YYYY-MM-DD').format('YYYY-MM');

        // Calculate base hourly rate
        const baseSalary = Number(employee.salary_brut || employee.gross_salary || 0);
        const baseHourlyRate = baseSalary / (22 * 8); // 22 working days * 8 hours

        // Calculate amount based on rate type
        let rateMultiplier = 1.25; // Default 125%
        if (rate_type === '150%') rateMultiplier = 1.5;
        if (rate_type === '200%') rateMultiplier = 2.0;

        const amount = baseHourlyRate * hours * rateMultiplier;

        // Create overtime record
        const overtimeData = {
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
            created_at: new Date(),
            updated_at: new Date(),
            manager_comments: ''
        };

        const overtimeId = uuidv4();
        await getOvertimeCollection().doc(overtimeId).set(overtimeData);

        res.status(201).json({
            success: true,
            message: 'Demande d\'heures supplémentaires créée avec succès',
            overtime: {
                overtime_id: overtimeId,
                ...overtimeData
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
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const { employee_id, month, status } = req.query;

        let query = getOvertimeCollection();

        // Apply filters
        if (employee_id) {
            query = query.where('employee_id', '==', employee_id);
        }
        if (status) {
            query = query.where('status', '==', status);
        }
        if (month) {
            query = query.where('month', '==', month);
        }

        const snapshot = await query.get();
        let overtimes = snapshot.docs.map(doc => ({
            overtime_id: doc.id,
            ...doc.data()
        }));

        // Sort in-memory to avoid index requirements
        overtimes.sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
            const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
            return dateB - dateA; // Descending
        });

        res.json({
            success: true,
            count: overtimes.length,
            overtimes
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

        const snapshot = await getOvertimeCollection()
            .where('employee_id', '==', employeeId)
            .get();

        const overtimes = snapshot.docs.map(doc => ({
            overtime_id: doc.id,
            ...doc.data()
        }));

        overtimes.sort((a, b) => b.date.localeCompare(a.date));

        res.json({
            success: true,
            count: overtimes.length,
            overtimes
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
        const doc = await getOvertimeCollection().doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Demande d\'heures supplémentaires non trouvée'
            });
        }

        const overtime = doc.data();

        // Permission check: employees can only view their own
        if (req.user.role === 'employee' && overtime.employee_id !== req.user.employee_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé'
            });
        }

        res.json({
            success: true,
            overtime: {
                overtime_id: doc.id,
                ...overtime
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
router.put('/:id/approve', authenticate, authorize('admin', 'manager'), auditLogger('Approve Overtime'), async (req, res) => {
    try {
        const { error, value } = validateApproveOvertime(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const overtimeRef = getOvertimeCollection().doc(req.params.id);
        const doc = await overtimeRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        const overtime = doc.data();

        if (overtime.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cette demande a déjà été ${overtime.status}`
            });
        }

        await overtimeRef.update({
            status: 'approved',
            approved_by: req.user.user_id,
            approved_at: new Date(),
            manager_comments: value.manager_comments || '',
            updated_at: new Date()
        });

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
router.put('/:id/reject', authenticate, authorize('admin', 'manager'), auditLogger('Reject Overtime'), async (req, res) => {
    try {
        const { error, value } = validateRejectOvertime(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: error.details.map(d => d.message)
            });
        }

        const overtimeRef = getOvertimeCollection().doc(req.params.id);
        const doc = await overtimeRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        const overtime = doc.data();

        if (overtime.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cette demande a déjà été ${overtime.status}`
            });
        }

        await overtimeRef.update({
            status: 'rejected',
            approved_by: req.user.user_id,
            approved_at: new Date(),
            rejection_reason: value.rejection_reason,
            manager_comments: value.manager_comments || '',
            updated_at: new Date()
        });

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
        const overtimeRef = getOvertimeCollection().doc(req.params.id);
        const doc = await overtimeRef.get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        const overtime = doc.data();

        // Permission check
        if (req.user.role === 'employee') {
            if (overtime.employee_id !== req.user.employee_id) {
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

        // Soft delete: mark as cancelled
        await overtimeRef.update({
            status: 'cancelled',
            updated_at: new Date()
        });

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

        const snapshot = await getOvertimeCollection()
            .where('employee_id', '==', employee_id)
            .get();

        let overtimes = snapshot.docs.map(doc => ({
            overtime_id: doc.id,
            ...doc.data()
        }));

        overtimes.sort((a, b) => b.date.localeCompare(a.date));

        res.json({
            success: true,
            count: overtimes.length,
            overtimes
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
