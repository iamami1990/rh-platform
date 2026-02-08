# Architecture Overview

## Backend (Node.js + Express)

- REST API with JWT auth
- MongoDB with Mongoose models
- MVC-style routing and middleware
- Modules: auth, employees, attendance, leaves, payroll, notifications, analytics, kiosk

## Web Admin (React)

- React + Redux Toolkit + MUI
- Admin and Manager dashboards
- CRUD for employees, attendance, leaves, payroll

## Mobile (React Native / Expo)

- Employee mode with JWT
- KIOSK mode for shared tablet usage
- Face verification + PIN fallback

## Data Models (MongoDB)

Core models:

- User
- Employee
- Attendance
- Leave
- Payroll
- Notification
- KioskLog

See the backend models for detailed schema definitions.
