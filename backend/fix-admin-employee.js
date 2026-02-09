const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');

async function fixAdminEmployee() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/rh_platform');
        console.log('Connected to MongoDB');

        const ADMIN_EMAIL = 'admin@olympia-hr.com';

        // 1. Find the admin user
        const user = await User.findOne({ email: ADMIN_EMAIL });
        if (!user) {
            console.log(`User ${ADMIN_EMAIL} not found`);
            process.exit(1);
        }

        console.log(`Found user: ${user.email} (ID: ${user._id})`);

        // 2. Check if employee record exists
        let employee = await Employee.findOne({ email: ADMIN_EMAIL });

        if (!employee) {
            console.log('Creating new Employee record for Admin...');
            employee = new Employee({
                firstName: 'Admin',
                lastName: 'Olympia',
                email: ADMIN_EMAIL,
                department: 'Administration',
                position: 'System Administrator',
                contract_type: 'CDI',
                hireDate: new Date(),
                salary_brut: 5000,
                status: 'active',
                employee_id: 'EMP-ADMIN-001'
            });
            await employee.save();
            console.log('Employee record created');
        } else {
            console.log('Employee record already exists');
        }

        // 3. Link user to employee
        if (user.employee_id?.toString() !== employee._id.toString()) {
            user.employee_id = employee._id;
            await user.save();
            console.log('User linked to Employee record');
        } else {
            console.log('User already linked to Employee record');
        }

        console.log('\n✅ Admin user setup complete!');
        console.log(`Employee ID: ${employee._id}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixAdminEmployee();
