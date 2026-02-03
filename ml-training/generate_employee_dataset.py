"""
Synthetic Employee Data Generator
Creates mock historical employee data for sentiment/turnover prediction training

This generates synthetic employee records when real historical data is not available.
For production, export real employee data from Firestore.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Configuration
NUM_EMPLOYEES = 500
OUTPUT_FILE = 'dataset/employee_historical_data.csv'

# Departments and positions
DEPARTMENTS = ['IT', 'Sales', 'HR', 'Finance', 'Operations', 'Marketing', 'Support']
POSITIONS = {
    'IT': ['Developer', 'DevOps', 'QA Engineer', 'Tech Lead', 'CTO'],
    'Sales': ['Sales Rep', 'Account Manager', 'Sales Director'],
    'HR': ['HR Generalist', 'Recruiter', 'HR Manager'],
    'Finance': ['Accountant', 'Financial Analyst', 'CFO'],
    'Operations': ['Operations Manager', 'Logistics Coordinator'],
    'Marketing': ['Marketing Specialist', 'Content Creator', 'CMO'],
    'Support': ['Support Agent', 'Support Manager']
}
CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance']

def generate_employee_record(emp_id):
    """
    Generate synthetic employee record with realistic correlations
    """
    # Basic info
    department = random.choice(DEPARTMENTS)
    position = random.choice(POSITIONS[department])
    contract_type = random.choice(CONTRACT_TYPES)
    tenure_months = random.randint(1, 60)
    
    # Salary based on position and tenure
    base_salary = {
        'Developer': 2500, 'DevOps': 2800, 'QA Engineer': 2200,
        'Tech Lead': 4000, 'CTO': 6000,
        'Sales Rep': 1800, 'Account Manager': 2500, 'Sales Director': 4500,
        'HR Generalist': 2000, 'Recruiter': 1900, 'HR Manager': 3500,
        'Accountant': 2300, 'Financial Analyst': 2800, 'CFO': 5500,
        'Operations Manager': 3000, 'Logistics Coordinator': 2100,
        'Marketing Specialist': 2200, 'Content Creator': 2000, 'CMO': 5000,
        'Support Agent': 1700, 'Support Manager': 2800
    }
    
    salary = base_salary.get(position, 2000) + (tenure_months * 20) + random.randint(-200, 500)
    
    # Generate attendance metrics (correlated with turnover)
    # Employees who will leave have worse metrics
    will_leave = random.random() < 0.25  # 25% turnover rate
    
    if will_leave:
        # Poor performance indicators
        attendance_rate = random.uniform(70, 88)
        punctuality_rate = random.uniform(65, 85)
        late_count = random.randint(8, 25)
        absent_count = random.randint(5, 15)
        leave_days_used = random.randint(15, 35)
        performance_score = random.uniform(50, 75)
    else:
        # Good performance indicators
        attendance_rate = random.uniform(88, 99)
        punctuality_rate = random.uniform(85, 99)
        late_count = random.randint(0, 7)
        absent_count = random.randint(0, 4)
        leave_days_used = random.randint(0, 14)
        performance_score = random.uniform(75, 95)
    
    # Leave days available
    if contract_type == 'CDI':
        leave_days_available = 30
    elif contract_type == 'CDD':
        leave_days_available = 15
    else:
        leave_days_available = 10
    
    return {
        'employee_id': f'EMP{emp_id:04d}',
        'attendance_rate': round(attendance_rate, 2),
        'punctuality_rate': round(punctuality_rate, 2),
        'late_count': late_count,
        'absent_count': absent_count,
        'leave_days_used': leave_days_used,
        'leave_days_available': leave_days_available,
        'tenure_months': tenure_months,
        'department': department,
        'position': position,
        'contract_type': contract_type,
        'salary_brut': salary,
        'performance_score': round(performance_score, 2),
        'left_company': 1 if will_leave else 0
    }

def generate_dataset():
    """
    Generate complete synthetic employee dataset
    """
    print("Generating synthetic employee dataset...")
    print(f"Number of employees: {NUM_EMPLOYEES}")
    
    records = []
    for emp_id in range(1, NUM_EMPLOYEES + 1):
        record = generate_employee_record(emp_id)
        records.append(record)
        
        if emp_id % 100 == 0:
            print(f"Progress: {emp_id}/{NUM_EMPLOYEES} employees")
    
    # Create DataFrame
    df = pd.DataFrame(records)
    
    # Create output directory
    import os
    os.makedirs('dataset', exist_ok=True)
    
    # Save to CSV
    df.to_csv(OUTPUT_FILE, index=False)
    
    print(f"\n✅ Dataset generated successfully!")
    print(f"Location: {OUTPUT_FILE}")
    print(f"\nDataset statistics:")
    print(f"  Total employees: {len(df)}")
    print(f"  Employees who left: {df['left_company'].sum()} ({df['left_company'].mean() * 100:.1f}%)")
    print(f"  Employees retained: {len(df) - df['left_company'].sum()} ({(1 - df['left_company'].mean()) * 100:.1f}%)")
    print(f"\nDepartment distribution:")
    print(df['department'].value_counts())
    print(f"\nContract type distribution:")
    print(df['contract_type'].value_counts())
    
    # Display sample
    print(f"\nSample records:")
    print(df.head(10).to_string())

if __name__ == '__main__':
    generate_dataset()
    
    print("\n" + "="*70)
    print("Dataset ready for training!")
    print("Run: python train_sentiment_ml.py")
    print("="*70)
