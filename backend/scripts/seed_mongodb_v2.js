const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Employee = require('../models/Employee');

async function seedDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/rh_platform');
        console.log('✓ Connected to MongoDB');

        // Clear existing data (optional, but good for test consistency)
        // await User.deleteMany({ email: { $in: ['admin@olympia-hr.com', 'employe@olympia-hr.com'] } });
        // await Employee.deleteMany({ email: 'employe@olympia-hr.com' });

        const salt = await bcrypt.genSalt(10);
        const adminPassword = await bcrypt.hash('admin123', salt);
        const employeePassword = await bcrypt.hash('employe123', salt);

        // 1. Create Admin
        let adminUser = await User.findOne({ email: 'admin@olympia-hr.com' });
        if (!adminUser) {
            adminUser = await User.create({
                user_id: 'admin-' + Date.now(),
                email: 'admin@olympia-hr.com',
                password: adminPassword,
                role: 'admin'
            });
            console.log('✓ Admin user created');
        } else {
            adminUser.password = adminPassword;
            if (!adminUser.user_id) adminUser.user_id = 'admin-legacy-' + Date.now();
            await adminUser.save();
            console.log('✓ Admin user updated');
        }

        // 2. Create Employee Profile
        let employeeProfile = await Employee.findOne({ email: 'employe@olympia-hr.com' });
        if (!employeeProfile) {
            employeeProfile = await Employee.create({
                employee_id: 'EMP-001-' + Date.now(),
                firstName: 'Jean',
                lastName: 'Dupont',
                email: 'employe@olympia-hr.com',
                department: 'Développement',
                position: 'Développeur',
                contract_type: 'CDI',
                hireDate: new Date('2024-01-01'),
                salary_brut: 3500,
                status: 'active'
            });
            console.log('✓ Employee profile created');
        }

        // 3. Create Employee User
        let employeeUser = await User.findOne({ email: 'employe@olympia-hr.com' });
        if (!employeeUser) {
            employeeUser = await User.create({
                user_id: 'emp-' + Date.now(),
                email: 'employe@olympia-hr.com',
                password: employeePassword,
                role: 'employee',
                employee_id: employeeProfile._id
            });
            console.log('✓ Employee user created');
        } else {
            employeeUser.password = employeePassword;
            employeeUser.employee_id = employeeProfile._id;
            if (!employeeUser.user_id) employeeUser.user_id = 'emp-legacy-' + Date.now();
            await employeeUser.save();
            console.log('✓ Employee user updated');
        }

        console.log('\n========================================');
        console.log('Test Credentials (MongoDB):');
        console.log('Admin:    admin@olympia-hr.com    / admin123');
        console.log('Employee: employe@olympia-hr.com  / employe123');
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seedDatabase();
