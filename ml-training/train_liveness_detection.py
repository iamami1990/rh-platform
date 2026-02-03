"""
Liveness Detection Model Training Script
Olympia HR Platform

This script trains a liveness detection model to prevent spoofing attacks
(printed photos, video replay, masks, etc.)

Dataset Requirements:
- Real face videos (live captures)
- Spoofing attack samples:
  * Printed photos
  * Screen replay videos
  * Paper masks
  * Different lighting conditions

Recommended Datasets:
- NUAA Photograph Imposter Database
- Replay-Attack Database
- CASIA Face Anti-Spoofing Database
- OULU-NPU

Dataset structure:
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
"""

import os
import numpy as np
import cv2
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 0.001

def extract_frames_from_video(video_path, num_frames=30):
    """
    Extract frames from video for training
    """
    frames = []
    cap = cv2.VideoCapture(video_path)
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
    
    for idx in frame_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap.read()
        
        if ret:
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
            frame = frame / 255.0
            frames.append(frame)
    
    cap.release()
    return np.array(frames)

def load_liveness_dataset(dataset_path):
    """
    Load liveness detection dataset
    Returns: X_train, y_train, X_test, y_test
    """
    X_train, y_train = [], []
    X_test, y_test = [], []
    
    # Load training data
    for label, class_name in enumerate(['live', 'spoof']):
        train_dir = os.path.join(dataset_path, 'train', class_name)
        
        if not os.path.exists(train_dir):
            continue
        
        for video_file in os.listdir(train_dir):
            if video_file.endswith(('.mp4', '.avi', '.mov')):
                video_path = os.path.join(train_dir, video_file)
                frames = extract_frames_from_video(video_path)
                
                for frame in frames:
                    X_train.append(frame)
                    y_train.append(label)
    
    # Load test data
    for label, class_name in enumerate(['live', 'spoof']):
        test_dir = os.path.join(dataset_path, 'test', class_name)
        
        if not os.path.exists(test_dir):
            continue
        
        for video_file in os.listdir(test_dir):
            if video_file.endswith(('.mp4', '.avi', '.mov')):
                video_path = os.path.join(test_dir, video_file)
                frames = extract_frames_from_video(video_path)
                
                for frame in frames:
                    X_test.append(frame)
                    y_test.append(label)
    
    return (np.array(X_train), np.array(y_train), 
            np.array(X_test), np.array(y_test))

def build_liveness_model():
    """
    Build CNN model for liveness detection
    """
    model = Sequential([
        Conv2D(32, (3, 3), activation='relu', input_shape=(IMG_SIZE, IMG_SIZE, 3)),
        BatchNormalization(),
        MaxPooling2D((2, 2)),
        
        Conv2D(64, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D((2, 2)),
        
        Conv2D(128, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D((2, 2)),
        
        Conv2D(256, (3, 3), activation='relu'),
        BatchNormalization(),
        MaxPooling2D((2, 2)),
        
        Flatten(),
        Dense(512, activation='relu'),
        Dropout(0.5),
        Dense(256, activation='relu'),
        Dropout(0.5),
        Dense(1, activation='sigmoid')  # Binary: 0=spoof, 1=live
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.Precision(), tf.keras.metrics.Recall()]
    )
    
    return model

def analyze_texture(image):
    """
    Texture analysis for liveness detection
    Using Local Binary Patterns (LBP) and frequency analysis
    """
    gray = cv2.cvtColor((image * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
    
    # Laplacian variance (texture measure)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    texture_variance = laplacian.var()
    
    # Frequency analysis using FFT
    f_transform = np.fft.fft2(gray)
    f_shift = np.fft.fftshift(f_transform)
    magnitude_spectrum = 20 * np.log(np.abs(f_shift) + 1)
    
    return {
        'texture_variance': texture_variance,
        'frequency_mean': magnitude_spectrum.mean(),
        'frequency_std': magnitude_spectrum.std()
    }

def train_liveness_model(dataset_path, output_model_path='models/liveness_detection_model.h5'):
    """
    Main training function
    """
    print("Loading liveness dataset...")
    X_train, y_train, X_test, y_test = load_liveness_dataset(dataset_path)
    
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples: {len(X_test)}")
    print(f"Live samples: {np.sum(y_train == 1)}")
    print(f"Spoof samples: {np.sum(y_train == 0)}")
    
    print("\nBuilding model...")
    model = build_liveness_model()
    model.summary()
    
    # Callbacks
    checkpoint = ModelCheckpoint(
        output_model_path,
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )
    
    early_stop = EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True,
        verbose=1
    )
    
    print("\nTraining model...")
    history = model.fit(
        X_train, y_train,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(X_test, y_test),
        callbacks=[checkpoint, early_stop],
        verbose=1
    )
    
    # Evaluate model
    print("\nEvaluating model...")
    y_pred = (model.predict(X_test) > 0.5).astype(int)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Spoof', 'Live']))
    
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Plot training history
    plot_training_history(history)
    
    print(f"\n✅ Model saved to: {output_model_path}")
    return model

def plot_training_history(history):
    """
    Plot training/validation accuracy and loss
    """
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    # Accuracy
    ax1.plot(history.history['accuracy'], label='Train Accuracy')
    ax1.plot(history.history['val_accuracy'], label='Val Accuracy')
    ax1.set_title('Model Accuracy')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Accuracy')
    ax1.legend()
    ax1.grid(True)
    
    # Loss
    ax2.plot(history.history['loss'], label='Train Loss')
    ax2.plot(history.history['val_loss'], label='Val Loss')
    ax2.set_title('Model Loss')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Loss')
    ax2.legend()
    ax2.grid(True)
    
    plt.tight_layout()
    plt.savefig('liveness_training_history.png')
    print("Training history plot saved to: liveness_training_history.png")

def test_liveness_on_image(model, image_path):
    """
    Test liveness detection on a single image
    """
    img = cv2.imread(image_path)
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    img = img / 255.0
    
    # Predict
    prediction = model.predict(np.expand_dims(img, axis=0))[0][0]
    
    # Texture analysis
    texture_features = analyze_texture(img)
    
    result = {
        'is_live': prediction > 0.5,
        'confidence': float(prediction),
        'texture_variance': texture_features['texture_variance'],
        'assessment': 'LIVE' if prediction > 0.5 else 'SPOOF'
    }
    
    print(f"\nLiveness Assessment: {result['assessment']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Texture Variance: {result['texture_variance']:.2f}")
    
    return result

if __name__ == '__main__':
    DATASET_PATH = '/path/to/liveness_dataset'
    
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("\nPlease download and extract liveness detection dataset:")
        print("Recommended datasets:")
        print("- NUAA Photograph Imposter Database")
        print("- Replay-Attack Database")
        print("- CASIA Face Anti-Spoofing Database")
        print("\nDataset structure:")
        print("/dataset/liveness/")
        print("    /train/")
        print("        /live/")
        print("        /spoof/")
        print("    /test/")
        print("        /live/")
        print("        /spoof/")
        exit(1)
    
    # Train model
    model = train_liveness_model(DATASET_PATH)
    
    print("\n✅ Liveness detection model training complete!")
    print("Model ready for deployment in backend/utils/livenessDetection.js")
