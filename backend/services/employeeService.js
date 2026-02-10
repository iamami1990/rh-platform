const Employee = require('../models/Employee');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

/**
 * Get all employees with pagination and filtering
 */
const getEmployees = async (filters = {}) => {
    const {
        page = 1, limit = 20, department, status, search,
        contract_type, position, minSalary, maxSalary
    } = filters;

    const query = {};
    if (department) query.department = department;
    if (status) query.status = status;
    if (contract_type) query.contract_type = contract_type;
    if (position) query.position = position;

    if (minSalary || maxSalary) {
        query.gross_salary = {};
        if (minSalary) query.gross_salary.$gte = Number(minSalary);
        if (maxSalary) query.gross_salary.$lte = Number(maxSalary);
    }

    if (search) {
        query.$or = [
            { firstName: { $regex: search, $options: 'i' } },
            { lastName: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { matricule: { $regex: search, $options: 'i' } }
        ];
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
        .sort({ created_at: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum);

    return {
        count: employees.length,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        employees: employees.map(e => ({ employee_id: e._id, ...e.toObject() }))
    };
};

/**
 * Get a single employee by ID
 */
const getEmployeeById = async (id) => {
    const employee = await Employee.findById(id);
    if (!employee) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }
    return { employee_id: employee._id, ...employee.toObject() };
};

/**
 * Create a new employee
 */
const createEmployee = async (data) => {
    const employeeData = { ...data, status: data.status || 'active' };
    const newEmployee = new Employee(employeeData);
    await newEmployee.save();
    return { employee_id: newEmployee._id, ...newEmployee.toObject() };
};

/**
 * Update an employee
 */
const updateEmployee = async (id, data) => {
    const updated = await Employee.findByIdAndUpdate(
        id, { $set: data }, { new: true, runValidators: true }
    );
    if (!updated) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }
    return { employee_id: updated._id, ...updated.toObject() };
};

/**
 * Soft-delete an employee (set status to inactive)
 */
const deleteEmployee = async (id) => {
    const deleted = await Employee.findByIdAndUpdate(id, { status: 'inactive' }, { new: true });
    if (!deleted) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }
};

/**
 * Upload a document for an employee
 */
const uploadDocument = async (employeeId, { name, type, url, uploadedBy }) => {
    const allowedTypes = ['CIN', 'CV', 'Contract', 'Diploma', 'Medical', 'Other'];
    const docData = {
        name,
        type: allowedTypes.includes(type) ? type : 'Other',
        url,
        uploaded_at: new Date(),
        uploaded_by: uploadedBy
    };

    const employee = await Employee.findByIdAndUpdate(
        employeeId, { $push: { documents: docData } }, { new: true }
    );
    if (!employee) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }
    return docData;
};

/**
 * Set or reset kiosk PIN for an employee
 */
const setKioskPin = async (employeeId, pin) => {
    if (!pin || pin.length < 4) {
        const err = new Error('PIN must be at least 4 digits');
        err.statusCode = 400;
        throw err;
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
        const err = new Error('Employee not found');
        err.statusCode = 404;
        throw err;
    }

    const user = await User.findOne({
        $or: [{ employee: employee._id }, { employee_id: employee._id }]
    });
    if (!user) {
        const err = new Error('User not found for this employee');
        err.statusCode = 404;
        throw err;
    }

    user.kiosk_pin_hash = await bcrypt.hash(pin, 10);
    await user.save();
};

module.exports = {
    getEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    uploadDocument,
    setKioskPin
};
