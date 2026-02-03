@echo off
REM Master ML Training Script
REM Executes complete ML training pipeline with synthetic data

echo ============================================
echo   OLYMPIA HR - ML TRAINING PIPELINE
echo ============================================
echo.

REM Check Python installation
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.9+ and add to PATH
    pause
    exit /b 1
)

echo [1/7] Creating virtual environment...
if not exist venv (
    python -m venv venv
)

echo [2/7] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/7] Installing dependencies...
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo.
echo ============================================
echo   PHASE 1: DATASET GENERATION
echo ============================================
echo.

echo [4/7] Generating synthetic face dataset...
python generate_face_dataset.py

echo.
echo [5/7] Generating synthetic liveness dataset...
python generate_liveness_dataset.py

echo.
echo [6/7] Generating synthetic employee data...
python generate_employee_dataset.py

echo.
echo ============================================
echo   PHASE 2: MODEL TRAINING
echo ============================================
echo.

REM Face Recognition Training
echo [7/7] Training ML models...
echo.
echo --- Face Recognition Training ---
python train_face_recognition.py
if errorlevel 1 (
    echo WARNING: Face recognition training failed
) else (
    echo CHECKMARK Face recognition model trained successfully
)

echo.
echo --- Liveness Detection Training ---
python train_liveness_detection.py
if errorlevel 1 (
    echo WARNING: Liveness detection training failed
) else (
    echo CHECKMARK Liveness detection model trained successfully
)

echo.
echo --- Sentiment Analysis Training ---
python train_sentiment_ml.py
if errorlevel 1 (
    echo WARNING: Sentiment ML training failed
) else (
    echo CHECKMARK Sentiment ML models trained successfully
)

echo.
echo ============================================
echo   TRAINING COMPLETE
echo ============================================
echo.
echo Trained models saved in: models/
echo   - face_recognition_model.h5
echo   - liveness_detection_model.h5
echo   - xgboost_sentiment_model.pkl
echo   - rf_sentiment_model.pkl
echo.
echo Next steps:
echo   1. Review training results and plots
echo   2. Deploy models to backend
echo   3. Update backend routes to use trained models
echo   4. Test models with real data
echo.
pause
