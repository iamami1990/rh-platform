const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    id: String, // Keep string ID compatibility or use _id
    name: String,
    type: {
        type: String,
        enum: ['CIN', 'CV', 'Contract', 'Diploma', 'Medical', 'Other'],
        default: 'Other'
    },
    url: String,
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: String,
    expires_at: Date
});

const employeeSchema = new mongoose.Schema({
    employee_id: {
        type: String,
        unique: true,
        sparse: true
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: String,
    cin: String,
    birthDate: Date,
    address: String,
    marital_status: String,
    children_count: { type: Number, default: 0 },

    // Professional
    matricule: String,
    department: { type: String, required: true },
    position: { type: String, required: true },
    contract_type: {
        type: String,
        required: true,
        enum: ['CDI', 'CDD', 'SIVP', 'KARAMA', 'Freelance', 'Internship']
    },
    hireDate: { type: Date, required: true },
    endDate: Date,
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'on_leave'],
        default: 'active'
    },

    // Financial
    salary_brut: { type: Number, required: true }, // Legacy
    gross_salary: { type: Number }, // Alias
    transport_allowance: { type: Number, default: 60 },
    meal_allowance: { type: Number, default: 0 },
    cnss_number: String,
    bank_account: {
        iban: String,
        rib: String,
        bank_name: String
    },

    // Config
    work_start_time: { type: String, default: '08:00' },
    work_end_time: { type: String, default: '17:00' },
    workplace_location: {
        lat: Number,
        lng: Number,
        address: String
    },

    // Relations & Docs
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    // Legacy compatibility
    manager_id: { type: String, ref: 'User' },
    documents: [documentSchema],
    profile_image_url: String,

    emergency_contact: {
        name: String,
        phone: String,
        relationship: String
    },
    notes: String
}, {
    timestamps: true
});

// Alias handling
employeeSchema.pre('save', async function () {
    if (this.salary_brut && !this.gross_salary) {
        this.gross_salary = this.salary_brut;
    }
    if (this.manager && !this.manager_id) {
        this.manager_id = this.manager.toString();
    }
});

module.exports = mongoose.model('Employee', employeeSchema);
