const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { authLimiter } = require('../middleware/rateLimiter');
const authService = require('../services/authService');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (admin only)
 * @access  Private (Admin)
 */
router.post('/register', authenticate, authorize('admin'), auditLogger('User Registration'), async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);
        res.status(201).json({ success: true, message: 'User registered', user });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authLimiter, async (req, res) => {
    try {
        const result = await authService.loginUser(req.body);
        res.json({ success: true, message: 'Login successful', ...result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT using refresh token
 * @access  Public
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const result = await authService.refreshAccessToken(req.body.refreshToken);
        res.json({ success: true, ...result });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        await authService.logoutUser(req.body.refreshToken);
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await authService.getCurrentUser(req.user);
        res.json({ success: true, user });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
    try {
        await authService.forgotPassword(req.body.email);
        res.json({ success: true, message: 'Password reset email sent' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
    try {
        await authService.resetPassword(req.body);
        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
});

module.exports = router;
