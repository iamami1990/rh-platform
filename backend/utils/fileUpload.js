const { uploadSingle } = require('../middleware/upload');

// Since we moved to local storage in middleware/upload.js, 
// this utility might be redundant if it was just wrapping Firebase.
// However, the routes might be calling a function 'uploadToStorage'.
// We need to maintain backward compatibility or refactor the routes.

// Looking at leaves.js: 
// const { uploadToStorage } = require('../utils/fileUpload');
// document_url = await uploadToStorage(req.file, `leaves/${employee_id}`);

// So we need to provide 'uploadToStorage' that behaves similarly but for local files.
// BUT, the middleware/upload.js in previous step configured Multer to save disk directly.
// So req.file.path or req.file.filename is already available in the route helper.
// We should check how leaves.js uses it.

// Update: In leaves.js, `upload.single('justification')` is used from `multer`.
// Wait, leaves.js imports `multer` locally AND `uploadToStorage`. 
// That's a conflict or double handling.

// Let's redirect `uploadToStorage` to return the file path if it's already uploaded,
// or handle the stream if it was memory storage.

// The `middleware/upload.js` I wrote uses diskStorage. 
// If leaves.js still uses `multer.memoryStorage()`, then `req.file.buffer` exists.
// Code in leaves.js: `const upload = multer({ storage: multer.memoryStorage() ... })`
// So leaves.js is NOT using my new middleware yet.

// I should rewrite `utils/fileUpload.js` to handle the buffer save to disk.

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Save buffer to local disk (Replacement for Firebase Storage upload)
 * @param {Object} file - Multer file object (with buffer)
 * @param {String} folder - Subfolder (ignored in flat public/uploads structure for simplicity, or we can make subdirs)
 * @returns {Promise<String>} - Public URL
 */
const uploadToStorage = async (file, folder = 'uploads') => {
    return new Promise((resolve, reject) => {
        try {
            // Ensure subdirectory exists if needed, or just flatten. 
            // Let's flatten for simplicity as per middleware/upload.js

            const filename = `${uuidv4()}${path.extname(file.originalname)}`;
            const filepath = path.join(uploadDir, filename);

            fs.writeFile(filepath, file.buffer, (err) => {
                if (err) reject(err);

                // Assuming server runs on process.env.BASE_URL or localhost:5000
                // We'll return a relative path or absolute URL if allowed.
                // Better to return relative path '/uploads/filename' and let frontend handle base URL,
                // or hardcode a heuristic.

                const publicUrl = `/uploads/${filename}`;
                resolve(publicUrl);
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = {
    uploadToStorage
};
