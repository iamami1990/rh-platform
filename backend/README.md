# RH Platform Backend

## Overview
Node.js/Express backend for the RH Platform, using MongoDB as the database.

## Architecture
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JWT & bcrypt

## API Documentation
Located in `routes/`. All endpoints are prefixed with `/api`.

## Setup
1. Install dependencies: `npm install`
2. Configure `.env` (ensure `MONGO_URI` is set).
3. Run seed script: `npm run seed`
4. Start server: `npm run dev`

## Architecture Note
This project uses a full MongoDB architecture.

