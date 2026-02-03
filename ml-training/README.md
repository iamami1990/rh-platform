# ML Training README
# Olympia HR Platform - Machine Learning Models

This directory contains all ML training scripts for the Olympia HR Platform.

## 📂 Structure

```
ml-training/
├── train_face_recognition.py    # Face recognition model (FaceNet)
├── train_liveness_detection.py  # Liveness/anti-spoofing model
├── train_sentiment_ml.py         # Enhanced sentiment/turnover prediction
├── requirements.txt              # Python dependencies
├── README.md                     # This file
└── models/                       # Trained models output (create this)
    ├── face_recognition_model.h5
    ├── liveness_detection_model.h5
    ├── xgboost_sentiment_model.pkl
    └── rf_sentiment_model.pkl
```

## 🚀 Quick Start

### Prerequisites

1. **Python 3.9+** installed
2. **CUDA** (optional, for GPU training)
3. **Firebase** service account key

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## 📸 1. Face Recognition Training

### Data Collection

Collect employee photos:
- **Minimum:** 20 photos per employee
- **Angles:** Front, left profile, right profile
- **Lighting:** Various conditions
- **Expressions:** Neutral, smiling, serious
- **Resolution:** 300x300 minimum

**Dataset structure:**
```
/dataset/employee_photos/
    /employee_001/
        photo_01.jpg
        photo_02.jpg
        ...
    /employee_002/
        photo_01.jpg
        ...
```

### Training

```bash
python train_face_recognition.py
```

**Parameters to adjust in script:**
- `IMG_SIZE`: Image resolution (default: 224)
- `EMBEDDING_DIM`: Embedding vector size (default: 128)
- `EPOCHS`: Training epochs (default: 50)
- `LEARNING_RATE`: Learning rate (default: 0.0001)

**Output:**
- `models/face_recognition_model.h5`
- Embeddings saved to Firestore `face_embeddings` collection

**Expected accuracy:** >95% on validation set

## 🛡️ 2. Liveness Detection Training

### Data Collection

Download public anti-spoofing datasets:
- **NUAA Photograph Imposter Database**
- **Replay-Attack Database**
- **CASIA Face Anti-Spoofing Database**
- **OULU-NPU**

**Dataset structure:**
```
/dataset/liveness/
    /train/
        /live/
            video_001.mp4
            video_002.mp4
        /spoof/
            print_001.mp4
            replay_001.mp4
    /test/
        /live/
        /spoof/
```

### Training

```bash
python train_liveness_detection.py
```

**Parameters:**
- `IMG_SIZE`: 224
- `EPOCHS`: 30
- `LEARNING_RATE`: 0.001

**Output:**
- `models/liveness_detection_model.h5`
- Training history plot

**Expected accuracy:** >90% on test set

## 📊 3. Sentiment Analysis / Turnover Prediction

### Data Requirements

Export historical employee data to CSV with columns:
- `employee_id`
- `attendance_rate` (%)
- `punctuality_rate` (%)
- `late_count` (last 3 months)
- `absent_count`
- `leave_days_used`
- `leave_days_available`
- `tenure_months`
- `department`
- `position`
- `contract_type`
- `salary_brut`
- `performance_score` (optional)
- `left_company` (0=retained, 1=left) **TARGET**

**Minimum:** 500 employee records (with turnover examples)

### Training

```bash
python train_sentiment_ml.py
```

**Output:**
- `models/xgboost_sentiment_model.pkl`
- `models/rf_sentiment_model.pkl`
- `models/sentiment_scaler.pkl`
- Feature importance plots
- ROC curve

**Expected AUC:** >0.75 on test set

## 🔧 Configuration

### Firebase Setup

1. Download service account key from Firebase Console
2. Place in project root as `serviceAccountKey.json`
3. Update path in training scripts

### GPU Training (Optional)

For faster training with NVIDIA GPU:

```bash
# Install CUDA version of TensorFlow
pip install tensorflow[and-cuda]

# Verify GPU
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

## 📈 Model Deployment

After training, deploy models:

### 1. Face Recognition

```javascript
// backend/utils/faceRecognition.js
const tf = require('@tensorflow/tfjs-node');
const model = await tf.loadLayersModel('file://./ml-training/models/face_recognition_model.h5');
```

### 2. Liveness Detection

```javascript
// backend/utils/livenessDetection.js
const model = await tf.loadLayersModel('file://./ml-training/models/liveness_detection_model.h5');
```

### 3. Sentiment ML

```python
# Python microservice (recommended)
import joblib
model = joblib.load('models/xgboost_sentiment_model.pkl')
```

## 🧪 Testing Models

Test face recognition:
```bash
python -c "from train_face_recognition import test_on_image; test_on_image('path/to/test.jpg')"
```

Test liveness:
```bash
python -c "from train_liveness_detection import test_liveness_on_image; test_liveness_on_image(model, 'path/to/test.jpg')"
```

## 📊 Monitoring & Retraining

**Face Recognition:**
- Retrain when: New employees added (monthly)
- Retrain if: Accuracy drops below 95%

**Liveness:**
- Retrain when: New spoofing techniques emerge
- Update dataset quarterly

**Sentiment:**
- Retrain: Quarterly with new data
- Monitor: Drift in prediction accuracy

## 🐛 Troubleshooting

**Issue:** CUDA Out of Memory
```bash
# Reduce batch size
BATCH_SIZE = 16  # Instead of 32
```

**Issue:** Low accuracy
- Check data quality
- Increase dataset size
- Adjust hyperparameters
- Try data augmentation

**Issue:** Overfitting
- Add dropout
- Reduce model complexity
- Use regularization
- Increase training data

## 📚 Resources

**Face Recognition:**
- [FaceNet Paper](https://arxiv.org/abs/1503.03832)
- [Triplet Loss](https://arxiv.org/abs/1503.03832)

**Liveness Detection:**
- [Face Anti-Spoofing Survey](https://arxiv.org/abs/1812.00408)
- [LBP Features](https://en.wikipedia.org/wiki/Local_binary_patterns)

**Sentiment/Turnover:**
- [XGBoost Documentation](https://xgboost.readthedocs.io/)
- [Employee Turnover Prediction](https://www.kaggle.com/datasets/pavansubhasht/ibm-hr-analytics-attrition-dataset)

## 🆘 Support

For ML training issues:
1. Check logs for error details
2. Verify dataset structure
3. Ensure all dependencies installed
4. Consult `docs/ML_AI_GUIDE.md`

---

**Ready to train? Start with sentiment analysis (easiest) then move to computer vision models.**
