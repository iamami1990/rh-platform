const mongoose = require('mongoose');

const faceEmbeddingSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, unique: true },
    // Legacy compatibility
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    embeddings: {
        type: [Number],
        required: true
    },
    enrolled_at: { type: Date, default: Date.now },
    images_count: { type: Number, default: 0 }
}, {
    timestamps: true
});

faceEmbeddingSchema.pre('validate', function (next) {
    if (this.employee && !this.employee_id) {
        this.employee_id = this.employee;
    }
    if (this.employee_id && !this.employee) {
        this.employee = this.employee_id;
    }
    next();
});

module.exports = mongoose.model('FaceEmbedding', faceEmbeddingSchema);
