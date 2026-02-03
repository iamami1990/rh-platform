const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { getEmployeesCollection } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { uploadToStorage } = require('../utils/fileUpload');
const multer = require('multer');

// Configure multer for memory storage
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

        let query = getEmployeesCollection();

        // Apply Firestore filters (Equality only generally)
        if (department) query = query.where('department', '==', department);
        if (status) query = query.where('status', '==', status);
        if (contract_type) query = query.where('contract_type', '==', contract_type);
        if (position) query = query.where('position', '==', position);

        // Execute query
        const snapshot = await query.get();
        let employees = snapshot.docs.map(doc => ({
            employee_id: doc.id,
            ...doc.data()
        }));

        // Advanced filtering in-memory
        if (minSalary) employees = employees.filter(emp => emp.gross_salary >= Number(minSalary));
        if (maxSalary) employees = employees.filter(emp => emp.gross_salary <= Number(maxSalary));

        // Search filter
        if (search) {
            const s = search.toLowerCase();
            employees = employees.filter(emp =>
                emp.firstName?.toLowerCase().includes(s) ||
                emp.lastName?.toLowerCase().includes(s) ||
                emp.email?.toLowerCase().includes(s) ||
                emp.matricule?.toLowerCase().includes(s)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + parseInt(limit);
        const paginatedEmployees = employees.slice(startIndex, endIndex);

        res.json({
            success: true,
            count: paginatedEmployees.length,
            total: employees.length,
            page: parseInt(page),
            totalPages: Math.ceil(employees.length / limit),
            employees: paginatedEmployees
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
        const doc = await getEmployeesCollection().doc(req.params.id).get();

        if (!doc.exists) {
            return res.status(404).json({
                success: false,
                message: 'Employee not found'
            });
        }

        res.json({
            success: true,
            employee: {
                employee_id: doc.id,
                ...doc.data()
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
            status: req.body.status || 'active',
            created_at: new Date(),
            updated_at: new Date()
        };

        const employeeId = uuidv4();
        await getEmployeesCollection().doc(employeeId).set(employeeData);

        res.status(201).json({
            success: true,
            message: 'Employee created successfully',
            employee: {
                employee_id: employeeId,
                ...employeeData
            }
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
        const updateData = {
            ...req.body,
            updated_at: new Date()
        };

        await getEmployeesCollection().doc(req.params.id).update(updateData);

        res.json({
            success: true,
            message: 'Employee updated successfully'
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
 * @desc    Delete employee (soft delete - set status to inactive)
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate, authorize('admin'), auditLogger('Delete Employee'), async (req, res) => {
    try {
        await getEmployeesCollection().doc(req.params.id).update({
            status: 'inactive',
            updated_at: new Date()
        });

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

        // Update employee document list
        const empRef = getEmployeesCollection().doc(req.params.id);
        const empDoc = await empRef.get();
        if (!empDoc.exists) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        const currentDocs = empDoc.data().documents || [];
        await empRef.update({
            documents: [...currentDocs, docData],
            updated_at: new Date()
        });

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
