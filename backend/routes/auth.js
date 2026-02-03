const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { auth } = require('../config/firebase');
const { getUsersCollection, getEmployeesCollection, getRefreshTokensCollection } = require('../config/database');
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

        // Create Firebase auth user
        const userRecord = await auth.createUser({
            email,
            password,
            emailVerified: false
        });

        // Hash password for our database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user document
        const userData = {
            user_id: userRecord.uid,
            email,
            password: hashedPassword,
            role, // 'admin', 'manager', 'employee'
            employee_id: employee_id || null,
            created_at: new Date(),
            last_login: null
        };

        await getUsersCollection().doc(userRecord.uid).set(userData);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                user_id: userRecord.uid,
                email,
                role
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

        // Find user by email
        const usersSnapshot = await getUsersCollection()
            .where('email', '==', email)
            .limit(1)
            .get();

        if (usersSnapshot.empty) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const userDoc = usersSnapshot.docs[0];
        const user = userDoc.data();

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await getUsersCollection().doc(userDoc.id).update({
            last_login: new Date()
        });

        // Generate JWT access token
        const token = jwt.sign(
            { user_id: userDoc.id, email: user.email, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Generate Refresh Token
        const refreshToken = crypto.randomBytes(40).toString('hex');
        const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await getRefreshTokensCollection().doc(refreshToken).set({
            user_id: userDoc.id,
            expires_at: refreshExpires,
            created_at: new Date()
        });

        res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: {
                user_id: userDoc.id,
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

        const rtDoc = await getRefreshTokensCollection().doc(refreshToken).get();

        if (!rtDoc.exists) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const rtData = rtDoc.data();
        if (new Date() > rtData.expires_at.toDate()) {
            await getRefreshTokensCollection().doc(refreshToken).delete();
            return res.status(401).json({ success: false, message: 'Refresh token expired' });
        }

        // Get user info
        const userDoc = await getUsersCollection().doc(rtData.user_id).get();
        if (!userDoc.exists) {
            return res.status(401).json({ success: false, message: 'User no longer exists' });
        }
        const user = userDoc.data();

        // Rotate Tokens (Delete old, create new)
        await getRefreshTokensCollection().doc(refreshToken).delete();

        const newToken = jwt.sign(
            { user_id: userDoc.id, email: user.email, role: user.role, employee_id: user.employee_id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        const newRefreshToken = crypto.randomBytes(40).toString('hex');
        const newExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await getRefreshTokensCollection().doc(newRefreshToken).set({
            user_id: userDoc.id,
            expires_at: newExpires,
            created_at: new Date()
        });

        res.json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
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
            await getRefreshTokensCollection().doc(refreshToken).delete();
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
            const empDoc = await getEmployeesCollection().doc(req.user.employee_id).get();
            if (empDoc.exists) {
                employeeData = empDoc.data();
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

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const usersSnapshot = await getUsersCollection().where('email', '==', email).limit(1).get();

        if (usersSnapshot.empty) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userDoc = usersSnapshot.docs[0];
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpires = new Date(Date.now() + 3600000); // 1 hour

        await getUsersCollection().doc(userDoc.id).update({
            reset_token: resetToken,
            reset_token_expires: resetExpires
        });

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

        const snapshot = await getUsersCollection()
            .where('reset_token', '==', token)
            .get();

        if (snapshot.empty) {
            return res.status(400).json({ success: false, message: 'Invalid or expired token' });
        }

        const userDoc = snapshot.docs[0];
        const userData = userDoc.data();

        if (new Date() > userData.reset_token_expires.toDate()) {
            return res.status(400).json({ success: false, message: 'Token expired' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update in Firebase Auth and Firestore
        await auth.updateUser(userData.user_id, {
            password: newPassword
        });

        await getUsersCollection().doc(userDoc.id).update({
            password: hashedPassword,
            reset_token: null,
            reset_token_expires: null
        });

        res.json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Reset failed', error: error.message });
    }
});

module.exports = router;
