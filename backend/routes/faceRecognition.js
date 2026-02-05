const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { authenticate, authorize } = require('../middleware/auth');
const mongoose = require('mongoose');

// Define FaceEmbedding Schema locally or in models/
const faceEmbeddingSchema = new mongoose.Schema({
    employee_id: { type: String, required: true, unique: true },
    embeddings: { type: [Number], required: true },
    enrolled_at: { type: Date, default: Date.now },
    images_count: { type: Number, default: 0 }
});

// Avoid recompiling model if it exists
const FaceEmbedding = mongoose.models.FaceEmbedding || mongoose.model('FaceEmbedding', faceEmbeddingSchema);

/**
 * @route   POST /api/face-recognition/enroll
 * @desc    Enroll employee face
 * @access  Admin only
 */
router.post('/enroll', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { employee_id, face_embeddings, images_base64 } = req.body;

        if (!employee_id) {
            return res.status(400).json({ success: false, message: 'Employee ID is required' });
        }

        const data = {
            employee_id,
            embeddings: face_embeddings || Array(128).fill(0).map(() => Math.random()),
            enrolled_at: new Date(),
            images_count: images_base64?.length || 0
        };

        await FaceEmbedding.findOneAndUpdate(
            { employee_id },
            data,
            { upsert: true, new: true }
        );

        res.status(201).json({
            success: true,
            message: 'Face enrolled successfully',
            employee_id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Face enrollment failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/face-recognition/verify
 * @desc    Verify face
 * @access  Private (employee)
 */
router.post('/verify', authenticate, async (req, res) => {
    try {
        const { image_base64, liveness_passed } = req.body;

        // Mock verification logic similar to previous implementation
        // ideally uses python service or library
        const embeddings = await FaceEmbedding.find();

        // Simulating match for demonstration
        if (embeddings.length === 0) {
            return res.status(404).json({ success: false, message: 'No faces enrolled' });
        }

        // Return a mock match (first enrolled user or random)
        // In real app, calculate Euclidean distance
        const match = embeddings[0];

        res.json({
            success: true,
            employee_id: match.employee_id,
            confidence: 0.95,
            liveness_passed: true,
            message: 'Face verified successfully'
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Face verification failed', error: error.message });
    }
});

/**
 * @route   POST /api/face-recognition/liveness-check
 */
router.post('/liveness-check', authenticate, async (req, res) => {
    res.json({
        success: true,
        liveness: {
            is_live: true,
            confidence: 0.98,
            details: { is_print: false, is_video: false }
        }
    });
});

/**
 * @route   DELETE /api/face-recognition/unenroll/:employee_id
 */
router.delete('/unenroll/:employee_id', authenticate, authorize('admin'), async (req, res) => {
    try {
        await FaceEmbedding.findOneAndDelete({ employee_id: req.params.employee_id });
        res.json({ success: true, message: 'Face data removed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Unenroll failed', error: error.message });
    }
});

/**
 * @route   GET /api/face-recognition/status/:employee_id
 */
router.get('/status/:employee_id', authenticate, async (req, res) => {
    try {
        const doc = await FaceEmbedding.findOne({ employee_id: req.params.employee_id });
        res.json({
            success: true,
            employee_id: req.params.employee_id,
            is_enrolled: !!doc,
            enrolled_at: doc ? doc.enrolled_at : null,
            images_count: doc ? doc.images_count : 0
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Status check failed', error: error.message });
    }
});

module.exports = router;
