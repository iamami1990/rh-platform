const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Payroll = require('./models/Payroll');

mongoose.connect('mongodb://127.0.0.1:27017/rh_platform')
    .then(async () => {
        console.log('Connected to MongoDB');

        // 1. Get all employees
        const employees = await Employee.find({});
        console.log(`\nTotal Employees: ${employees.length}`);
        employees.forEach(emp => {
            console.log(`- [${emp.status}] ${emp.firstName} ${emp.lastName} (ID: ${emp._id}, Hire: ${emp.hireDate})`);
        });

        // 2. Get payrolls for Dec 2025
        const month = '2025-12';
        const payrolls = await Payroll.find({ month });
        console.log(`\nTotal Payrolls for ${month}: ${payrolls.length}`);
        payrolls.forEach(p => {
            console.log(`- EmployeeID: ${p.employee_id}, Net: ${p.net_salary}, Status: ${p.status}`);
        });

        // 3. Identify missing
        const empIdsWithPayroll = payrolls.map(p => p.employee_id.toString());
        const missing = employees.filter(e => e.status === 'active' && !empIdsWithPayroll.includes(e._id.toString()));

        if (missing.length > 0) {
            console.log('\nMissing Payrolls for Active Employees:');
            missing.forEach(m => console.log(`- ${m.firstName} ${m.lastName} (${m._id})`));
        } else {
            console.log('\nAll active employees have payrolls.');
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
