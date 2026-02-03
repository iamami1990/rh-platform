#!/bin/bash
# Master ML Training Script (Linux/Mac)
# Executes complete ML training pipeline with synthetic data

echo "============================================"
echo "  OLYMPIA HR - ML TRAINING PIPELINE"
echo "============================================"
echo ""

# Check Python installation
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python not found!"
    echo "Please install Python 3.9+"
    exit 1
fi

echo "[1/7] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

echo "[2/7] Activating virtual environment..."
source venv/bin/activate

echo "[3/7] Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo ""
echo "============================================"
echo "  PHASE 1: DATASET GENERATION"
echo "============================================"
echo ""

echo "[4/7] Generating synthetic face dataset..."
python3 generate_face_dataset.py

echo ""
echo "[5/7] Generating synthetic liveness dataset..."
python3 generate_liveness_dataset.py

echo ""
echo "[6/7] Generating synthetic employee data..."
python3 generate_employee_dataset.py

echo ""
echo "============================================"
echo "  PHASE 2: MODEL TRAINING"
echo "============================================"
echo ""

# Face Recognition Training
echo "[7/7] Training ML models..."
echo ""
echo "--- Face Recognition Training ---"
python3 train_face_recognition.py
if [ $? -eq 0 ]; then
    echo "✓ Face recognition model trained successfully"
else
    echo "⚠ WARNING: Face recognition training failed"
fi

echo ""
echo "--- Liveness Detection Training ---"
python3 train_liveness_detection.py
if [ $? -eq 0 ]; then
    echo "✓ Liveness detection model trained successfully"
else
    echo "⚠ WARNING: Liveness detection training failed"
fi

echo ""
echo "--- Sentiment Analysis Training ---"
python3 train_sentiment_ml.py
if [ $? -eq 0 ]; then
    echo "✓ Sentiment ML models trained successfully"
else
    echo "⚠ WARNING: Sentiment ML training failed"
fi

echo ""
echo "============================================"
echo "  TRAINING COMPLETE"
echo "============================================"
echo ""
echo "Trained models saved in: models/"
echo "  - face_recognition_model.h5"
echo "  - liveness_detection_model.h5"
echo "  - xgboost_sentiment_model.pkl"
echo "  - rf_sentiment_model.pkl"
echo ""
echo "Next steps:"
echo "  1. Review training results and plots"
echo "  2. Deploy models to backend"
echo "  3. Update backend routes to use trained models"
echo "  4. Test models with real data"
echo ""
