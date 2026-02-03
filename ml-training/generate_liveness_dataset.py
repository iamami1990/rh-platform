"""
Synthetic Liveness Dataset Generator
Creates mock live/spoof videos for liveness detection training

This generates synthetic videos when real liveness datasets are not available.
For production, use public datasets (NUAA, Replay-Attack, CASIA).
"""

import os
import numpy as np
import cv2
from generate_face_dataset import generate_synthetic_face
import random

# Configuration
OUTPUT_DIR = 'dataset/liveness'
NUM_LIVE_VIDEOS = 30
NUM_SPOOF_VIDEOS = 30
FRAMES_PER_VIDEO = 30
IMG_SIZE = 224

def add_print_effect(frame):
    """
    Add print/paper texture effect to simulate printed photo attack
    """
    # Add paper texture
    texture = np.random.randint(230, 255, frame.shape, dtype=np.uint8)
    alpha = 0.1
    frame = cv2.addWeighted(frame, 1 - alpha, texture, alpha, 0)
    
    # Reduce contrast (printed photos have less dynamic range)
    frame = cv2.convertScaleAbs(frame, alpha=0.8, beta=30)
    
    # Add slight blur (printed photos less sharp)
    frame = cv2.GaussianBlur(frame, (3, 3), 0)
    
    return frame

def add_screen_effect(frame):
    """
    Add screen replay effect (moiré pattern, pixel grid)
    """
    # Add moiré pattern
    rows, cols = frame.shape[:2]
    for i in range(0, rows, 4):
        frame[i:i+1, :] = frame[i:i+1, :] * 0.95
    
    # Slight brightness pulsing (screen refresh)
    brightness = random.uniform(0.95, 1.05)
    frame = cv2.convertScaleAbs(frame, alpha=brightness, beta=0)
    
    return frame

def generate_live_video(video_num):
    """
    Generate synthetic live face video
    """
    print(f"Generating live video {video_num}...")
    
    video_path = os.path.join(OUTPUT_DIR, 'train', 'live', f'live_{video_num:03d}.mp4')
    
    # Video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 10.0, (IMG_SIZE, IMG_SIZE))
    
    for frame_num in range(FRAMES_PER_VIDEO):
        # Generate base face with slight variations (micro-movements)
        variation = 'normal' if frame_num % 5 != 0 else random.choice(['smile', 'left', 'right'])
        frame = generate_synthetic_face(f'live_{video_num}', frame_num, variation)
        frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
        
        # Add natural micro-movements
        shift_x = int(np.sin(frame_num / 10) * 3)
        shift_y = int(np.cos(frame_num / 10) * 2)
        M = np.float32([[1, 0, shift_x], [0, 1, shift_y]])
        frame = cv2.warpAffine(frame, M, (IMG_SIZE, IMG_SIZE))
        
        # Random subtle lighting changes (natural)
        brightness = 1.0 + np.sin(frame_num / 15) * 0.05
        frame = cv2.convertScaleAbs(frame, alpha=brightness, beta=0)
        
        # Write frame
        out.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
    
    out.release()

def generate_spoof_video(video_num, spoof_type='print'):
    """
    Generate synthetic spoofing attack video
    """
    print(f"Generating spoof video {video_num} (type: {spoof_type})...")
    
    subdir = 'spoof'
    video_path = os.path.join(OUTPUT_DIR, 'train', subdir, f'{spoof_type}_{video_num:03d}.mp4')
    
    # Video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(video_path, fourcc, 10.0, (IMG_SIZE, IMG_SIZE))
    
    for frame_num in range(FRAMES_PER_VIDEO):
        # Generate static face (spoofs don't have natural movement)
        frame = generate_synthetic_face(f'spoof_{video_num}', 0, 'normal')
        frame = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
        
        # Apply spoof effects
        if spoof_type == 'print':
            frame = add_print_effect(frame)
            # Static with only camera movement
            shift_x = int(np.sin(frame_num / 20) * 1)
            shift_y = int(np.cos(frame_num / 20) * 1)
        elif spoof_type == 'replay':
            frame = add_screen_effect(frame)
            # Very slight movement (holding phone)
            shift_x = int(np.random.normal(0, 0.5))
            shift_y = int(np.random.normal(0, 0.5))
        else:  # mask
            # Slight blur for mask
            frame = cv2.GaussianBlur(frame, (5, 5), 0)
            shift_x = int(np.sin(frame_num / 15) * 2)
            shift_y = int(np.cos(frame_num / 15) * 1)
        
        M = np.float32([[1, 0, shift_x], [0, 1, shift_y]])
        frame = cv2.warpAffine(frame, M, (IMG_SIZE, IMG_SIZE))
        
        # Write frame
        out.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
    
    out.release()

def generate_dataset():
    """
    Generate complete synthetic liveness dataset
    """
    print("Generating synthetic liveness dataset...")
    
    # Create directories
    os.makedirs(os.path.join(OUTPUT_DIR, 'train', 'live'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'train', 'spoof'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'test', 'live'), exist_ok=True)
    os.makedirs(os.path.join(OUTPUT_DIR, 'test', 'spoof'), exist_ok=True)
    
    # Generate training live videos
    print("\n[1/4] Generating training live videos...")
    for i in range(1, int(NUM_LIVE_VIDEOS * 0.8) + 1):
        generate_live_video(i)
    
    # Generate training spoof videos
    print("\n[2/4] Generating training spoof videos...")
    spoof_types = ['print'] * 10 + ['replay'] * 10 + ['mask'] * 4
    for i in range(1, int(NUM_SPOOF_VIDEOS * 0.8) + 1):
        spoof_type = random.choice(spoof_types)
        generate_spoof_video(i, spoof_type)
    
    # Generate test live videos
    print("\n[3/4] Generating test live videos...")
    for i in range(int(NUM_LIVE_VIDEOS * 0.8) + 1, NUM_LIVE_VIDEOS + 1):
        # Save to test directory
        old_path = os.path.join(OUTPUT_DIR, 'train', 'live', f'live_{i:03d}.mp4')
        new_dir = os.path.join(OUTPUT_DIR, 'test', 'live')
        generate_live_video(i)
        # Move from train to test
        import shutil
        src = os.path.join(OUTPUT_DIR, 'train', 'live', f'live_{i:03d}.mp4')
        dst = os.path.join(OUTPUT_DIR, 'test', 'live', f'live_{i:03d}.mp4')
        if os.path.exists(src):
            shutil.move(src, dst)
    
    # Generate test spoof videos
    print("\n[4/4] Generating test spoof videos...")
    for i in range(int(NUM_SPOOF_VIDEOS * 0.8) + 1, NUM_SPOOF_VIDEOS + 1):
        spoof_type = random.choice(spoof_types)
        generate_spoof_video(i, spoof_type)
        # Move from train to test
        import shutil
        src = os.path.join(OUTPUT_DIR, 'train', 'spoof', f'{spoof_type}_{i:03d}.mp4')
        dst = os.path.join(OUTPUT_DIR, 'test', 'spoof', f'{spoof_type}_{i:03d}.mp4')
        if os.path.exists(src):
            shutil.move(src, dst)
    
    print(f"\n✅ Liveness dataset generated successfully!")
    print(f"Location: {OUTPUT_DIR}")
    print(f"Training live: {int(NUM_LIVE_VIDEOS * 0.8)} videos")
    print(f"Training spoof: {int(NUM_SPOOF_VIDEOS * 0.8)} videos")
    print(f"Test live: {int(NUM_LIVE_VIDEOS * 0.2)} videos")
    print(f"Test spoof: {int(NUM_SPOOF_VIDEOS * 0.2)} videos")

if __name__ == '__main__':
    generate_dataset()
    
    print("\nDataset ready for training!")
    print("Run: python train_liveness_detection.py")
