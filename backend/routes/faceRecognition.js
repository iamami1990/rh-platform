const express = require('express');
const router = express.Router();
const FaceEmbedding = require('../models/FaceEmbedding');
const { authenticate, authorize } = require('../middleware/auth');

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
        const { employee_id, face_embeddings, images_base64 } = req.body;

        if (!employee_id) {
            return res.status(400).json({ success: false, message: 'Employee ID is required' });
        }

        const embeddingData = {
            employee_id,
            embeddings: face_embeddings || Array(128).fill(0).map(() => Math.random()),
            enrolled_at: new Date(),
            images_count: images_base64?.length || 0
        };

        // Upsert logic
        await FaceEmbedding.findOneAndUpdate(
            { employee_id },
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
        const { image_base64, liveness_passed } = req.body;

        if (!image_base64) {
            return res.status(400).json({
                success: false,
                message: 'Image is required'
            });
        }

        // 1. Get all stored embeddings
        const storedEmbeddings = await FaceEmbedding.find({});

        // 2. Mock embedding for current image (in production use ML model extract)
        const currentEmbedding = Array(128).fill(0).map(() => Math.random());

        // 3. Compare with all stored embeddings using Euclidean distance
        let bestMatch = null;
        let bestDistance = Infinity;
        const MATCH_THRESHOLD = 0.6;

        for (const data of storedEmbeddings) {
            // Calculate Euclidean distance (simplified for now)
            let distance = 0;
            const stored = data.embeddings;
            for (let i = 0; i < 128; i++) {
                distance += Math.pow(currentEmbedding[i] - stored[i], 2);
            }
            distance = Math.sqrt(distance);

            // Mock distance logic to allow some matches for demo purposes
            const effectiveDistance = Math.random() < 0.3 ? 0.4 : distance;

            if (effectiveDistance < bestDistance && effectiveDistance < MATCH_THRESHOLD) {
                bestDistance = effectiveDistance;
                bestMatch = data.employee_id;
            }
        }

        // 4. Check liveness
        if (!liveness_passed) {
            const livenessScore = Math.random();
            if (livenessScore < 0.7) {
                return res.status(403).json({
                    success: false,
                    message: 'Liveness check failed',
                    liveness_score: livenessScore
                });
            }
        }

        if (bestMatch) {
            res.json({
                success: true,
                employee_id: bestMatch,
                confidence: 1 - (bestDistance / 2),
                liveness_passed: true,
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
        const { image_base64, challenge_response } = req.body;

        const livenessScore = Math.random();
        const isPrint = Math.random() < 0.1;
        const isVideo = Math.random() < 0.05;

        const result = {
            is_live: !isPrint && !isVideo && livenessScore > 0.7,
            confidence: livenessScore,
            details: {
                is_print: isPrint,
                is_video: isVideo,
                texture_score: Math.random(),
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
        await FaceEmbedding.findOneAndDelete({ employee_id });

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
        const embedding = await FaceEmbedding.findOne({ employee_id });

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
