// Test bcrypt comparison to debug login issue
const bcrypt = require('bcryptjs');

const password = 'Admin123!';
const hash = '$2a$10$TpuBF.Vf9SJyouGGk7ArTuehy6/R5AxjLaiFuNV6rK5lxhKizXc9C';

console.log('Testing bcrypt comparison...\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('');

bcrypt.compare(password, hash, (err, result) => {
    if (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }

    console.log('Match result:', result);

    if (result) {
        console.log('✅ Password matches hash!');
        console.log('\nThe hash is correct. Login should work.');
        console.log('If login still fails, check:');
        console.log('1. Firebase Authentication has the same password');
        console.log('2. The document ID matches the Firebase Auth UID');
        console.log('3. All fields in Firestore are saved correctly');
    } else {
        console.log('❌ Password does NOT match hash!');
        console.log('\nTry entering exactly: Admin123!');
        console.log('(capital A, no spaces, exclamation mark at the end)');
    }

    process.exit(0);
});
