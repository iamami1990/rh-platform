const express = require('express');
const router = express.Router();
// const { v4: uuidv4 } = require('uuid'); // MongoDB handles IDs
const Employee = require('../models/Employee');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadSingle } = require('../middleware/upload');
const bcrypt = require('bcryptjs');

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

        const query = {};

        // Filters
        if (department) query.department = department;
        if (status) query.status = status;
        if (contract_type) query.contract_type = contract_type;
        if (position) query.position = position;

        // Range filters
        if (minSalary || maxSalary) {
            query.gross_salary = {};
            if (minSalary) query.gross_salary.$gte = Number(minSalary);
            if (maxSalary) query.gross_salary.$lte = Number(maxSalary);
        }

        // Search
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { matricule: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { created_at: -1 }
        };

        // Note: Using pure Mongoose find/skip/limit
        const total = await Employee.countDocuments(query);
        const employees = await Employee.find(query)
            .sort({ created_at: -1 })
            .skip((options.page - 1) * options.limit)
            .limit(options.limit);

        res.json({
            success: true,
            count: employees.length,
            total,
            page: options.page,
            totalPages: Math.ceil(total / options.limit),
            employees: employees.map(e => ({
                employee_id: e._id,
                ...e.toObject()
            }))
        });
    } catch (error) {
        console.error(error);
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
        const employee = await Employee.findById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        // Map to expected format if needed (Mongoose docs are close enough)
        res.json({
            success: true,
            employee: {
                employee_id: employee._id, // Add alias for frontend compatibility
                ...employee.toObject()
            }
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
        const employeeData = {
            ...req.body,
            status: req.body.status || 'active'
        };

        const newEmployee = new Employee(employeeData);
        await newEmployee.save();

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            employee: {
                employee_id: newEmployee._id,
                ...newEmployee.toObject()
            }
        });
    } catch (error) {
        console.error('Error creating employee:', error);
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
        const updatedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        res.json({
            success: true,
            message: 'Employee updated successfully',
            employee: {
                employee_id: updatedEmployee._id,
                ...updatedEmployee.toObject()
            }
        });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update employee',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee (soft delete - set status to inactive)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), auditLogger('Delete Employee'), async (req, res) => {
    try {
        const deletedEmployee = await Employee.findByIdAndUpdate(
            req.params.id,
            { status: 'inactive' },
            { new: true }
        );

        if (!deletedEmployee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
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
router.post('/:id/documents', authenticate, authorize('admin', 'manager'), uploadSingle('document'), auditLogger('Upload Employee Document'), async (req, res) => {
    try {
        const { type, name } = req.body;
        if (!req.file || !req.fileUrl) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const allowedTypes = ['CIN', 'CV', 'Contract', 'Diploma', 'Medical', 'Other'];
        const normalizedType = allowedTypes.includes(type) ? type : 'Other';

        const docData = {
            name: name || req.file.originalname,
            type: normalizedType,
            url: req.fileUrl,
            uploaded_at: new Date(),
            uploaded_by: req.user.user_id, // This comes from JWT
        };

        const employee = await Employee.findByIdAndUpdate(
            req.params.id,
            { $push: { documents: docData } },
            { new: true }
        );

        if (!employee) {
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

/**
 * @route   PUT /api/employees/:id/pin
 * @desc    Set or reset kiosk PIN for employee
 * @access  Private (Admin, RH)
 */
router.put('/:id/pin', authenticate, authorize('admin', 'rh'), auditLogger('Set Kiosk PIN'), async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin || pin.length < 4) {
            return res.status(400).json({ success: false, message: 'PIN must be at least 4 digits' });
        }

        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const user = await User.findOne({ $or: [{ employee: employee._id }, { employee_id: employee._id }] });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found for this employee' });
        }

        const hashedPin = await bcrypt.hash(pin, 10);
        user.kiosk_pin_hash = hashedPin;
        await user.save();

        res.json({ success: true, message: 'Kiosk PIN updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update PIN', error: error.message });
    }
});

module.exports = router;
