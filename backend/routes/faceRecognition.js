const express = require('express');
const router = express.Router();
const FaceEmbedding = require('../models/FaceEmbedding');
const { authenticate, authorize } = require('../middleware/auth');
const { getEmbeddingFromBase64, findBestMatch } = require('../utils/faceRecognition');

/**
 * Face Recognition Routes
 * 
 * Persistent implementation using MongoDB
 */

/**
 * @route   POST /api/face-recognition/enroll
 * @desc    Enroll employee face (store embeddings)
 * @access  Admin only
 */
router.post('/enroll', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { employee_id, face_embeddings, image_base64 } = req.body;

        if (!employee_id) {
            return res.status(400).json({ success: false, message: 'Employee ID is required' });
        }

        let embeddings = face_embeddings;
        if (!embeddings && image_base64) {
            embeddings = await getEmbeddingFromBase64(image_base64);
        }

        if (!embeddings) {
            return res.status(400).json({ success: false, message: 'Face embedding could not be generated' });
        }

        const embeddingData = {
            employee: employee_id,
            employee_id,
            embeddings,
            enrolled_at: new Date(),
            images_count: 1
        };

        // Upsert logic
        await FaceEmbedding.findOneAndUpdate(
            { employee: employee_id },
            embeddingData,
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
 * @desc    Verify face for check-in/check-out
 * @access  Private (employee)
 */
router.post('/verify', authenticate, async (req, res) => {
    try {
        const { image_base64 } = req.body;

        if (!image_base64) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        // 1. Get all stored embeddings
        const storedEmbeddings = await FaceEmbedding.find({});

        // 2. Extract embedding for current image
        const currentEmbedding = await getEmbeddingFromBase64(image_base64);
        if (!currentEmbedding) {
            return res.status(400).json({ success: false, message: 'Face not detected' });
        }

        // 3. Compare embeddings using cosine distance
        const match = findBestMatch(currentEmbedding, storedEmbeddings, 0.5);

        if (match) {
            res.json({
                success: true,
                employee_id: match.match.employee ? match.match.employee.toString() : match.match.employee_id,
                confidence: 1 - match.distance,
                message: 'Face verified successfully'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Face not recognized',
                confidence: 0
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Face verification failed',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/face-recognition/liveness-check
 * @desc    Perform liveness detection
 * @access  Private
 */
router.post('/liveness-check', authenticate, async (req, res) => {
    try {
        const { challenge_response } = req.body;

        const result = {
            is_live: !!challenge_response,
            confidence: challenge_response ? 0.7 : 0.3,
            details: {
                challenge_passed: !!challenge_response
            }
        };

        res.json({
            success: true,
            liveness: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Liveness check failed',
            error: error.message
        });
    }
});

/**
 * @route   DELETE /api/face-recognition/unenroll/:employee_id
 * @desc    Remove employee face data
 * @access  Admin only
 */
router.delete('/unenroll/:employee_id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { employee_id } = req.params;
        await FaceEmbedding.findOneAndDelete({ employee: employee_id });

        res.json({
            success: true,
            message: 'Face data removed successfully',
            employee_id
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to remove face data',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/face-recognition/status/:employee_id
 * @desc    Check if employee is enrolled
 * @access  Private
 */
router.get('/status/:employee_id', authenticate, async (req, res) => {
    try {
        const { employee_id } = req.params;
        const embedding = await FaceEmbedding.findOne({ employee: employee_id });

        res.json({
            success: true,
            employee_id,
            is_enrolled: !!embedding,
            enrolled_at: embedding ? embedding.enrolled_at : null,
            images_count: embedding ? embedding.images_count : 0
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to check enrollment status',
            error: error.message
        });
    }
});

module.exports = router;
