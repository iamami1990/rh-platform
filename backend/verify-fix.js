const { db } = require('./config/firebase');

async function verifyFix() {
    try {
        console.log('🔍 Verifying Leaves Fix (In-memory sort)...');

        const status = 'pending';
        console.log(`Querying leaves with status: ${status} (WITHOUT orderBy in query)`);

        const snapshot = await db.collection('leaves')
            .where('status', '==', status)
            .get();

        console.log(`✅ Query Success! Found ${snapshot.size} leaves.`);

        let leaves = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // In-memory sort
        leaves.sort((a, b) => {
            const dateA = a.created_at?.toDate?.() || new Date(a.created_at);
            const dateB = b.created_at?.toDate?.() || new Date(b.created_at);
            return dateB - dateA;
        });

        console.log('\n📊 Sorted Results:');
        leaves.forEach(l => {
            console.log(`- ${l.id}: ${l.status} (Created: ${l.created_at?.toDate?.() || l.created_at})`);
        });

    } catch (error) {
        console.error('❌ VERIFICATION FAILED!');
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

verifyFix();
