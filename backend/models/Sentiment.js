const mongoose = require('mongoose');

const sentimentSchema = new mongoose.Schema({
    sentiment_id: { type: String, required: true, unique: true },
    employee_id: { type: String, required: true, ref: 'Employee' },
    month: { type: String, required: true }, // YYYY-MM

    // Scores (0-10)
    attendance_score: { type: Number, required: true },
    punctuality_score: { type: Number, required: true },
    assiduity_score: { type: Number, required: true },
    workload_score: { type: Number, required: true },

    // Overall (0-100)
    overall_score: { type: Number, required: true },

    // Classification
    sentiment: { type: String, enum: ['good', 'neutral', 'poor'], required: true },
    trend: { type: String, enum: ['improving', 'stable', 'declining'], default: 'stable' },
    risk_level: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },

    // Analysis
    recommendations: { type: String },

    metrics: {
        working_days: Number,
        present_days: Number,
        absent_days: Number,
        late_days: Number,
        attendance_rate: String
    },

    report_pdf_url: { type: String },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Sentiment', sentimentSchema);
