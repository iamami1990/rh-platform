"""
Synthetic Face Dataset Generator
Creates mock employee face images for testing face recognition training

This generates synthetic face images when real employee photos are not available.
For production, replace with real employee photos.
"""

import os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont
import random

# Configuration
OUTPUT_DIR = 'dataset/employee_photos'
NUM_EMPLOYEES = 50
PHOTOS_PER_EMPLOYEE = 25
IMG_SIZE = 300

def generate_synthetic_face(employee_id, photo_num, variation='normal'):
    """
    Generate a synthetic face image
    For demo purposes - replace with real photos in production
    """
    # Create base image
    img = Image.new('RGB', (IMG_SIZE, IMG_SIZE), color=(230, 220, 210))
    draw = ImageDraw.Draw(img)
    
    # Random skin tone
    skin_tone = random.choice([
        (255, 220, 177),  # Light
        (241, 194, 125),  # Medium
        (198, 134, 66),   # Tan
        (141, 85, 36)     # Dark
    ])
    
    # Face oval
    face_color = tuple([c + random.randint(-20, 20) for c in skin_tone])
    draw.ellipse([50, 40, 250, 260], fill=face_color, outline=(0, 0, 0))
    
    # Eyes
    eye_y = 110 + random.randint(-10, 10)
    # Left eye
    draw.ellipse([90, eye_y, 120, eye_y + 20], fill='white', outline=(0, 0, 0))
    draw.ellipse([100, eye_y + 5, 110, eye_y + 15], fill='brown')
    # Right eye
    draw.ellipse([180, eye_y, 210, eye_y + 20], fill='white', outline=(0, 0, 0))
    draw.ellipse([190, eye_y + 5, 200, eye_y + 15], fill='brown')
    
    # Nose
    nose_points = [(150, 140), (140, 170), (160, 170)]
    draw.polygon(nose_points, outline=(0, 0, 0))
    
    # Mouth
    mouth_y = 190 + random.randint(-10, 10)
    if variation == 'smile':
        draw.arc([110, mouth_y, 190, mouth_y + 30], 0, 180, fill=(0, 0, 0), width=3)
    else:
        draw.line([110, mouth_y + 10, 190, mouth_y + 10], fill=(0, 0, 0), width=3)
    
    # Hair
    hair_color = random.choice([(0, 0, 0), (101, 67, 33), (165, 42, 42)])
    draw.ellipse([40, 20, 260, 120], fill=hair_color)
    
    # Add some noise for variation
    img_array = np.array(img)
    noise = np.random.normal(0, 5, img_array.shape).astype(np.uint8)
    img_array = np.clip(img_array + noise, 0, 255)
    
    # Random rotation for variation
    if variation in ['left', 'right']:
        angle = 15 if variation == 'left' else -15
        img_array = rotate_image(img_array, angle)
    
    # Random brightness
    brightness_factor = random.uniform(0.8, 1.2)
    img_array = np.clip(img_array * brightness_factor, 0, 255).astype(np.uint8)
    
    return img_array

def rotate_image(image, angle):
    """Rotate image by angle"""
    height, width = image.shape[:2]
    center = (width // 2, height // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(image, matrix, (width, height), 
                             borderMode=cv2.BORDER_CONSTANT, 
                             borderValue=(230, 220, 210))
    return rotated

def generate_dataset():
    """
    Generate complete synthetic face dataset
    """
    print("Generating synthetic face dataset...")
    print(f"Employees: {NUM_EMPLOYEES}")
    print(f"Photos per employee: {PHOTOS_PER_EMPLOYEE}")
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    variations = ['normal'] * 15 + ['smile'] * 5 + ['left'] * 2 + ['right'] * 3
    
    for emp_num in range(1, NUM_EMPLOYEES + 1):
        employee_id = f'employee_{emp_num:03d}'
        employee_dir = os.path.join(OUTPUT_DIR, employee_id)
        os.makedirs(employee_dir, exist_ok=True)
        
        print(f"Generating photos for {employee_id}...")
        
        for photo_num in range(1, PHOTOS_PER_EMPLOYEE + 1):
            variation = random.choice(variations)
            img_array = generate_synthetic_face(employee_id, photo_num, variation)
            
            # Save image
            photo_path = os.path.join(employee_dir, f'photo_{photo_num:02d}.jpg')
            cv2.imwrite(photo_path, cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR))
        
        if emp_num % 10 == 0:
            print(f"Progress: {emp_num}/{NUM_EMPLOYEES} employees")
    
    print(f"\n✅ Dataset generated successfully!")
    print(f"Location: {OUTPUT_DIR}")
    print(f"Total images: {NUM_EMPLOYEES * PHOTOS_PER_EMPLOYEE}")

if __name__ == '__main__':
    generate_dataset()
    
    print("\nDataset ready for training!")
    print("Run: python train_face_recognition.py")
