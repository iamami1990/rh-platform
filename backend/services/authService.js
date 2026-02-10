const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const RefreshToken = require('../models/RefreshToken');
const { sendEmail } = require('../utils/emailService');

const SALT_ROUNDS = 10;

/**
 * Register a new user (admin/rh only)
 */
const registerUser = async ({ email, password, role, employee_id }) => {
    if (!email || !password || !role) {
        const err = new Error('Please provide email, password, and role');
        err.statusCode = 400;
        throw err;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
        const err = new Error('Invalid email format');
        err.statusCode = 400;
        throw err;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const err = new Error('Email already registered');
        err.statusCode = 400;
        throw err;
    }

    if (employee_id) {
        const employee = await Employee.findById(employee_id);
        if (!employee) {
            const err = new Error('Employee not found');
            err.statusCode = 404;
            throw err;
        }
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = new User({
        email,
        password: hashedPassword,
        role,
        employee: employee_id || null,
        employee_id: employee_id || null,
        created_at: new Date()
    });

    await newUser.save();

    return {
        user_id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        employee_id: newUser.employee ? newUser.employee.toString() : null
    };
};

/**
 * Login user and return JWT + refresh token
 */
const loginUser = async ({ email, password }) => {
    if (!email || !password) {
        const err = new Error('Please provide email and password');
        err.statusCode = 400;
        throw err;
    }

    const user = await User.findOne({ email });
    if (!user) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        throw err;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const err = new Error('Invalid credentials');
        err.statusCode = 401;
        throw err;
    }

    user.last_login = new Date();
    await user.save();

    const employeeId = user.employee
        ? user.employee.toString()
        : (user.employee_id ? user.employee_id.toString() : null);

    const token = jwt.sign(
        { user_id: user._id, email: user.email, role: user.role, employee_id: employeeId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '24h' }
    );

    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
        token: refreshTokenValue,
        user: user._id,
        expires_at: refreshExpires
    });

    return {
        token,
        refreshToken: refreshTokenValue,
        user: {
            user_id: user._id,
            email: user.email,
            role: user.role,
            employee_id: employeeId
        }
    };
};

/**
 * Refresh JWT using a refresh token (with rotation)
 */
const refreshAccessToken = async (refreshToken) => {
    if (!refreshToken) {
        const err = new Error('Refresh token required');
        err.statusCode = 400;
        throw err;
    }

    const rtDoc = await RefreshToken.findOne({ token: refreshToken }).populate('user');

    if (!rtDoc) {
        const err = new Error('Invalid refresh token');
        err.statusCode = 401;
        throw err;
    }

    if (new Date() > rtDoc.expires_at) {
        await RefreshToken.deleteOne({ _id: rtDoc._id });
        const err = new Error('Refresh token expired');
        err.statusCode = 401;
        throw err;
    }

    const user = rtDoc.user;
    if (!user) {
        await RefreshToken.deleteOne({ _id: rtDoc._id });
        const err = new Error('User no longer exists');
        err.statusCode = 401;
        throw err;
    }

    // Rotate tokens
    await RefreshToken.deleteOne({ _id: rtDoc._id });

    const employeeId = user.employee
        ? user.employee.toString()
        : (user.employee_id ? user.employee_id.toString() : null);

    const newToken = jwt.sign(
        { user_id: user._id, email: user.email, role: user.role, employee_id: employeeId },
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

    return { token: newToken, refreshToken: newRefreshTokenValue };
};

/**
 * Logout user and revoke refresh token
 */
const logoutUser = async (refreshToken) => {
    if (refreshToken) {
        await RefreshToken.deleteOne({ token: refreshToken });
    }
};

/**
 * Get current user info with employee data
 */
const getCurrentUser = async (userPayload) => {
    let employeeData = null;

    if (userPayload.employee_id) {
        const emp = await Employee.findById(userPayload.employee_id);
        employeeData = emp ? emp.toObject() : null;
    }

    return {
        user_id: userPayload.user_id,
        email: userPayload.email,
        role: userPayload.role,
        employee_id: userPayload.employee_id || null,
        employee: employeeData
    };
};

/**
 * Request password reset — sends email with token
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    user.reset_token = resetToken;
    user.reset_token_expires = resetExpires;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

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
};

/**
 * Reset password using token
 */
const resetPassword = async ({ token, newPassword }) => {
    const user = await User.findOne({
        reset_token: token,
        reset_token_expires: { $gt: new Date() }
    });

    if (!user) {
        const err = new Error('Invalid or expired token');
        err.statusCode = 400;
        throw err;
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getCurrentUser,
    forgotPassword,
    resetPassword
};
