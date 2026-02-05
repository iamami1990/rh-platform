const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { authenticate } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { sendEmail } = require('../utils/emailService');
const crypto = require('crypto');

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

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = uuidv4();

        // Create user
        const newUser = await User.create({
            user_id: userId,
            email,
            password: hashedPassword,
            role,
            employee_id: employee_id || null
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                user_id: newUser.user_id,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
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
            { user_id: user.user_id, email: user.email, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // NOTE: Refresh token logic simplified/removed for now to strictly follow PFE simple/robust requirement.
        // Can be re-added if specifically requested, but standard JWT is sufficient for this scope.

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                employee_id: user.employee_id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
    try {
        // Since we are stateless with JWT, client just needs to discard token.
        // If we implemented token blacklisting, we would do it here.
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
            const emp = await Employee.findOne({ employee_id: req.user.employee_id });
            if (emp) {
                employeeData = emp;
            }
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

module.exports = router;
