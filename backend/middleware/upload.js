const multer = require('multer');
const { storage } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allowed file types
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.'));
        }
    }
});

/**
 * Upload file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - Original file name
 * @param {String} folder - Folder path in storage
 * @returns {Promise<String>} - Public URL
 */
const uploadToFirebase = async (fileBuffer, fileName, folder = 'uploads') => {
    try {
        const bucket = storage.bucket();
        const fileExtension = path.extname(fileName);
        const uniqueFileName = `${folder}/${uuidv4()}${fileExtension}`;

        const file = bucket.file(uniqueFileName);

        await file.save(fileBuffer, {
            metadata: {
                contentType: getMimeType(fileExtension),
                metadata: {
                    originalName: fileName
                }
            },
            public: true
        });

        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

        return publicUrl;
    } catch (error) {
        console.error('Firebase upload error:', error);
        throw new Error('File upload failed');
    }
};

/**
 * Get MIME type from file extension
 */
const getMimeType = (extension) => {
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

/**
 * Delete file from Firebase Storage
 * @param {String} fileUrl - Public URL of the file
 */
const deleteFromFirebase = async (fileUrl) => {
    try {
        const bucket = storage.bucket();
        const fileName = fileUrl.split('/').pop();

        await bucket.file(fileName).delete();

        return true;
    } catch (error) {
        console.error('Firebase delete error:', error);
        return false;
    }
};

/**
 * Middleware for single file upload
 */
const uploadSingle = (fieldName, folder = 'uploads') => {
    return async (req, res, next) => {
        upload.single(fieldName)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            if (!req.file) {
                return next();
            }

            try {
                const url = await uploadToFirebase(
                    req.file.buffer,
                    req.file.originalname,
                    folder
                );

                req.fileUrl = url;
                next();
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'File upload failed',
                    error: error.message
                });
            }
        });
    };
};

/**
 * Middleware for multiple files upload
 */
const uploadMultiple = (fieldName, maxCount = 5, folder = 'uploads') => {
    return async (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            if (!req.files || req.files.length === 0) {
                return next();
            }

            try {
                const uploadPromises = req.files.map(file =>
                    uploadToFirebase(file.buffer, file.originalname, folder)
                );

                const urls = await Promise.all(uploadPromises);
                req.fileUrls = urls;
                next();
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Files upload failed',
                    error: error.message
                });
            }
        });
    };
};

module.exports = {
    uploadToFirebase,
    deleteFromFirebase,
    uploadSingle,
    uploadMultiple
};
