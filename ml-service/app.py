from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import os
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=['http://localhost:5000', 'http://localhost:3000'])

# Load ML models
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

try:
    sentiment_model = joblib.load(os.path.join(MODEL_DIR, 'sentiment_xgboost_model.pkl'))
    turnover_model = joblib.load(os.path.join(MODEL_DIR, 'turnover_xgboost_model.pkl'))
    scaler = joblib.load(os.path.join(MODEL_DIR, 'scaler.pkl'))
    print("✅ Models loaded successfully")
except Exception as e:
    print(f"⚠️ Error loading models: {e}")
    sentiment_model = None
    turnover_model = None
    scaler = None

# Feature engineering functions
def calculate_features(employee_data):
    """Calculate features from employee data"""
    features = {}
    
    # Salary features
    features['salary_brut'] = float(employee_data.get('salary_brut', 0))
    features['salary_net'] = float(employee_data.get('salary_net', 0))
    
    # Seniority (in years)
    hire_date = employee_data.get('hireDate', datetime.now().isoformat())
    hire_datetime = datetime.fromisoformat(hire_date.split('T')[0])
    seniority_days = (datetime.now() - hire_datetime).days
    features['seniority_years'] = seniority_days / 365.25
    
    # Attendance features
    attendance = employee_data.get('attendance', {})
    features['attendance_rate'] = float(attendance.get('rate', 0.85))
    features['absences_count'] = int(attendance.get('absences', 0))
    features['late_days'] = int(attendance.get('late_days', 0))
    
    # Performance features
    performance = employee_data.get('performance', {})
    features['performance_score'] = float(performance.get('score', 3.0))
    features['objectives_completion'] = float(performance.get('objectives', 0.75))
    
    # Leave features
    leaves = employee_data.get('leaves', {})
    features['annual_leave_taken'] = int(leaves.get('taken', 0))
    features['sick_leave_count'] = int(leaves.get('sick', 0))
    
    # Overtime
    features['overtime_hours'] = float(employee_data.get('overtime_hours', 0))
    
    # Department encoding (simple numeric for now)
    dept_mapping = {'IT': 1, 'RH': 2, 'Finance': 3, 'Commercial': 4, 
                   'Production': 5, 'Marketing': 6, 'Direction': 7}
    features['department_code'] = dept_mapping.get(employee_data.get('department', 'IT'), 1)
    
    # Contract type
    contract_mapping = {'CDI': 1, 'CDD': 2, 'SIVP': 3, 'KARAMA': 4, 'Freelance': 5, 'Stage': 6}
    features['contract_type_code'] = contract_mapping.get(employee_data.get('contract_type', 'CDI'), 1)
    
    # Age (from birthDate if available)
    birth_date = employee_data.get('birthDate')
    if birth_date:
        try:
            birth_datetime = datetime.fromisoformat(birth_date.split('T')[0])
            age_days = (datetime.now() - birth_datetime).days
            features['age'] = age_days / 365.25
        except:
            features['age'] = 30.0  # default
    else:
        features['age'] = 30.0
    
    return features

def prepare_features_array(features, feature_names):
    """Prepare feature array in correct order"""
    return np.array([[features.get(name, 0) for name in feature_names]])

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    models_status = "loaded" if sentiment_model and turnover_model else "not loaded"
    return jsonify({
        'status': 'OK',
        'service': 'Olympia ML Service',
        'models': models_status,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict/sentiment', methods=['POST'])
def predict_sentiment():
    """Predict employee sentiment score"""
    try:
        if not sentiment_model:
            return jsonify({'error': 'Sentiment model not loaded'}), 500
        
        data = request.json
        employee_data = data.get('employee', {})
        
        # Calculate features
        features = calculate_features(employee_data)
        
        # Expected feature names (should match training)
        feature_names = [
            'salary_brut', 'salary_net', 'seniority_years', 'attendance_rate',
            'absences_count', 'late_days', 'performance_score', 
            'objectives_completion', 'annual_leave_taken', 'sick_leave_count',
            'overtime_hours', 'department_code', 'contract_type_code', 'age'
        ]
        
        # Prepare feature array
        X = prepare_features_array(features, feature_names)
        
        # Scale features
        if scaler:
            X = scaler.transform(X)
        
        # Predict
        sentiment_score = float(sentiment_model.predict(X)[0])
        
        # Classify risk level
        if sentiment_score >= 4.0:
            risk_level = 'low'
            message = 'Employé satisfait et engagé'
        elif sentiment_score >= 3.0:
            risk_level = 'moderate'
            message = 'Employé moyennement satisfait'
        else:
            risk_level = 'high'
            message = 'Employé à risque - attention requise'
        
        return jsonify({
            'success': True,
            'sentiment_score': round(sentiment_score, 2),
            'risk_level': risk_level,
            'message': message,
            'features_used': feature_names,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/turnover', methods=['POST'])
def predict_turnover():
    """Predict employee turnover probability"""
    try:
        if not turnover_model:
            return jsonify({'error': 'Turnover model not loaded'}), 500
        
        data = request.json
        employee_data = data.get('employee', {})
        
        # Calculate features
        features = calculate_features(employee_data)
        
        # Feature names
        feature_names = [
            'salary_brut', 'salary_net', 'seniority_years', 'attendance_rate',
            'absences_count', 'late_days', 'performance_score',
            'objectives_completion', 'annual_leave_taken', 'sick_leave_count',
            'overtime_hours', 'department_code', 'contract_type_code', 'age'
        ]
        
        # Prepare and scale
        X = prepare_features_array(features, feature_names)
        if scaler:
            X = scaler.transform(X)
        
        # Predict probability
        turnover_proba = float(turnover_model.predict_proba(X)[0][1])  # Probability of class 1 (turnover)
        
        # Risk classification
        if turnover_proba >= 0.7:
            risk_level = 'high'
            message = 'Risque élevé de départ - actions immédiates recommandées'
        elif turnover_proba >= 0.4:
            risk_level = 'moderate'
            message = 'Risque modéré - surveillance conseillée'
        else:
            risk_level = 'low'
            message = 'Risque faible de départ'
        
        return jsonify({
            'success': True,
            'turnover_probability': round(turnover_proba, 3),
            'turnover_percentage': round(turnover_proba * 100, 1),
            'risk_level': risk_level,
            'message': message,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    """Batch prediction for multiple employees"""
    try:
        if not sentiment_model or not turnover_model:
            return jsonify({'error': 'Models not loaded'}), 500
        
        data = request.json
        employees = data.get('employees', [])
        
        results = []
        for emp in employees:
            features = calculate_features(emp)
            feature_names = [
                'salary_brut', 'salary_net', 'seniority_years', 'attendance_rate',
                'absences_count', 'late_days', 'performance_score',
                'objectives_completion', 'annual_leave_taken', 'sick_leave_count',
                'overtime_hours', 'department_code', 'contract_type_code', 'age'
            ]
            
            X = prepare_features_array(features, feature_names)
            if scaler:
                X = scaler.transform(X)
            
            sentiment = float(sentiment_model.predict(X)[0])
            turnover_proba = float(turnover_model.predict_proba(X)[0][1])
            
            results.append({
                'employee_id': emp.get('employee_id'),
                'sentiment_score': round(sentiment, 2),
                'turnover_probability': round(turnover_proba, 3)
            })
        
        return jsonify({
            'success': True,
            'count': len(results),
            'predictions': results,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Olympia ML Service...")
    print(f"📁 Model directory: {MODEL_DIR}")
    app.run(host='0.0.0.0', port=5001, debug=True)
