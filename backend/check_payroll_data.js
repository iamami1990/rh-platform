const { getPayrollCollection } = require('./config/database');

async function checkData() {
    try {
        const snapshot = await getPayrollCollection().limit(5).get();
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log(`Payroll ID: ${doc.id}`);
            console.log(`- Base Salary: ${data.gross_salary} (${typeof data.gross_salary})`);
            console.log(`- Net Salary: ${data.net_salary} (${typeof data.net_salary})`);
            console.log(`- Total Gross: ${data.total_gross} (${typeof data.total_gross})`);
            console.log(`- Bonuses:`, data.bonuses);
            console.log(`- Allowances:`, data.allowances);
            console.log('-------------------');
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
