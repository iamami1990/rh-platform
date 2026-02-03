# Backend API Documentation

Complete REST API reference for the Olympia HR Platform.

**Base URL:** `http://localhost:5000/api` (development)

---

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

---

## 1. Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "role": "admin" | "manager" | "employee",  
  "employee_id": "uuid" (optional)
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "admin"
  }
}
```

---

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "admin",
    "employee_id": "uuid"
  }
}
```

---

### Get Current User
```http
GET /auth/me
```
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "role": "admin",
    "employee": { ... }
  }
}
```

---

## 2. Employee Endpoints

### Get All Employees
```http
GET /employees?page=1&limit=20&department=IT&status=active&search=ahmed
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `department` (string, optional)
- `status` (string, optional: active|inactive|on_leave)
- `search` (string, optional)

**Response (200):**
```json
{
  "success": true,
  "count": 10,
  "total": 45,
  "page": 1,
  "totalPages": 3,
  "employees": [
    {
      "employee_id": "uuid",
      "firstName": "Ahmed",
      "lastName": "Ben Ali",
      "email": "ahmed@olympia.com",
      "department": "IT",
      "position": "Developer",
      "status": "active",
      ...
    }
  ]
}
```

---

### Get Employee by ID
```http
GET /employees/:id
```
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "employee": {
    "employee_id": "uuid",
    "firstName": "Ahmed",
    "lastName": "Ben Ali",
    "email": "ahmed@olympia.com",
    "phone": "+216 98 123 456",
    "department": "IT",
    "position": "Developer",
    "hireDate": "2024-01-15",
    "salary_brut": 2500,
    "contract_type": "CDI",
    "status": "active"
  }
}
```

---

### Create Employee
```http
POST /employees
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Request Body:**
```json
{
  "firstName": "Ahmed",
  "lastName": "Ben Ali",
  "email": "ahmed@olympia.com",
  "phone": "+216 98 123 456",
  "address": "123 Rue Habib Bourguiba, Tunis",
  "dateOfBirth": "1990-05-15",
  "department": "IT",
  "position": "Developer",
  "hireDate": "2024-01-15",
  "salary_brut": 2500,
  "hourly_rate": 15.625,
  "contract_type": "CDI"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "employee": { ... }
}
```

---

### Update Employee
```http
PUT /employees/:id
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Request Body:** (same as create, partial updates allowed)

---

### Delete Employee
```http
DELETE /employees/:id
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Note:** Soft delete - sets status to "inactive"

---

## 3. Attendance Endpoints

### Check-In
```http
POST /attendance/check-in
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "employee_id": "uuid",
  "face_image_url": "https://storage.../face.jpg" (optional),
  "location": { "lat": 36.8065, "lng": 10.1815 } (optional),
  "device_info": { "os": "Android", "brand": "Samsung" } (optional)
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Check-in successful (15 min late)",
  "attendance": {
    "attendance_id": "uuid",
    "employee_id": "uuid",
    "date": "2025-12-22",
    "check_in_time": "2025-12-22T08:15:00Z",
    "status": "late",
    "delay_minutes": 15
  }
}
```

---

### Check-Out
```http
POST /attendance/check-out
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "employee_id": "uuid"
}
```

---

### Get Attendance Records
```http
GET /attendance?startDate=2025-12-01&endDate=2025-12-31&employee_id=uuid&status=late
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

---

### Get Employee Attendance History
```http
GET /attendance/employee/:id
```
**Headers:** `Authorization: Bearer <token>`

**Response:** Last 30 days of attendance

---

## 4. Leave Endpoints

### Create Leave Request
```http
POST /leaves
```
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "employee_id": "uuid",
  "leave_type": "annual" | "sick" | "maternity" | "unpaid",
  "start_date": "2025-12-25",
  "end_date": "2025-12-31",
  "reason": "Family vacation",
  "document_url": "https://..." (optional)
}
```

---

### Get Leave Requests
```http
GET /leaves?status=pending&employee_id=uuid
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

---

### Approve Leave
```http
PUT /leaves/:id/approve
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

---

### Reject Leave
```http
PUT /leaves/:id/reject
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

---

### Get Leave Balance
```http
GET /leaves/balance/:employee_id
```
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "employee_id": "uuid",
  "year": 2025,
  "balance": {
    "annual": {
      "allocated": 25,
      "used": 10,
      "remaining": 15
    },
    "sick": {
      "allocated": 15,
      "used": 3,
      "remaining": 12
    }
  }
}
```

---

## 5. Payroll Endpoints

### Generate Payroll (All Employees)
```http
POST /payroll/generate
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin only

**Request Body:**
```json
{
  "month": "2025-12"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Payroll generated for 45 employees",
  "month": "2025-12",
  "results": [
    {
      "employee_id": "uuid",
      "payroll_id": "uuid",
      "status": "generated",
      "net_salary": 2150.50
    }
  ]
}
```

---

### Get Payroll Records
```http
GET /payroll?month=2025-12&employee_id=uuid
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin

---

### Get Payroll by ID
```http
GET /payroll/:id
```
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "payroll": {
    "payroll_id": "uuid",
    "employee_id": "uuid",
    "month": "2025-12",
    "gross_salary": 2500,
    "bonuses": {
      "seniority": 50,
      "attendance": 125,
      "performance": 100
    },
    "deductions": {
      "cnss": 175,
      "income_tax": 250
    },
    "net_salary": 2350
  }
}
```

---

### Get Payroll Report
```http
GET /payroll/report?month=2025-12
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin

**Response (200):**
```json
{
  "success": true,
  "report": {
    "month": "2025-12",
    "total_employees": 45,
    "total_gross": 112500,
    "total_deductions": 19125,
    "total_net": 93375,
    "total_cnss": 7875,
    "total_tax": 11250
  }
}
```

---

## 6. Sentiment Analysis Endpoints

### Generate Sentiment Analysis
```http
POST /sentiment/generate
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin

**Request Body:**
```json
{
  "month": "2025-12"
}
```

---

### Get Sentiment Records
```http
GET /sentiment?month=2025-12&employee_id=uuid
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

**Response (200):**
```json
{
  "success": true,
  "sentiments": [
    {
      "sentiment_id": "uuid",
      "employee_id": "uuid",
      "month": "2025-12",
      "overall_score": 72,
      "sentiment": "neutral",
      "risk_level": "medium",
      "recommendations": "Address punctuality issues"
    }
  ]
}
```

---

### Get High-Risk Employees (Alerts)
```http
GET /sentiment/alerts?month=2025-12
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin, Manager

---

### Get Employee Sentiment History
```http
GET /sentiment/:employee_id
```
**Headers:** `Authorization: Bearer <token>`

**Response:** Last 12 months of sentiment data

---

## 7. Dashboard Endpoints

### Get Admin Dashboard
```http
GET /dashboard/admin
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Admin

**Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "employees": {
      "total": 45,
      "active": 42,
      "on_leave": 3
    },
    "attendance": {
      "today": {
        "present": 38,
        "late": 4,
        "rate": "84.44"
      }
    },
    "payroll": {
      "month": "2025-12",
      "generated": 45,
      "total_mass": "93375.00"
    },
    "sentiment": {
      "average_score": "68.50",
      "at_risk": 7
    }
  }
}
```

---

### Get Employee Dashboard
```http
GET /dashboard/employee
```
**Headers:** `Authorization: Bearer <token>`  
**Access:** Employee (own data)

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: firstName, lastName"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token. Authentication failed."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Insufficient permissions.",
  "requiredRoles": ["admin"],
  "userRole": "employee"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to create employee",
  "error": "Database connection error"
}
```

---

**Last Updated:** December 2025  
**Version:** 1.0
