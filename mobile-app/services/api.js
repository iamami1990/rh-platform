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

// Request interceptor - add auth token
api.interceptors.request.use(
    async (config) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting token:', error);
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
    async (error) => {
        if (error.response?.status === 401) {
            // Token expired - logout
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            // Navigate to login (implement navigation logic)
        }
        return Promise.reject(error);
    }
);

// Authentication API
export const authAPI = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;

        // Store credentials
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user', JSON.stringify(user));

        return { token, user };
    },

    logout: async () => {
        await api.post('/auth/logout');
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('user');
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
        // Get current user to extract employee_id
        const userStr = await AsyncStorage.getItem('user');
        const user = JSON.parse(userStr);
        // Fetch leaves filtered by employee_id
        return api.get(`/leaves?employee_id=${user.employee_id}`);
    },
};

// Payroll API
export const payrollAPI = {
    getMyPayrolls: () => api.get('/payroll/my'),
    getPayroll: (id) => api.get(`/payroll/${id}`),
};

// Sentiment API
export const sentimentAPI = {
    getMySentiment: () => api.get('/sentiment/my'),
};

// Dashboard API
export const dashboardAPI = {
    getEmployee: () => api.get('/dashboard/employee'),
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
