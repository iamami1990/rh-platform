import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Redux store with all reducers
const store = configureStore({
    reducer: {
        auth: authReducer,
        // Future reducers will be added here:
        // employees: employeesReducer,
        // attendance: attendanceReducer,
        // leaves: leavesReducer,
        // payroll: payrollReducer,
        // sentiment: sentimentReducer,
    },
});

export default store;
