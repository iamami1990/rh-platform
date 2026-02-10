import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

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

// Response interceptor - handle 401 with token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't retry refresh-token or login requests
            if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue this request until refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(error);
            }

            try {
                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                    refreshToken: refreshToken
                });

                const { token: newToken, refreshToken: newRefreshToken } = response.data;
                localStorage.setItem('token', newToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me'),
    refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
    logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
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
    getMy: () => api.get('/payroll/my'),
    getReport: (month) => api.get('/payroll/report', { params: { month } }),
    downloadPDF: (id) => api.get(`/payroll/${id}/pdf`, { responseType: 'blob' }),
    exportSEPA: (month) => api.get(`/payroll/export/sepa/${month}`, { responseType: 'blob' }),
    exportExcel: (month) => api.get(`/payroll/export/excel/${month}`, { responseType: 'blob' }),
    getCNSSReport: (month) => api.get(`/payroll/statutory/cnss/${month}`),
    sendEmail: (id) => api.post(`/payroll/${id}/send-email`),
};

// Overtime API
export const overtimeAPI = {
    getAll: (params) => api.get('/overtime', { params }),
    getMy: () => api.get('/overtime/my'),
    getById: (id) => api.get(`/overtime/${id}`),
    create: (data) => api.post('/overtime', data),
    approve: (id, data) => api.put(`/overtime/${id}/approve`, data),
    reject: (id, data) => api.put(`/overtime/${id}/reject`, data),
    cancel: (id) => api.delete(`/overtime/${id}`),
    getByEmployee: (employeeId) => api.get(`/overtime/employee/${employeeId}`),
};

// Sentiment API
export const sentimentAPI = {
    getAll: (params) => api.get('/sentiment', { params }),
    getByEmployee: (id) => api.get(`/sentiment/${id}`),
    getMy: () => api.get('/sentiment/my'),
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
    getEmployeeInsights: (employeeId, params) => api.get(`/analytics/employee-insights/${employeeId}`, { params }),
    getTurnoverPrediction: () => api.get('/analytics/turnover-prediction'),
    getProductivityInsights: (params) => api.get('/analytics/productivity-insights', { params }),
    getTeamDynamics: (params) => api.get('/analytics/team-dynamics', { params }),
};

// Legal Reports API
export const legalAPI = {
    getCNSSReport: (month) => api.get(`/legal/cnss/${month}`, { responseType: 'blob' }),
    getIRAnnualReport: (year) => api.get(`/legal/ir-annual/${year}`, { responseType: 'blob' }),
    getWorkCertificate: (employeeId) => api.get(`/legal/work-certificate/${employeeId}`, { responseType: 'blob' }),
    getSalaryCertificate: (employeeId) => api.get(`/legal/salary-certificate/${employeeId}`, { responseType: 'blob' }),
};

// Notifications API
export const notificationAPI = {
    getAll: (params) => api.get('/notifications', { params }),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
    send: (data) => api.post('/notifications/send', data),
};

export default api;
