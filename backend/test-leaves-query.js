const { db } = require('./config/firebase');

async function testLeavesQuery() {
    try {
        console.log('🔍 Testing Leaves Query...');

        const status = 'pending';
        console.log(`Querying leaves with status: ${status} ordered by created_at DESC`);

        const snapshot = await db.collection('leaves')
            .where('status', '==', status)
            .orderBy('created_at', 'desc')
            .get();

        console.log(`✅ Success! Found ${snapshot.size} leaves.`);
        snapshot.forEach(doc => {
            console.log(`- ${doc.id}: ${doc.data().status} (Created: ${doc.data().created_at?.toDate?.() || doc.data().created_at})`);
        });

    } catch (error) {
        console.error('❌ QUERY FAILED!');
        console.error('Error Message:', error.message);
        if (error.message.includes('index')) {
            console.log('\n💡 This confirms it is a missing Firestore index issue.');
            console.log('You need to create a composite index for:');
            console.log('Collection: leaves');
            console.log('Fields: status (Ascending) and created_at (Descending)');
        }
    } finally {
        process.exit(0);
    }
}

testLeavesQuery();
