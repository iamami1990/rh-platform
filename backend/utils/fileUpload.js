const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload file to Local Storage

 * @param {Object} file - Multer file object
 * @param {String} folder - Destination folder (subfolder in uploads)
 * @returns {Promise<String>} Public URL path of the uploaded file
 */
const uploadToStorage = async (file, folder = 'documents') => {
    return new Promise((resolve, reject) => {
        if (!file) reject('No file provided');

        try {
            const targetFolder = path.join(uploadsDir, folder);
            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }

            const fileName = `${uuidv4()}_${file.originalname.replace(/\s+/g, '_')}`;
            const filePath = path.join(targetFolder, fileName);

            fs.writeFile(filePath, file.buffer, (err) => {
                if (err) {
                    reject(err);
                } else {
                    // Return a relative URL that can be served by express.static
                    // Assuming /uploads is served statically
                    resolve(`/uploads/${folder}/${fileName}`);
                }
            });
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { uploadToStorage };
