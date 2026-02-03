# Database Schema - Firestore Collections

Complete Firestore database schema for the Olympia HR Platform.

---

## Collections Overview

```
firestore/
├── users/                  # Authentication and user accounts
├── employees/              # Employee master data
├── attendance/             # Daily attendance records
├── leaves/                 # Leave requests and approvals
├── payroll/                # Monthly payroll records
├── sentiment_analysis/     # AI sentiment reports
└── audit_logs/             # System audit trail
```

---

## 1. Collection: `users`

User authentication and role management.

### Document Structure

```javascript
{
  user_id: string (UUID - Firebase Auth UID),
  email: string (unique),
  password: string (hashed with bcrypt),
  role: string, // "admin" | "manager" | "employee"
  employee_id: string (UUID) | null, // Reference to employees collection
  created_at: timestamp,
  last_login: timestamp | null
}
```

### Indexes
- `email` (ascending)
- `role` (ascending)

---

## 2. Collection: `employees`

Complete employee master data.

### Document Structure

```javascript
{
  // Personal Information
  firstName: string,
  lastName: string,
  email: string (unique),
  phone: string,
  address: string,
  dateOfBirth: date,
  nationality: string,
  profile_image_url: string | null,
  
  // Professional Information
  hireDate: date,
  department: string, // "IT", "HR", "Finance", "Operations", etc.
  position: string,
  manager_id: string (UUID) | null, // Reference to another employee
  contract_type: string, // "CDI" | "CDD"
  status: string, // "active" | "inactive" | "on_leave"
  
  // Compensation
  salary_brut: number, // Monthly gross salary
  hourly_rate: number, // Calculated from salary
  
  // Documents
  document_urls: array[string], // URLs to stored documents (CV, contracts, etc.)
  
  // Timestamps
  created_at: timestamp,
  updated_at: timestamp
}
```

### Indexes
- `email` (ascending)
- `department` (ascending)
- `status` (ascending)
- `hireDate` (ascending)

---

## 3. Collection: `attendance`

Daily attendance check-in/check-out records.

### Document Structure

```javascript
{
  employee_id: string (UUID), // Reference to employees
  date: string, // Format: "YYYY-MM-DD"
  check_in_time: timestamp,
  check_out_time: timestamp | null,
  
  // Facial Recognition Data
  face_image_url: string | null, // Stored securely in Firebase Storage
  
  // Location & Device
  location: {
    lat: number,
    lng: number
  } | null,
  device_info: {
    os: string,
    brand: string,
    model: string
  } | null,
  
  // Status & Metrics
  status: string, // "present" | "late" | "absent"
  delay_minutes: number, // Minutes late (0 if on time)
  notes: string,
  
  created_at: timestamp
}
```

### Indexes
- `employee_id` (ascending)
- `date` (ascending)
- `status` (ascending)
- `created_at` (descending)

---

## 4. Collection: `leaves`

Leave requests and approval workflow.

### Document Structure

```javascript
{
  employee_id: string (UUID),
  leave_type: string, // "annual" | "sick" | "maternity" | "unpaid"
  start_date: date,
  end_date: date,
  days_requested: number,
  
  // Status & Approval
  status: string, // "pending" | "approved" | "rejected"
  reason: string,
  document_url: string | null, // Justification document (medical certificate, etc.)
  approved_by: string (UUID) | null, // Reference to users (manager/admin)
  
  created_at: timestamp,
  approved_at: timestamp | null
}
```

### Indexes
- `employee_id` (ascending)
- `status` (ascending)
- `leave_type` (ascending)
- `created_at` (descending)

---

## 5. Collection: `payroll`

Monthly payroll calculations and bulletins.

### Document Structure

```javascript
{
  employee_id: string (UUID),
  month: string, // Format: "YYYY-MM"
  
  // Base Salary
  gross_salary: number,
  overtime_hours: number,
  overtime_pay: number,
  
  // Bonuses
  bonuses: {
    seniority: number,
    attendance: number,
    performance: number,
    responsibility: number,
    other: number
  },
  
  // Allowances
  allowances: {
    transport: number,
    meals: number,
    housing: number,
    other: number
  },
  
  // Totals
  total_gross: number, // gross_salary + overtime_pay + bonuses + allowances
  
  // Deductions
  deductions: {
    cnss: number, // Social security (7%)
    income_tax: number, // Progressive tax
    union: number,
    other: number // Absences, penalties
  },
  
  total_deductions: number,
  net_salary: number, // total_gross - total_deductions
  
  // Metrics
  working_days: number,
  present_days: number,
  absent_days: number,
  late_days: number,
  
  // Documents
  pdf_url: string | null, // Generated bulletin PDF
  
  // Status
  status: string, // "draft" | "generated" | "paid"
  generated_at: timestamp,
  paid_at: timestamp | null
}
```

### Indexes
- `employee_id` (ascending)
- `month` (ascending)
- `status` (ascending)
- `generated_at` (descending)

---

## 6. Collection: `sentiment_analysis`

AI-generated sentiment analysis reports.

### Document Structure

```javascript
{
  employee_id: string (UUID),
  month: string, // Format: "YYYY-MM"
  
  // Scores (0-10 each)
  attendance_score: number,
  punctuality_score: number,
  assiduity_score: number,
  workload_score: number,
  
  // Overall
  overall_score: number, // 0-100
  sentiment: string, // "good" | "neutral" | "poor"
  trend: string, // "up" | "stable" | "down"
  risk_level: string, // "low" | "medium" | "high"
  
  // Insights
  recommendations: string, // AI-generated recommendations
  
  // Metrics
  metrics: {
    working_days: number,
    present_days: number,
    absent_days: number,
    late_days: number,
    attendance_rate: string // Percentage
  },
  
  // Report
  report_pdf_url: string | null,
  
  created_at: timestamp
}
```

### Indexes
- `employee_id` (ascending)
- `month` (ascending)
- `sentiment` (ascending)
- `risk_level` (ascending)
- `created_at` (descending)

---

## 7. Collection: `audit_logs`

System audit trail for security and compliance.

### Document Structure

```javascript
{
  user_id: string (UUID),
  action: string, // "create", "read", "update", "delete"
  resource: string, // "employee", "payroll", "attendance", etc.
  resource_id: string,
  details: object, // Additional context
  ip_address: string,
  timestamp: timestamp
}
```

### Indexes
- `user_id` (ascending)
- `action` (ascending)
- `resource` (ascending)
- `timestamp` (descending)

---

## Security Rules

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - only admins can write
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Employees collection - admin/manager can write
    match /employees/{employeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Attendance - employees can create their own, admin/manager can read all
    match /attendance/{attendanceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                              get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Leaves - employees can create, managers can approve
    match /leaves/{leaveId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Payroll - only admin can write, employees can read their own
    match /payroll/{payrollId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Sentiment - only admin/manager can access
    match /sentiment_analysis/{sentimentId} {
      allow read, write: if request.auth != null && 
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'manager'];
    }
    
    // Audit logs - only admin can read
    match /audit_logs/{logId} {
      allow read: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Only backend can write
    }
  }
}
```

---

## Data Relationships

```
users (1) ──→ (0..1) employees
                │
                ├──→ (0..n) attendance
                ├──→ (0..n) leaves
                ├──→ (0..n) payroll
                └──→ (0..n) sentiment_analysis

employees (1) ──→ (0..n) employees (manager relationship)
```

---

## Backup & Retention Policy

- **Daily backups**: Automated Firestore export
- **Retention**: 90 days for active data, 7 years for payroll (legal requirement)
- **Archival**: Inactive employees moved to cold storage after 2 years

---

**Last Updated:** December 2025  
**Version:** 1.0
