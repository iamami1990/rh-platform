# Guide ML/IA - Reconnaissance Faciale & Liveness Detection

**Version:** 1.0.0  
**Phase:** 5 - Advanced AI Features

---

## 🤖 Vue d'Ensemble

Ce document décrit les fonctionnalités IA avancées nécessitant expertise ML :
- Reconnaissance faciale pour authentification
- Liveness detection (anti-spoofing)
- Amélioration modèle de sentiment

---

## 👤 Reconnaissance Faciale

### Infrastructure Créée

**Mobile App Component:**
- `mobile-app/components/FaceRecognitionCamera.js`
- Utilise `react-native-camera` pour détection faciale
- Interface prête pour intégration ML

### Implémentation Requise (ML Expertise)

#### 1. Collecte de Données

**Étapes:**
```
1. Photographier chaque employé (multiple angles)
   - Face frontale
   - Profil gauche/droit
   - Différentes expressions
   - Conditions d'éclairage variées

2. Normalisation images
   - Résolution: 300x300px
   - Format: JPG
   - Alignement visage automatique

3. Labellisation
   - Associer employee_id à chaque ensemble d'images
```

#### 2. Entraînement Modèle

**Technologies recommandées:**
- **FaceNet** (Google)
- **ArcFace** 
- **Dlib** (C++ library)
- **face-api.js** (JavaScript)

**Pipeline:**
```python
# Exemple avec Python + TensorFlow

import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2

# 1. Prétraitement
def preprocess_image(image_path):
    img = tf.io.read_file(image_path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, [224, 224])
    img = tf.keras.applications.mobilenet_v2.preprocess_input(img)
    return img

# 2. Modèle d'embeddings
base_model = MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights='imagenet'
)

# Ajouter couches pour face recognition
model = tf.keras.Sequential([
    base_model,
    tf.keras.layers.GlobalAveragePooling2D(),
    tf.keras.layers.Dense(128, activation=None),  # Face embeddings
    tf.keras.layers.Lambda(lambda x: tf.math.l2_normalize(x, axis=1))
])

# 3. Triplet Loss pour entraînement
def triplet_loss(y_true, y_pred, alpha=0.2):
    anchor, positive, negative = y_pred[:,:128], y_pred[:,128:256], y_pred[:,256:]
    
    pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=1)
    neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=1)
    
    loss = tf.maximum(pos_dist - neg_dist + alpha, 0.0)
    return tf.reduce_mean(loss)

# 4. Entraînement
model.compile(optimizer='adam', loss=triplet_loss)
model.fit(train_dataset, epochs=50, validation_data=val_dataset)
```

#### 3. Stockage Embeddings

**Firebase Firestore:**
```javascript
// Collection: face_embeddings
{
  employee_id: "emp_123",
  embeddings: [0.123, -0.456, ...],  // 128-dimensional vector
  created_at: "2025-01-15T10:00:00Z",
  updated_at: "2025-01-15T10:00:00Z"
}
```

#### 4. Backend Endpoint

**Ajouter à `routes/face-recognition.js`:**
```javascript
router.post('/verify', async (req, res) => {
  try {
    const { image_base64 } = req.body;
    
    // 1. Extraire face embedding de l'image
    const embedding = await extractFaceEmbedding(image_base64);
    
    // 2. Comparer avec tous les embeddings stockés
    const employees = await db.collection('face_embeddings').get();
    let bestMatch = null;
    let bestDistance = Infinity;
    
    employees.forEach(doc => {
      const distance = calculateEuclideanDistance(embedding, doc.data().embeddings);
      if (distance < bestDistance && distance < 0.6) {  // Threshold
        bestDistance = distance;
        bestMatch = doc.data().employee_id;
      }
    });
    
    if (bestMatch) {
      res.json({
        success: true,
        employee_id: bestMatch,
        confidence: 1 - bestDistance
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Visage non reconnu'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## 🛡️ Liveness Detection (Anti-Spoofing)

### Objectif

Détecter si c'est un vrai visage ou une photo/vidéo.

### Techniques

#### 1. Challenge-Response

**Implémentation:**
```javascript
// Demander action aléatoire
const challenges = ['Souriez', 'Clignez des yeux', 'Tournez la tête à gauche'];
const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];

// Vérifier que l'action est effectuée
```

#### 2. Analyse de Texture

**Détecter impression écran vs peau réelle:**
```python
import cv2
import numpy as np

def detect_print_attack(image):
    # Analyse fréquences spatiales
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = laplacian.var()
    
    # Image réelle a plus de variance de texture
    return variance > 100  # Threshold à ajuster
```

#### 3. Détection de Profondeur

**Utiliser caméra IR ou dual camera si disponible**

#### 4. Analyse Temporelle

**Détecter mouvement naturel du visage:**
```python
def analyze_micro_movements(video_frames):
    # Comparer frames successives
    # Détecter micro-mouvements involontaires (battements cœur, etc.)
    pass
```

### Modèle ML Liveness

**Dataset:**
- NUAA Photograph Imposter Database
- Replay-Attack Database
- CASIA Face Anti-Spoofing Database

**Architecture:**
```python
# CNN pour classification live/spoof
model = tf.keras.Sequential([
    tf.keras.layers.Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(1, activation='sigmoid')  # 0=spoof, 1=live
])

model.compile(
    optimizer='adam',
    loss='binary_crossentropy',
    metrics=['accuracy']
)
```

---

## 📊 Amélioration Sentiment Analysis

### Modèle Actuel

**Basique - Score calculé:**
```javascript
attendance_score + punctuality_score + assiduity_score + workload_score
```

### Améliorations ML

#### 1. Feature Engineering

**Ajouter features:**
```python
features = [
    'attendance_rate',
    'punctuality_rate', 
    'avg_hours_worked',
    'overtime_frequency',
    'leave_requests_count',
    'late_checkin_trend',  # Trend over 3 months
    'absence_pattern',     # Weekend vs weekday
    'performance_reviews',
    'peer_feedback_score',
    'manager_feedback_score'
]
```

#### 2. Modèle Prédictif

**Prédire risque turnover:**
```python
import xgboost as xgb
from sklearn.model_selection import train_test_split

# Préparer données
X = employee_features
y = employee_left  # 0/1 binary

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Entraîner XGBoost
model = xgb.XGBClassifier(
    max_depth=5,
    learning_rate=0.1,
    n_estimators=100
)

model.fit(X_train, y_train)

# Prédire probabilité de départ
turnover_probability = model.predict_proba(new_employee_features)[:, 1]
```

#### 3. Analyse de Sentiment Textuel

**Analyser feedback écrit:**
```python
from transformers import pipeline

sentiment_analyzer = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment"
)

# Analyser commentaires employés
feedback_sentiment = sentiment_analyzer(employee_comments)
```

#### 4. Clustering Comportemental

**Identifier patterns:**
```python
from sklearn.cluster import KMeans

# Grouper employés par comportement similaire
kmeans = KMeans(n_clusters=5)
behavior_clusters = kmeans.fit_predict(employee_features)

# Profils types:
# Cluster 0: High performers
# Cluster 1: At risk - low attendance
# Cluster 2: Stable average
# etc.
```

---

## 🚀 Roadmap d'Implémentation

### Phase 5.1 - Reconnaissance Faciale (2-3 semaines)

**Semaine 1:**
- [ ] Collecter photos employés (minimum 20 par personne)
- [ ] Setup environnement ML (Python + TensorFlow)
- [ ] Préparer dataset (normalisation, augmentation)

**Semaine 2:**
- [ ] Entraîner modèle FaceNet
- [ ] Générer embeddings pour tous les employés
- [ ] Tester précision (>95% requis)

**Semaine 3:**
- [ ] Déployer modèle (TensorFlow Serving ou cloud)
- [ ] Créer endpoint backend `/face-recognition/verify`
- [ ] Intégrer dans app mobile
- [ ] Tests end-to-end

### Phase 5.2 - Liveness Detection (1-2 semaines)

**Semaine 1:**
- [ ] Télécharger datasets anti-spoofing
- [ ] Entraîner modèle liveness CNN
- [ ] Valider sur test set (>90% accuracy)

**Semaine 2:**
- [ ] Intégrer dans pipeline de reconnaissance
- [ ] Ajouter challenge-response UI
- [ ] Tests anti-spoofing (photos, vidéos)

### Phase 5.3 - Sentiment ML (1 semaine)

- [ ] Collection données historiques (6+ mois)
- [ ] Feature engineering avancé
- [ ] Entraîner modèle XGBoost
- [ ] A/B test vs modèle actuel
- [ ] Déploiement graduel

---

## 🔧 Outils & Technologies

**ML Frameworks:**
- TensorFlow / PyTorch
- Scikit-learn
- XGBoost
- OpenCV

**Deployment:**
- TensorFlow Serving
- ONNX Runtime
- Google Cloud AI Platform
- AWS SageMaker

**Monitoring:**
- MLflow
- Weights & Biases
- TensorBoard

---

## 📊 Métriques de Succès

**Face Recognition:**
- Précision: >95%
- Faux positifs: <2%
- Faux négatifs: <3%
- Temps réponse: <2s

**Liveness Detection:**
- Détection spoofing: >90%
- Temps vérification: <3s

**Sentiment Prediction:**
- AUC-ROC: >0.80
- Précision prédiction turnover: >75%

---

## ⚠️ Considérations Éthiques & Légales

**RGPD Compliance:**
- Consentement explicite pour biométrie
- Droit à l'effacement des données
- Transparence sur l'utilisation des données

**Biais & Équité:**
- Tester sur diversité ethnique
- Éviter discrimination algorithmique
- Audit régulier des prédictions

**Sécurité:**
- Chiffrement embeddings au repos
- Pas de stockage images brutes long-terme
- Access control strict aux modèles

---

**Note:** Cette phase nécessite expertise ML avancée. Recommandation: recruter Data Scientist ML ou sous-traiter à expert.
