import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import LeavesPage from './pages/LeavesPage';
import PayrollPage from './pages/PayrollPage';
import SentimentPage from './pages/SentimentPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MainLayout from './components/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route
                path="/"
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="employees" element={<EmployeesPage />} />
                <Route path="attendance" element={<AttendancePage />} />
                <Route path="leaves" element={<LeavesPage />} />
                <Route path="payroll" element={<PayrollPage />} />
                <Route path="sentiment" element={<SentimentPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
        </Routes>
    );
}

export default App;
