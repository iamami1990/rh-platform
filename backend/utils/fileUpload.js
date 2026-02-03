const { bucket } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

/**
 * Upload file to Firebase Storage
 * @param {Object} file - Multer file object
 * @param {String} folder - Destination folder in storage
 * @returns {Promise<String>} Public URL of the uploaded file
 */
const uploadToStorage = async (file, folder = 'documents') => {
    return new Promise((resolve, reject) => {
        if (!file) reject('No file provided');

        const fileName = `${folder}/${uuidv4()}_${file.originalname}`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
            metadata: {
                contentType: file.mimetype
            }
        });

        blobStream.on('error', (error) => {
            reject(error);
        });

        blobStream.on('finish', async () => {
            // The file upload is complete.
            try {
                // Get a signed URL for a long duration (alternative to making it public)
                const [url] = await fileUpload.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2500' // Far future
                });
                resolve(url);
            } catch (error) {
                reject(error);
            }
        });

        blobStream.end(file.buffer);
    });
};

module.exports = { uploadToStorage };
