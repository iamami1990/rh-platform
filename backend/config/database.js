const { db } = require('./firebase');

// Collection names
const COLLECTIONS = {
    USERS: 'users',
    EMPLOYEES: 'employees',
    ATTENDANCE: 'attendance',
    LEAVES: 'leaves',
    PAYROLL: 'payroll',
    SENTIMENT: 'sentiment_analysis',
    AUDIT_LOGS: 'audit_logs',
    FACE_EMBEDDINGS: 'face_embeddings',
    REFRESH_TOKENS: 'refresh_tokens',
    NOTIFICATIONS: 'notifications',
    OVERTIME: 'overtime'
};

// Get collection references
const getUsersCollection = () => db.collection(COLLECTIONS.USERS);
const getEmployeesCollection = () => db.collection(COLLECTIONS.EMPLOYEES);
const getAttendanceCollection = () => db.collection(COLLECTIONS.ATTENDANCE);
const getLeavesCollection = () => db.collection(COLLECTIONS.LEAVES);
const getPayrollCollection = () => db.collection(COLLECTIONS.PAYROLL);
const getSentimentCollection = () => db.collection(COLLECTIONS.SENTIMENT);
const getAuditLogsCollection = () => db.collection(COLLECTIONS.AUDIT_LOGS);
const getFaceEmbeddingsCollection = () => db.collection(COLLECTIONS.FACE_EMBEDDINGS);
const getRefreshTokensCollection = () => db.collection(COLLECTIONS.REFRESH_TOKENS);
const getNotificationsCollection = () => db.collection(COLLECTIONS.NOTIFICATIONS);
const getOvertimeCollection = () => db.collection(COLLECTIONS.OVERTIME);

// Database schema validation helpers
const validateEmployee = (data) => {
    const required = ['firstName', 'lastName', 'email', 'department', 'position', 'hireDate', 'salary_brut'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
};

const validateAttendance = (data) => {
    const required = ['employee_id', 'date', 'check_in_time'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
};

const validateLeave = (data) => {
    const required = ['employee_id', 'leave_type', 'start_date', 'end_date', 'days_requested'];
    const missing = required.filter(field => !data[field]);

    if (missing.length > 0) {
        throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    return true;
};

module.exports = {
    COLLECTIONS,
    getUsersCollection,
    getEmployeesCollection,
    getAttendanceCollection,
    getLeavesCollection,
    getPayrollCollection,
    getSentimentCollection,
    getAuditLogsCollection,
    getFaceEmbeddingsCollection,
    getRefreshTokensCollection,
    getNotificationsCollection,
    getOvertimeCollection,
    validateEmployee,
    validateAttendance,
    validateLeave
};

