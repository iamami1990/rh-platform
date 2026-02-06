const mongoose = require('mongoose');
const Payroll = require('./models/Payroll');

mongoose.connect('mongodb://127.0.0.1:27017/rh_platform')
    .then(async () => {
        console.log('Connected to MongoDB');

        // List indexes
        const indexes = await Payroll.collection.indexes();
        console.log('Current Indexes:', indexes);

        // Drop payroll_id_1 if exists
        const badIndex = indexes.find(idx => idx.name === 'payroll_id_1');
        if (badIndex) {
            console.log('Found bad index payroll_id_1. Dropping...');
            await Payroll.collection.dropIndex('payroll_id_1');
            console.log('Dropped payroll_id_1');
        } else {
            console.log('payroll_id_1 not found (might have a different name?)');
        }

        // Check if there is any other index on payroll_id
        const otherBad = indexes.find(idx => idx.key.payroll_id);
        if (otherBad && otherBad.name !== 'payroll_id_1') {
            console.log('Found another index on payroll_id:', otherBad.name);
            await Payroll.collection.dropIndex(otherBad.name);
            console.log('Dropped', otherBad.name);
        }

        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
