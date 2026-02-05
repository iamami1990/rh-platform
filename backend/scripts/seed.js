const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Employee = require('../models/Employee');
const connectDB = require('../config/db');

const seedData = async () => {
    try {
        await connectDB();

        console.log('🌱 Clearning existing data...');
        await User.deleteMany({});
        await Employee.deleteMany({});

        console.log('🌱 Seeding Admin User...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await User.create({
            user_id: uuidv4(),
            email: 'admin@rhplatform.com',
            password: hashedPassword,
            role: 'admin',
            created_at: new Date()
        });

        console.log('✅ Admin user created: admin@rhplatform.com / admin123');

        console.log('🌱 Seeding Sample Employee...');
        const employeeId = uuidv4();

        const employee = await Employee.create({
            employee_id: employeeId,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@rhplatform.com',
            position: 'Software Engineer',
            department: 'IT',
            contract_type: 'CDI',
            status: 'active',
            date_of_birth: '1990-01-01',
            salary_brut: 3500,
            hireDate: '2022-01-01',
            created_at: new Date()
        });

        const empPassword = await bcrypt.hash('employee123', 10);
        await User.create({
            user_id: uuidv4(),
            email: 'john.doe@rhplatform.com',
            password: empPassword,
            role: 'employee',
            employee_id: employeeId,
            created_at: new Date()
        });

        console.log('✅ Sample employee created: john.doe@rhplatform.com / employee123');

        console.log('🚀 Seeding completed!');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedData();
