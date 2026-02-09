require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const moment = require('moment');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const sentimentRoutes = require('./routes/sentiment');
const dashboardRoutes = require('./routes/dashboard');
const faceRecognitionRoutes = require('./routes/faceRecognition');
const notificationsRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const overtimeRoutes = require('./routes/overtime');
const legalRoutes = require('./routes/legal');
const kioskRoutes = require('./routes/kiosk');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

const connectDB = require('./config/db');
const { markAbsencesForDate } = require('./utils/absenceService');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Daily absence job (runs at 23:50)
cron.schedule('50 23 * * *', async () => {
    try {
        const today = moment().format('YYYY-MM-DD');
        await markAbsencesForDate(today);
        console.log(`[ABSENCE JOB] Processed absences for ${today}`);
    } catch (error) {
        console.error('[ABSENCE JOB] Error:', error.message);
    }
});

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.NODE_ENV === 'development'
        ? '*' // Allow all origins in development for mobile app
        : (process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000']),
    credentials: true
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Olympia HR API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes (with rate limiting)
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/sentiment', sentimentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/face-recognition', faceRecognitionRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/kiosk', kioskRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
    });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Olympia HR API running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
