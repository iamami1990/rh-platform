import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    refreshToken: () => api.post('/auth/refresh-token'),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Employees API
export const employeesAPI = {
    getAll: (params) => api.get('/employees', { params }),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
    uploadDocument: (id, formData) => api.post(`/employees/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

// Attendance API
export const attendanceAPI = {
    checkIn: (data) => api.post('/attendance/check-in', data),
    checkOut: (data) => api.post('/attendance/check-out', data),
    getAll: (params) => api.get('/attendance', { params }),
    getByEmployee: (id) => api.get(`/attendance/employee/${id}`),
};

// Leaves API
export const leavesAPI = {
    getAll: (params) => api.get('/leaves', { params }),
    create: (data) => api.post('/leaves', data),
    approve: (id) => api.put(`/leaves/${id}/approve`),
    reject: (id) => api.put(`/leaves/${id}/reject`),
    getBalance: (employeeId) => api.get(`/leaves/balance/${employeeId}`),
    getCalendar: () => api.get('/leaves/calendar'),
};

// Payroll API
export const payrollAPI = {
    getAll: (params) => api.get('/payroll', { params }),
    getById: (id) => api.get(`/payroll/${id}`),
    generate: (month) => api.post('/payroll/generate', { month }),
    getReport: (month) => api.get('/payroll/report', { params: { month } }),
    downloadPDF: (id) => api.get(`/payroll/${id}/pdf`, { responseType: 'blob' }),
    exportSEPA: (month) => api.get(`/payroll/export/sepa/${month}`, { responseType: 'blob' }),
    exportExcel: (month) => api.get(`/payroll/export/excel/${month}`, { responseType: 'blob' }),
    getCNSSReport: (month) => api.get(`/payroll/statutory/cnss/${month}`),
    sendEmail: (id) => api.post(`/payroll/${id}/send-email`),
};

// Sentiment API
export const sentimentAPI = {
    getAll: (params) => api.get('/sentiment', { params }),
    getByEmployee: (id) => api.get(`/sentiment/${id}`),
    generate: (month) => api.post('/sentiment/generate', { month }),
    getAlerts: (params) => api.get('/sentiment/alerts', { params }),
    exportReport: (employeeId) => api.get(`/sentiment/report/export/${employeeId}`, { responseType: 'blob' }),
};

// Dashboard API
export const dashboardAPI = {
    getAdmin: () => api.get('/dashboard/admin'),
    getManager: () => api.get('/dashboard/manager'),
    getEmployee: () => api.get('/dashboard/employee'),
};

// Analytics API
export const analyticsAPI = {
    getBehavioralPatterns: (params) => api.get('/analytics/behavioral-patterns', { params }),
    getTurnoverPrediction: () => api.get('/analytics/turnover-prediction'),
    getProductivityInsights: () => api.get('/analytics/productivity-insights'),
    getTeamDynamics: (params) => api.get('/analytics/team-dynamics', { params }),
};

export default api;
