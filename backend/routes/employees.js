const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadToStorage } = require('../utils/fileUpload');
const multer = require('multer');

// Configure multer for memory storage (fileUpload utility handles the rest)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * @route   GET /api/employees
 * @desc    Get all employees with pagination and multi-criteria filtering
 * @access  Private (Admin, Manager)
 */
router.get('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            department,
            status,
            search,
            contract_type,
            position,
            minSalary,
            maxSalary
        } = req.query;

        // Build query
        const query = {};

        if (department) query.department = department;
        if (status) query.status = status;
        if (contract_type) query.contract_type = contract_type;
        if (position) query.position = position;

        if (minSalary || maxSalary) {
            query.salary_brut = {};
            if (minSalary) query.salary_brut.$gte = Number(minSalary);
            if (maxSalary) query.salary_brut.$lte = Number(maxSalary);
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex }
            ];
        }

        // Pagination
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { created_at: -1 }
        };

        // Note: Using mongoose aggregate or simple find + skip/limit
        const total = await Employee.countDocuments(query);
        const employees = await Employee.find(query)
            .sort({ created_at: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: employees.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            employees
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employees',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const employee = await Employee.findOne({ employee_id: req.params.id });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch employee',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/employees
 * @desc    Create new employee
 * @access  Private (Admin)
 */
router.post('/', authenticate, authorize('admin'), auditLogger('Create Employee'), async (req, res) => {
    try {
        const employeeId = uuidv4();

        const employeeData = {
            ...req.body,
            employee_id: employeeId,
            status: req.body.status || 'active'
        };

        const employee = await Employee.create(employeeData);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to create employee',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private (Admin)
 */
router.put('/:id', authenticate, authorize('admin'), auditLogger('Update Employee'), async (req, res) => {
    try {
        const employee = await Employee.findOneAndUpdate(
            { employee_id: req.params.id },
            {
                ...req.body,
                updated_at: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully',
            employee
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update employee',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee (soft delete)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), auditLogger('Delete Employee'), async (req, res) => {
    try {
        const employee = await Employee.findOneAndUpdate(
            { employee_id: req.params.id },
            {
                status: 'inactive',
                updated_at: Date.now()
            },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            message: 'Employee deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete employee',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/employees/:id/documents
 * @desc    Upload document for employee
 * @access  Private (Admin, Manager)
 */
router.post('/:id/documents', authenticate, authorize('admin', 'manager'), upload.single('document'), auditLogger('Upload Employee Document'), async (req, res) => {
    try {
        const { type, name } = req.body;
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const url = await uploadToStorage(req.file, `employees/${req.params.id}`);

        const docData = {
            id: uuidv4(),
            name: name || req.file.originalname,
            type: type || 'other',
            url,
            uploaded_at: new Date(),
            uploaded_by: req.user.user_id
        };

        // Update employee document list using $push
        // Note: strict schema might need mixed type for 'documents' or a separate Schema. 
        // For now Assuming flexible schema or we add documents array to Employee model if strictly needed.
        // I will add { documents: [] } to Employee model if it errors, but Mongoose usually ignores unknown fields unless told otherwise.
        // Wait, I defined Employee model earlier without 'documents'. I should probably update the model or accept that it might be stripped if I enabled strict mode.
        // Mongoose 6+ strict is true by default. I should add 'documents' to Employee Schema.

        const employee = await Employee.findOneAndUpdate(
            { employee_id: req.params.id },
            { $push: { documents: docData } },
            { new: true }
        );

        if (!employee) {
            // If model doesn't support it, we might error or it just won't save.
            // Let's assume we need to add it to schema.
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            document: docData
        });
    } catch (error) {
        console.error('UPLOAD ERROR:', error);
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

module.exports = router;
