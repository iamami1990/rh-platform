require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
        process.exit(1);
    }

    await connectDB();

    const existing = await User.findOne({ email });
    if (existing) {
        console.log('Admin user already exists');
        process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
        email,
        password: hashedPassword,
        role: 'admin'
    });

    console.log('Admin user created');
    process.exit(0);
};

run().catch((err) => {
    console.error('Seed admin failed:', err.message);
    process.exit(1);
});
