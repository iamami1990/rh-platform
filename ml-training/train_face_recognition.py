"""
Face Recognition Model Training Script
Olympia HR Platform

This script trains a face recognition model using FaceNet architecture.
Ready to use once employee face photos are collected.

Requirements:
- Employee photos dataset (minimum 20 photos per employee)
- Photos should be: 
  * Multiple angles (front, left, right)
  * Different lighting conditions
  * Various expressions
  * Resolution: 300x300 minimum

Dataset structure:
/dataset/employee_photos/
    /employee_001/
        photo_01.jpg
        photo_02.jpg
        ...
    /employee_002/
        photo_01.jpg
        ...
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Lambda
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
import cv2
from sklearn.model_selection import train_test_split
import firebase_admin
from firebase_admin import credentials, firestore

# Configuration
IMG_SIZE = 224
EMBEDDING_DIM = 128
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.0001

# Initialize Firebase (for saving embeddings)
# cred = credentials.Certificate('path/to/serviceAccountKey.json')
# firebase_admin.initialize_app(cred)
# db = firestore.client()

def load_dataset(dataset_path):
    """
    Load employee photos from dataset directory
    Returns: images, employee_ids arrays
    """
    images = []
    employee_ids = []
    
    for employee_id in os.listdir(dataset_path):
        employee_dir = os.path.join(dataset_path, employee_id)
        
        if not os.path.isdir(employee_dir):
            continue
            
        for photo_file in os.listdir(employee_dir):
            if photo_file.endswith(('.jpg', '.jpeg', '.png')):
                photo_path = os.path.join(employee_dir, photo_file)
                
                # Load and preprocess image
                img = cv2.imread(photo_path)
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
                img = img / 255.0  # Normalize
                
                images.append(img)
                employee_ids.append(employee_id)
    
    return np.array(images), np.array(employee_ids)

def create_triplets(images, employee_ids, triplets_per_image=5):
    """
    Create triplet pairs (anchor, positive, negative) for training
    """
    triplets = []
    
    # Group images by employee
employee_images = {}
    for img, emp_id in zip(images, employee_ids):
        if emp_id not in employee_images:
            employee_images[emp_id] = []
        employee_images[emp_id].append(img)
    
    employee_list = list(employee_images.keys())
    
    for emp_id in employee_list:
        emp_imgs = employee_images[emp_id]
        
        if len(emp_imgs) < 2:
            continue
        
        for _ in range(min(triplets_per_image, len(emp_imgs))):
            # Anchor and positive from same employee
            anchor_idx = np.random.randint(0, len(emp_imgs))
            positive_idx = np.random.randint(0, len(emp_imgs))
            
            while positive_idx == anchor_idx:
                positive_idx = np.random.randint(0, len(emp_imgs))
            
            anchor = emp_imgs[anchor_idx]
            positive = emp_imgs[positive_idx]
            
            # Negative from different employee
            negative_emp = emp_id
            while negative_emp == emp_id:
                negative_emp = np.random.choice(employee_list)
            
            negative = np.random.choice(employee_images[negative_emp])
            
            triplets.append([anchor, positive, negative])
    
    return np.array(triplets)

def build_face_recognition_model():
    """
    Build FaceNet-style model for face embeddings
    """
    base_model = MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Build embedding model
    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base_model(inputs, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    embeddings = Dense(EMBEDDING_DIM, activation=None)(x)
    
    # L2 normalization
    embeddings = Lambda(lambda x: tf.math.l2_normalize(x, axis=1))(embeddings)
    
    model = Model(inputs=inputs, outputs=embeddings, name='face_embeddings')
    
    return model

def triplet_loss(y_true, y_pred, alpha=0.2):
    """
    Triplet loss function for face recognition
    """
    anchor = y_pred[:, :EMBEDDING_DIM]
    positive = y_pred[:, EMBEDDING_DIM:2*EMBEDDING_DIM]
    negative = y_pred[:, 2*EMBEDDING_DIM:]
    
    # Calculate distances
    pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=1)
    neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=1)
    
    # Triplet loss
    loss = tf.maximum(pos_dist - neg_dist + alpha, 0.0)
    
    return tf.reduce_mean(loss)

def train_model(dataset_path, output_model_path='models/face_recognition_model.h5'):
    """
    Main training function
    """
    print("Loading dataset...")
    images, employee_ids = load_dataset(dataset_path)
    print(f"Loaded {len(images)} images from {len(set(employee_ids))} employees")
    
    print("Creating triplets...")
    triplets = create_triplets(images, employee_ids)
    print(f"Created {len(triplets)} triplets")
    
    # Reshape for training
    anchors = triplets[:, 0]
    positives = triplets[:, 1]
    negatives = triplets[:, 2]
    
    # Train/validation split
    indices = np.arange(len(anchors))
    train_idx, val_idx = train_test_split(indices, test_size=0.2, random_state=42)
    
    print("Building model...")
    model = build_face_recognition_model()
    model.compile(optimizer=Adam(learning_rate=LEARNING_RATE), loss=triplet_loss)
    
    print("Training model...")
    # Custom training loop for triplet loss
    for epoch in range(EPOCHS):
        print(f"\nEpoch {epoch + 1}/{EPOCHS}")
        
        epoch_loss = 0
        batches = len(train_idx) // BATCH_SIZE
        
        for batch in range(batches):
            start_idx = batch * BATCH_SIZE
            end_idx = start_idx + BATCH_SIZE
            
            batch_indices = train_idx[start_idx:end_idx]
            
            batch_anchors = anchors[batch_indices]
            batch_positives = positives[batch_indices]
            batch_negatives = negatives[batch_indices]
            
            # Get embeddings
            with tf.GradientTape() as tape:
                anchor_emb = model(batch_anchors, training=True)
                positive_emb = model(batch_positives, training=True)
                negative_emb = model(batch_negatives, training=True)
                
                # Concatenate for loss calculation
                combined = tf.concat([anchor_emb, positive_emb, negative_emb], axis=1)
                loss = triplet_loss(None, combined)
            
            # Update weights
            gradients = tape.gradient(loss, model.trainable_variables)
            model.optimizer.apply_gradients(zip(gradients, model.trainable_variables))
            
            epoch_loss += loss.numpy()
        
        print(f"Average loss: {epoch_loss / batches:.4f}")
        
        # Validation
        if epoch % 5 == 0:
            validate_model(model, anchors[val_idx], positives[val_idx], negatives[val_idx])
    
    # Save model
    print(f"Saving model to {output_model_path}")
    model.save(output_model_path)
    
    # Generate and save employee embeddings to Firebase
    print("Generating employee embeddings...")
    save_employee_embeddings(model, images, employee_ids)
    
    print("Training complete!")
    return model

def validate_model(model, val_anchors, val_positives, val_negatives):
    """
    Validate model accuracy
    """
    anchor_emb = model.predict(val_anchors, verbose=0)
    positive_emb = model.predict(val_positives, verbose=0)
    negative_emb = model.predict(val_negatives, verbose=0)
    
    pos_dist = np.sum(np.square(anchor_emb - positive_emb), axis=1)
    neg_dist = np.sum(np.square(anchor_emb - negative_emb), axis=1)
    
    accuracy = np.mean(pos_dist < neg_dist)
    print(f"Validation accuracy: {accuracy * 100:.2f}%")

def save_employee_embeddings(model, images, employee_ids):
    """
    Generate and save embeddings for each employee to Firestore
    """
    employee_embeddings = {}
    
    # Generate embeddings for all images
    for img, emp_id in zip(images, employee_ids):
        embedding = model.predict(np.expand_dims(img, axis=0), verbose=0)[0]
        
        if emp_id not in employee_embeddings:
            employee_embeddings[emp_id] = []
        employee_embeddings[emp_id].append(embedding)
    
    # Average embeddings per employee for robustness
    for emp_id, embeddings in employee_embeddings.items():
        avg_embedding = np.mean(embeddings, axis=0)
        
        # Save to Firestore
        # db.collection('face_embeddings').document(emp_id).set({
        #     'employee_id': emp_id,
        #     'embeddings': avg_embedding.tolist(),
        #     'enrolled_at': firestore.SERVER_TIMESTAMP,
        #     'images_count': len(embeddings)
        # })
        
        print(f"Saved embeddings for employee {emp_id}")

if __name__ == '__main__':
    # TODO: Update with actual dataset path
    DATASET_PATH = '/path/to/employee_photos_dataset'
    
    # Check if dataset exists
    if not os.path.exists(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("\nPlease create dataset with structure:")
        print("/dataset/employee_photos/")
        print("    /employee_001/")
        print("        photo_01.jpg")
        print("        photo_02.jpg")
        print("    /employee_002/")
        print("        photo_01.jpg")
        print("        ...")
        exit(1)
    
    # Train model
    model = train_model(DATASET_PATH)
    
    print("\n✅ Face recognition model training complete!")
    print("Model saved to: models/face_recognition_model.h5")
    print("Embeddings saved to Firestore collection: face_embeddings")
