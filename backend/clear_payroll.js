const { getPayrollCollection } = require('./config/database');

async function clearDec2025() {
    try {
        const snapshot = await getPayrollCollection().where('month', '==', '2025-12').get();
        console.log(`Found ${snapshot.size} records to delete.`);
        const batch = getPayrollCollection().firestore.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        console.log('Deleted successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearDec2025();
