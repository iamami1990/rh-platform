# Olympia HR - Backend API

This directory contains the Node.js/Express backend for the Olympia HR Intelligent Platform.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env.example` to `.env` and configure your variables (MongoDB, JWT, etc.).

3. **Database Setup:**
   Ensure MongoDB is running. Use `node setup_admin.js` to create the initial admin user.

4. **Run development server:**
   ```bash
   npm run dev
   ```

## 📚 Documentation

For detailed technical information, please refer to the following documents in the root `docs/` folder:

- [API Documentation](../docs/API_DOCUMENTATION.md)
- [Database Schema](../docs/DATABASE_SCHEMA.md)
- [Setup Guide](../docs/SETUP_GUIDE.md)
- [Configuration Guide](../docs/CONFIGURATION_GUIDE.md)

## 🛠️ Scripts

- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon
- `npm test`: Run tests with Jest
- `node setup_admin.js`: Initial admin account setup
