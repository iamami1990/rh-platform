const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadSingle } = require('../middleware/upload');
const employeeService = require('../services/employeeService');

/**
 * @route   GET /api/employees
 * @desc    Get all employees with pagination and filtering
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const result = await employeeService.getEmployees(req.query);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to fetch employees' });
    }
});

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        res.json({ success: true, employee });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin)
 */
router.post('/', authenticate, authorize('admin'), auditLogger('Create Employee'), async (req, res) => {
    try {
        const employee = await employeeService.createEmployee(req.body);
        res.status(201).json({ success: true, message: 'Employee created successfully', employee });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: 'Failed to create employee' });
    }
});

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, authorize('admin'), auditLogger('Update Employee'), async (req, res) => {
    try {
        const employee = await employeeService.updateEmployee(req.params.id, req.body);
        res.json({ success: true, message: 'Employee updated successfully', employee });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   DELETE /api/employees/:id
 * @desc    Soft-delete employee
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), auditLogger('Delete Employee'), async (req, res) => {
    try {
        await employeeService.deleteEmployee(req.params.id);
        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/employees/:id/documents
 * @desc    Upload document for employee
 * @access  Private (Admin, Manager)
 */
router.post('/:id/documents', authenticate, authorize('admin', 'manager'), uploadSingle('document'), auditLogger('Upload Employee Document'), async (req, res) => {
    try {
        if (!req.file || !req.fileUrl) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const document = await employeeService.uploadDocument(req.params.id, {
            name: req.body.name || req.file.originalname,
            type: req.body.type,
            url: req.fileUrl,
            uploadedBy: req.user.user_id
        });
        res.json({ success: true, message: 'Document uploaded successfully', document });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   PUT /api/employees/:id/pin
 * @desc    Set kiosk PIN
 * @access  Private (Admin, RH)
 */
router.put('/:id/pin', authenticate, authorize('admin', 'rh'), auditLogger('Set Kiosk PIN'), async (req, res) => {
    try {
        await employeeService.setKioskPin(req.params.id, req.body.pin);
        res.json({ success: true, message: 'Kiosk PIN updated' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

module.exports = router;
