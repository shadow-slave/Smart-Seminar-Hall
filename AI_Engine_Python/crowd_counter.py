import cv2
import mediapipe as mp
import numpy as np
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# --- 1. FIREBASE SETUP ---
cred = credentials.Certificate("serviceAccountKey.json")
try:
    firebase_admin.get_app()
except ValueError:
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://smart-seminar-hall-default-rtdb.asia-southeast1.firebasedatabase.app/' # ⚠️ REPLACE THIS
    })
ref = db.reference('seminar_hall/live_data')

# --- 2. NEW MEDIAPIPE SETUP (Tasks API) ---
base_options = python.BaseOptions(model_asset_path='face_landmarker.task')
options = vision.FaceLandmarkerOptions(
    base_options=base_options,
    num_faces=10, 
    min_face_detection_confidence=0.5)
detector = vision.FaceLandmarker.create_from_options(options)

# --- 3. WEBCAM SETUP ---
cap = cv2.VideoCapture(0)
last_upload_time = 0

print("🚀 AI Engine Started (New API)... Press 'q' to exit.")

while True:
    success, img = cap.read()
    if not success: break

    # Convert to MediaPipe Image
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img)
    
    # Detect Faces
    detection_result = detector.detect(mp_image)
    person_count = len(detection_result.face_landmarks)

    # Draw Boxes (Manual Drawing since mp.solutions is gone)
    for landmarks in detection_result.face_landmarks:
        # Get nose tip (Index 1) to draw a simple circle
        h, w, _ = img.shape
        cx, cy = int(landmarks[1].x * w), int(landmarks[1].y * h)
        cv2.circle(img, (cx, cy), 15, (0, 255, 0), -1)

    # Display Text
    cv2.putText(img, f'Count: {person_count}', (50, 100), 
                cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 3)

    # --- 4. UPLOAD ---
    if time.time() - last_upload_time > 2.0:
        try:
            ref.update({'person_count': person_count})
            print(f"📤 Uploaded: {person_count}")
            last_upload_time = time.time()
        except Exception as e:
            print("Upload Error:", e)

    cv2.imshow("New AI Counter", img)
    if cv2.waitKey(1) & 0xFF == ord('q'): break

cap.release()
cv2.destroyAllWindows()