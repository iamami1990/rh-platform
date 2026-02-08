const mongoose = require('mongoose');

const sentimentSchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    // Legacy compatibility
    employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    month: { type: String, required: true }, // YYYY-MM

    attendance_score: Number,
    punctuality_score: Number,
    assiduity_score: Number,
    workload_score: Number,

    overall_score: Number,

    sentiment: {
        type: String,
        enum: ['good', 'neutral', 'poor'],
        required: true
    },

    trend: {
        type: String,
        enum: ['improving', 'stable', 'declining']
    },

    risk_level: {
        type: String,
        enum: ['low', 'medium', 'high']
    },

    recommendations: String,

    metrics: {
        working_days: Number,
        present_days: Number,
        absent_days: Number,
        late_days: Number,
        attendance_rate: Number
    },

    report_pdf_url: String
}, {
    timestamps: true
});

// Index to ensure one sentiment record per employee per month
sentimentSchema.pre('validate', function (next) {
    if (this.employee && !this.employee_id) {
        this.employee_id = this.employee;
    }
    if (this.employee_id && !this.employee) {
        this.employee = this.employee_id;
    }
    next();
});

sentimentSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Sentiment', sentimentSchema);
