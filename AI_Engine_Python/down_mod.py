import urllib.request
import os

url = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task"
filename = "face_landmarker.task"

print(f"⬇️ Downloading {filename} from Google...")

try:
    urllib.request.urlretrieve(url, filename)
    print("✅ Download Complete!")
    print(f"📂 File saved at: {os.path.abspath(filename)}")
except Exception as e:
    print(f"❌ Error: {e}")