# Setup Guide (MongoDB Only)

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Git

## Backend

```bash
cd backend
npm install
cp .env.example .env
```

Update `.env`:

- `MONGO_URI`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CORS_ORIGIN`

Seed an admin user:

```bash
set ADMIN_EMAIL=admin@olympia-hr.tn
set ADMIN_PASSWORD=ChangeMe123!
npm run seed:admin
```

Run:

```bash
npm run dev
```

## Face Recognition Models

Place the face model files in `backend/models/face/` (see the README inside that folder).

## Web Admin

```bash
cd web-admin
npm install
set REACT_APP_API_URL=http://localhost:5000/api
npm run dev
```

## Mobile (Expo)

Edit `mobile-app/app.json`:

```json
{
  "expo": {
    "extra": {
      "API_BASE_URL": "http://<YOUR-IP>:5000/api",
      "KIOSK_MODE": true
    }
  }
}
```

Run:

```bash
cd mobile-app
npm install
npx expo start
```
