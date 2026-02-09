require('dotenv').config();
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Employee = require('../models/Employee');
const User = require('../models/User');

const loadJson = (filePath) => {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file: ${filePath}`);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
};

const run = async () => {
    await connectDB();

    const dataDir = path.join(__dirname, '..', 'data');
    const employeesPath = path.join(dataDir, 'employees.json');
    const usersPath = path.join(dataDir, 'users.json');

    const employees = loadJson(employeesPath);
    const users = loadJson(usersPath);

    const employeeMap = new Map();

    for (const emp of employees) {
        const existing = await Employee.findOne({ email: emp.email });
        if (existing) {
            employeeMap.set(emp.legacy_id || emp.employee_id || emp.email, existing._id);
            continue;
        }

        const created = await Employee.create({
            firstName: emp.firstName,
            lastName: emp.lastName,
            email: emp.email,
            phone: emp.phone || '',
            department: emp.department,
            position: emp.position,
            contract_type: emp.contract_type || 'CDI',
            hireDate: emp.hireDate || new Date(),
            status: emp.status || 'active',
            salary_brut: emp.salary_brut || emp.gross_salary || 0,
            gross_salary: emp.gross_salary || emp.salary_brut || 0,
            cin: emp.cin || '',
            cnss_number: emp.cnss_number || ''
        });

        employeeMap.set(emp.legacy_id || emp.employee_id || emp.email, created._id);
    }

    for (const user of users) {
        const existing = await User.findOne({ email: user.email });
        if (existing) continue;

        const employeeRefKey = user.employee_id || user.employee_legacy_id || user.employee_email;
        const employeeId = employeeMap.get(employeeRefKey) || employeeMap.get(user.email) || null;

        let password = user.password || '';
        if (!password.startsWith('$2')) {
            password = await bcrypt.hash(password, 10);
        }

        await User.create({
            email: user.email,
            password,
            role: user.role || 'employee',
            employee: employeeId,
            employee_id: employeeId
        });
    }

    console.log('Legacy import complete');
    process.exit(0);
};

run().catch((err) => {
    console.error('Legacy import failed:', err.message);
    process.exit(1);
});
