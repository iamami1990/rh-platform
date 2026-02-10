import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL =
    Constants.expoConfig?.extra?.API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

// Token refresh state
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
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            // Silently fail - request will proceed without auth
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
            // Don't retry auth endpoints
            if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
                await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await AsyncStorage.getItem('refreshToken');
                if (!refreshToken) {
                    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
                    return Promise.reject(error);
                }

                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                    refreshToken: refreshToken
                });

                const { token: newToken, refreshToken: newRefreshToken } = response.data;
                await AsyncStorage.setItem('token', newToken);
                if (newRefreshToken) {
                    await AsyncStorage.setItem('refreshToken', newRefreshToken);
                }

                originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
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
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, refreshToken, user } = response.data;

        // Store credentials
        await AsyncStorage.setItem('token', token);
        if (refreshToken) await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return { token, refreshToken, user };
    },

    logout: async () => {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        await api.post('/auth/logout', { refreshToken }).catch(() => { });
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
    },

    getMe: () => api.get('/auth/me'),
};

// Attendance API
export const attendanceAPI = {
    checkIn: (data) => api.post('/attendance/check-in', data),
    checkOut: (data) => api.post('/attendance/check-out', data),
    getHistory: (employeeId) => api.get(`/attendance/employee/${employeeId}`),
};

// Leaves API
export const leavesAPI = {
    getBalance: (employeeId) => api.get(`/leaves/balance/${employeeId}`),
    request: (data) => api.post('/leaves', data),
    getMyLeaves: async () => {
        const userStr = await AsyncStorage.getItem('user');
        const user = JSON.parse(userStr);
        return api.get(`/leaves?employee_id=${user.employee_id}`);
    },
};

// Payroll API
export const payrollAPI = {
    getMyPayrolls: () => api.get('/payroll/my'),
    getPayroll: (id) => api.get(`/payroll/${id}`),
};

// Overtime API
export const overtimeAPI = {
    getMy: () => api.get('/overtime/my'),
    create: (data) => api.post('/overtime', data),
    cancel: (id) => api.delete(`/overtime/${id}`),
};

// Sentiment API
export const sentimentAPI = {
    getMySentiment: () => api.get('/sentiment/my'),
};

// Dashboard API
export const dashboardAPI = {
    getEmployee: () => api.get('/dashboard/employee'),
};

// Notifications API
export const notificationAPI = {
    getAll: () => api.get('/notifications'),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
};

// Kiosk API
export const kioskAPI = {
    verify: (data) => api.post('/kiosk/verify', data),
    checkIn: (data) => api.post('/kiosk/check-in', data),
    checkOut: (data) => api.post('/kiosk/check-out', data),
    leave: (data) => api.post('/kiosk/leave', data),
    payrollSlip: (data) => api.post('/kiosk/payroll-slip', data),
};

export default api;
