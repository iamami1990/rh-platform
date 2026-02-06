const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and DOC files are allowed.'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter
});

/**
 * Middleware for single file upload
 */
const uploadSingle = (fieldName) => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.file) return next();

            // Construct public URL
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            req.fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
            next();
        });
    };
};

/**
 * Middleware for multiple files upload
 */
const uploadMultiple = (fieldName, maxCount = 5) => {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.files || req.files.length === 0) return next();

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            req.fileUrls = req.files.map(file => `${baseUrl}/uploads/${file.filename}`);
            next();
        });
    };
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    // Legacy support (no-op or simple delete)
    deleteFromFirebase: async () => true
};
