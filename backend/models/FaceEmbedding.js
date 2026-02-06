const mongoose = require('mongoose');

const faceEmbeddingSchema = new mongoose.Schema({
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    embeddings: {
        type: [Number],
        required: true
    },
    enrolled_at: { type: Date, default: Date.now },
    images_count: { type: Number, default: 0 }
}, {
    timestamps: true
});

module.exports = mongoose.model('FaceEmbedding', faceEmbeddingSchema);
