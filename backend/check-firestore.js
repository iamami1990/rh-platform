// Check what's actually in Firestore
const { db } = require('./config/firebase');

async function checkFirestoreUser() {
    try {
        console.log('🔍 Checking Firestore for user...\n');

        const email = 'admin@olympia-hr.com';
        console.log('Searching for email:', email);

        // Query by email
        const usersSnapshot = await db.collection('users')
            .where('email', '==', email)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            console.log('\n❌ USER NOT FOUND in Firestore!');
            console.log('\nPossible reasons:');
            console.log('1. Email field in Firestore has different value');
            console.log('2. Document doesn\'t exist');
            console.log('3. Field name is different (check capitalization)');

            // Try to list all users
            console.log('\n📋 Listing all users in Firestore:');
            const allUsers = await db.collection('users').limit(10).get();

            if (allUsers.empty) {
                console.log('   No users found at all!');
                console.log('   Collection "users" might be empty');
            } else {
                console.log(`   Found ${allUsers.size} user(s):`);
                allUsers.forEach(doc => {
                    const data = doc.data();
                    console.log(`   - ID: ${doc.id}`);
                    console.log(`     Email: ${data.email}`);
                    console.log(`     Role: ${data.role}`);
                    console.log('');
                });
            }
        } else {
            const userDoc = usersSnapshot.docs[0];
            const userData = userDoc.data();

            console.log('\n✅ USER FOUND in Firestore!');
            console.log('Document ID:', userDoc.id);
            console.log('\nUser data:');
            console.log(JSON.stringify(userData, null, 2));

            console.log('\nChecking password field...');
            if (userData.password) {
                console.log('✓ Password hash exists:', userData.password.substring(0, 20) + '...');
            } else {
                console.log('❌ Password field is missing!');
            }
        }

        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkFirestoreUser();
