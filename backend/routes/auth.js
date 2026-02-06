const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
// const Employee = require('../models/Employee'); // Will be enabled once Employee model is migrated
const { authenticate } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { sendEmail } = require('../utils/emailService');

// Helper to validate email format (basic)
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (Admin only)
 * @access  Private (Admin)
 */
router.post('/register', authenticate, auditLogger('User Registration'), async (req, res) => {
    try {
        const { email, password, role, employee_id } = req.body;

        // Validate input
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and role'
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            employee_id: employee_id || null,
            created_at: new Date()
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                user_id: newUser._id,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user and return JWT token
 * @access  Public
 */
router.post('/login', auditLogger('User Login'), async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.last_login = new Date();
        await user.save();

        // Generate JWT access token
        const token = jwt.sign(
            { user_id: user._id, email: user.email, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Generate Refresh Token
        const refreshTokenValue = crypto.randomBytes(40).toString('hex');
        const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await RefreshToken.create({
            token: refreshTokenValue,
            user: user._id,
            expires_at: refreshExpires
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken: refreshTokenValue,
            user: {
                user_id: user._id,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token using Refresh Token
 * @access  Public
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token required' });
        }

        const rtDoc = await RefreshToken.findOne({ token: refreshToken }).populate('user');

        if (!rtDoc) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        if (new Date() > rtDoc.expires_at) {
            await RefreshToken.deleteOne({ _id: rtDoc._id });
            return res.status(401).json({ success: false, message: 'Refresh token expired' });
        }

        const user = rtDoc.user;
        if (!user) {
            // Orphaned token
            await RefreshToken.deleteOne({ _id: rtDoc._id });
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }

        // Rotate Tokens (Delete old, create new)
        await RefreshToken.deleteOne({ _id: rtDoc._id });

        const newToken = jwt.sign(
            { user_id: user._id, email: user.email, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        const newRefreshTokenValue = crypto.randomBytes(40).toString('hex');
        const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await RefreshToken.create({
            token: newRefreshTokenValue,
            user: user._id,
            expires_at: newExpires
        });

        res.json({
            success: true,
            token: newToken,
            refreshToken: newRefreshTokenValue
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and revoke refresh token
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            await RefreshToken.deleteOne({ token: refreshToken });
        }
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Logout error', error: error.message });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        let employeeData = null;

        if (req.user.employee_id) {
            // Need to migrate Employee to Mongoose before this works fully
            // const emp = await Employee.findById(req.user.employee_id);
            // employeeData = emp;
        }

        res.json({
            success: true,
            user: {
                user_id: req.user.user_id,
                email: req.user.email,
                role: req.user.role,
                employee: employeeData
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user info',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        user.reset_token = resetToken;
        user.reset_token_expires = resetExpires;
        await user.save();

        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;

        await sendEmail({
            to: email,
            subject: 'Réinitialisation de mot de passe - Olympia HR',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Demande de réinitialisation de mot de passe</h2>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Olympia HR.</p>
                    <p>Veuillez cliquer sur le lien ci-dessous pour procéder :</p>
                    <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
                    <p>Si vous n'avez pas demandé cette action, veuillez ignorer cet email.</p>
                </div>
            `
        });

        res.json({ success: true, message: 'Reset email sent' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Failed to send reset email', error: error.message });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', auditLogger('Password Reset'), async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        const user = await User.findOne({
            reset_token: token,
            reset_token_expires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.reset_token = null;
        user.reset_token_expires = null;
        await user.save();

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Reset failed', error: error.message });
    }
});

module.exports = router;
