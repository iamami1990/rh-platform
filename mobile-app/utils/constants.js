// API Configuration
export const API_BASE_URL = __DEV__
    ? 'http://192.168.1.4:5000/api' // Development
    : 'https://api.olympia-hr.com/api'; // Production (update when deployed)

// Leave Types
export const LEAVE_TYPES = [
    { value: 'annual', label: 'Congé annuel', icon: 'beach-access' },
    { value: 'sick', label: 'Congé maladie', icon: 'local-hospital' },
    { value: 'maternity', label: 'Congé maternité', icon: 'child-care' },
    { value: 'unpaid', label: 'Congé sans solde', icon: 'cancel' },
];

// Attendance Status
export const ATTENDANCE_STATUS = {
    PRESENT: 'present',
    LATE: 'late',
    ABSENT: 'absent',
};

// Leave Request Status
export const LEAVE_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

// App Version
export const APP_VERSION = '1.0.0';

// Cache Keys
export const CACHE_KEYS = {
    TOKEN: 'token',
    USER: 'user',
    LAST_SYNC: 'last_sync',
};
