const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://127.0.0.1:27017/rh_platform')
    .then(async () => {
        console.log('Connected to MongoDB');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        await User.findOneAndUpdate(
            { email: 'admin@test.com' },
            {
                email: 'admin@test.com',
                password: hashedPassword,
                firstName: 'Admin',
                lastName: 'Test',
                role: 'admin',
                user_id: 'admin_123',
                status: 'active'
            },
            { upsert: true, new: true }
        );
        console.log('Admin created: admin@test.com / password123');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
