@echo off
echo ============================================
echo   OLYMPIA HR PLATFORM - STARTUP
echo ============================================
echo.

REM Check if .env exists in backend
if not exist backend\.env (
    echo [1/6] Creating backend .env file...
    (
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # Firebase Configuration
        echo FIREBASE_PROJECT_ID=tp22-64555
        echo FIREBASE_STORAGE_BUCKET=tp22-64555.firebasestorage.app
        echo.
        echo # JWT Configuration
        echo JWT_SECRET=olympia-hr-super-secret-jwt-key-2024-change-in-production
        echo JWT_EXPIRE=7d
        echo JWT_REFRESH_EXPIRE=30d
        echo.
        echo # Email Configuration
        echo EMAIL_HOST=smtp.gmail.com
        echo EMAIL_PORT=587
        echo EMAIL_USER=noreply@olympia-hr.com
        echo EMAIL_PASSWORD=your-app-password-here
        echo EMAIL_FROM=noreply@olympia-hr.com
        echo.
        echo # CORS Configuration
        echo CORS_ORIGIN=http://localhost:3000
        echo.
        echo # Rate Limiting
        echo RATE_LIMIT_WINDOW_MS=900000
        echo RATE_LIMIT_MAX_REQUESTS=100
        echo.
        echo # File Upload
        echo MAX_FILE_SIZE=5242880
        echo UPLOAD_PATH=./uploads
        echo.
        echo # Pagination
        echo DEFAULT_PAGE_SIZE=20
        echo MAX_PAGE_SIZE=100
    ) > backend\.env
    echo ✓ Backend .env created
) else (
    echo [1/6] Backend .env already exists
)

REM Check if .env.local exists in web-admin
if not exist web-admin\.env.local (
    echo [2/6] Creating web-admin .env.local...
    copy web-admin\.env.example web-admin\.env.local >nul
    echo ✓ Web-admin .env.local created
) else (
    echo [2/6] Web-admin .env.local already exists
)

REM Install backend dependencies if needed
if not exist backend\node_modules (
    echo [3/6] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo ✓ Backend dependencies installed
) else (
    echo [3/6] Backend dependencies already installed
)

REM Install web-admin dependencies if needed
if not exist web-admin\node_modules (
    echo [4/6] Installing web-admin dependencies...
    cd web-admin
    call npm install
    cd ..
    echo ✓ Web-admin dependencies installed
) else (
    echo [4/6] Web-admin dependencies already installed
)

echo.
echo ============================================
echo   STARTING SERVICES
echo ============================================
echo.

echo [5/6] Starting Backend Server on http://localhost:5000...
start "Olympia HR - Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [6/6] Starting Web Admin on http://localhost:3000...
start "Olympia HR - Web Admin" cmd /k "cd web-admin && npm start"

echo.
echo ============================================
echo   APPLICATION STARTED
echo ============================================
echo.
echo Backend:   http://localhost:5000
echo Web Admin: http://localhost:3000
echo.
echo NOTE: Le navigateur ouvrira automatiquement dans quelques secondes
echo.
echo Pour arreter les serveurs:
echo   - Fermez les fenetres de terminal ouvertes
echo   - Ou appuyez sur Ctrl+C dans chaque terminal
echo.
pause
