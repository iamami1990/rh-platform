import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../services/api';

// Async thunks
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, { rejectWithValue }) => {
        try {
            const response = await authAPI.login(credentials);
            const { token, user } = response.data;

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            return { token, user };
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Login failed' });
        }
    }
);

export const getMe = createAsyncThunk(
    'auth/getMe',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authAPI.getMe();
            return response.data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Failed to get user' });
        }
    }
);

// Initial state
const initialState = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
};

// Slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Login
        builder.addCase(login.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.token = action.payload.token;
        });
        builder.addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.payload?.message || 'Login failed';
        });

        // Get Me
        builder.addCase(getMe.fulfilled, (state, action) => {
            state.user = action.payload;
        });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
