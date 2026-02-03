// Generate bcrypt hash for password
const bcrypt = require('bcryptjs');

const password = 'Admin123!';

bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }
    console.log('\n✅ Bcrypt hash generated!\n');
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('\nCopy this hash to Firestore:');
    console.log(hash);
    console.log('\n');
    process.exit(0);
});
