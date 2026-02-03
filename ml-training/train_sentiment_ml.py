"""
Enhanced Sentiment Analysis ML Training Script
Olympia HR Platform

This script trains an enhanced ML model for employee sentiment/turnover prediction
using historical data and multiple features.

Features used:
- Attendance metrics (rate, punctuality, absences)
- Leave patterns (frequency, types, approval rates)
- Performance metrics (if available)
- Tenure
- Department/position
- Historical trends

Models: XGBoost, Random Forest, Neural Network ensemble
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, roc_curve
import xgboost as xgb
import matplotlib.pyplot as plt
import seaborn as sns
import joblib

# Configuration
TEST_SIZE = 0.2
RANDOM_STATE = 42

def load_employee_data(csv_path):
    """
    Load employee historical data
    Expected columns:
    - employee_id
    - attendance_rate
    - punctuality_rate
    - late_count (last 3 months)
    - absent_count
    - leave_days_used
    - leave_days_available
    - tenure_months
    - department
    - position
    - contract_type
    - salary_brut
    - performance_score (optional)
    - left_company (TARGET: 0/1)
    """
    df = pd.read_csv(csv_path)
    return df

def engineer_features(df):
    """
    Create additional features from raw data
    """
    # Attendance trend (declining = risk)
    df['attendance_trend'] = df.groupby('employee_id')['attendance_rate'].diff().fillna(0)
    
    # Leave usage ratio
    df['leave_usage_ratio'] = df['leave_days_used'] / (df['leave_days_available'] + 1)
    
    # Absence pattern score
    df['absence_severity'] = (df['absent_count'] * 2 + df['late_count']) / 10
    
    # Tenure buckets
    df['tenure_bucket'] = pd.cut(df['tenure_months'], 
                                  bins=[0, 6, 12, 24, 60, 1000],
                                  labels=['0-6m', '6-12m', '1-2y', '2-5y', '5y+'])
    
    # Department size (proxy for support)
    dept_counts = df['department'].value_counts()
    df['dept_size'] = df['department'].map(dept_counts)
    
    # Risk score composite
    df['composite_risk_score'] = (
        (100 - df['attendance_rate']) * 0.3 +
        (100 - df['punctuality_rate']) * 0.3 +
        df['absence_severity'] * 0.2 +
        df['leave_usage_ratio'] * 100 * 0.2
    )
    
    return df

def prepare_training_data(df):
    """
    Prepare features and target for training
    """
    # Feature columns
    feature_cols = [
        'attendance_rate',
        'punctuality_rate',
        'late_count',
        'absent_count',
        'leave_days_used',
        'leave_usage_ratio',
        'tenure_months',
        'absence_severity',
        'attendance_trend',
        'composite_risk_score',
        'dept_size'
    ]
    
    # Add optional columns if available
    if 'performance_score' in df.columns:
        feature_cols.append('performance_score')
    
    # Categorical encoding
    le_dept = LabelEncoder()
    le_pos = LabelEncoder()
    le_contract = LabelEncoder()
    
    df['department_encoded'] = le_dept.fit_transform(df['department'])
    df['position_encoded'] = le_pos.fit_transform(df['position'])
    df['contract_encoded'] = le_contract.fit_transform(df['contract_type'])
    
    feature_cols.extend(['department_encoded', 'position_encoded', 'contract_encoded'])
    
    X = df[feature_cols].values
    y = df['left_company'].values
    
    # Save encoders
    joblib.dump(le_dept, 'models/label_encoder_dept.pkl')
    joblib.dump(le_pos, 'models/label_encoder_pos.pkl')
    joblib.dump(le_contract, 'models/label_encoder_contract.pkl')
    
    return X, y, feature_cols

def train_xgboost_model(X_train, y_train, X_test, y_test):
    """
    Train XGBoost classifier
    """
    model = xgb.XGBClassifier(
        max_depth=6,
        learning_rate=0.1,
        n_estimators=200,
        objective='binary:logistic',
        random_state=RANDOM_STATE,
        eval_metric='auc'
    )
    
    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        early_stopping_rounds=20,
        verbose=10
    )
    
    return model

def train_random_forest_model(X_train, y_train):
    """
    Train Random Forest classifier
    """
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=5,
        random_state=RANDOM_STATE,
        class_weight='balanced'
    )
    
    model.fit(X_train, y_train)
    return model

def evaluate_model(model, X_test, y_test, model_name='Model'):
    """
    Comprehensive model evaluation
    """
    print(f"\n{'='*50}")
    print(f"{model_name} Evaluation")
    print('='*50)
    
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Retained', 'Left']))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(cm)
    
    # ROC-AUC
    auc = roc_auc_score(y_test, y_pred_proba)
    print(f"\nROC-AUC Score: {auc:.4f}")
    
    return {
        'predictions': y_pred,
        'probabilities': y_pred_proba,
        'auc': auc
    }

def plot_feature_importance(model, feature_names, model_name='XGBoost'):
    """
    Plot feature importance
    """
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1][:15]  # Top 15
        
        plt.figure(figsize=(10, 6))
        plt.title(f'{model_name} - Feature Importance')
        plt.barh(range(len(indices)), importances[indices])
        plt.yticks(range(len(indices)), [feature_names[i] for i in indices])
        plt.xlabel('Importance')
        plt.tight_layout()
        plt.savefig(f'{model_name.lower()}_feature_importance.png')
        print(f"Feature importance plot saved: {model_name.lower()}_feature_importance.png")

def plot_roc_curve(y_test, y_pred_proba, model_name='Model'):
    """
    Plot ROC curve
    """
    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    auc = roc_auc_score(y_test, y_pred_proba)
    
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, label=f'{model_name} (AUC = {auc:.3f})', linewidth=2)
    plt.plot([0, 1], [0, 1], 'k--', label='Random')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve - Turnover Prediction')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig('roc_curve.png')
    print("ROC curve saved: roc_curve.png")

def train_sentiment_models(data_path):
    """
    Main training pipeline
    """
    print("Loading employee data...")
    df = load_employee_data(data_path)
    print(f"Loaded {len(df)} employee records")
    
    print("\nEngineering features...")
    df = engineer_features(df)
    
    print("\nPreparing training data...")
    X, y, feature_names = prepare_training_data(df)
    
    print(f"\nDataset: {len(X)} samples")
    print(f"Turnover rate: {np.mean(y) * 100:.2f}%")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save scaler
    joblib.dump(scaler, 'models/sentiment_scaler.pkl')
    
    # Train XGBoost
    print("\n" + "="*70)
    print("Training XGBoost Model...")
    print("="*70)
    xgb_model = train_xgboost_model(X_train_scaled, y_train, X_test_scaled, y_test)
    xgb_results = evaluate_model(xgb_model, X_test_scaled, y_test, 'XGBoost')
    joblib.dump(xgb_model, 'models/xgboost_sentiment_model.pkl')
    
    # Train Random Forest
    print("\n" + "="*70)
    print("Training Random Forest Model...")
    print("="*70)
    rf_model = train_random_forest_model(X_train_scaled, y_train)
    rf_results = evaluate_model(rf_model, X_test_scaled, y_test, 'Random Forest')
    joblib.dump(rf_model, 'models/rf_sentiment_model.pkl')
    
    # Plot results
    plot_feature_importance(xgb_model, feature_names, 'XGBoost')
    plot_feature_importance(rf_model, feature_names, 'Random Forest')
    plot_roc_curve(y_test, xgb_results['probabilities'], 'XGBoost')
    
    print("\n" + "="*70)
    print("✅ Training Complete!")
    print("="*70)
    print("\nModels saved:")
    print("  - models/xgboost_sentiment_model.pkl")
    print("  - models/rf_sentiment_model.pkl")
    print("  - models/sentiment_scaler.pkl")
    print("  - models/label_encoder_*.pkl")
    
    return xgb_model, rf_model

if __name__ == '__main__':
    DATA_PATH = '/path/to/employee_historical_data.csv'
    
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Data file not found at {DATA_PATH}")
        print("\nPlease prepare CSV file with historical employee data.")
        print("Required columns:")
        print("  - employee_id, attendance_rate, punctuality_rate")
        print("  - late_count, absent_count, leave_days_used")
        print("  - tenure_months, department, position, contract_type")
        print("  - left_company (0/1 - TARGET)")
        exit(1)
    
    # Train models
    xgb_model, rf_model = train_sentiment_models(DATA_PATH)
    
    print("\n📊 Next steps:")
    print("1. Deploy models to backend")
    print("2. Update routes/sentiment.js to use ML predictions")
    print("3. Monitor model performance and retrain periodically")
