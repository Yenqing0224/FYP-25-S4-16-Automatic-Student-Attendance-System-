import cv2
import numpy as np
import mediapipe as mp
from fastapi import FastAPI, UploadFile, File, Form, HTTPException

app = FastAPI()

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

def get_head_pose(landmarks, width, height):
    image_points = np.array([
        (landmarks[1].x * width, landmarks[1].y * height),       # Nose tip
        (landmarks[152].x * width, landmarks[152].y * height),   # Chin
        (landmarks[33].x * width, landmarks[33].y * height),     # Left eye left corner
        (landmarks[263].x * width, landmarks[263].y * height),   # Right eye right corner
        (landmarks[61].x * width, landmarks[61].y * height),     # Left mouth corner
        (landmarks[291].x * width, landmarks[291].y * height)    # Right mouth corner
    ], dtype="double")

    model_points = np.array([
        (0.0, 0.0, 0.0),             # Nose tip
        (0.0, -330.0, -65.0),        # Chin
        (-225.0, 170.0, -135.0),     # Left eye left corner
        (225.0, 170.0, -135.0),      # Right eye right corner
        (-150.0, -150.0, -125.0),    # Left mouth corner
        (150.0, -150.0, -125.0)      # Right mouth corner
    ])

    focal_length = width
    center = (width / 2, height / 2)
    camera_matrix = np.array(
        [[focal_length, 0, center[0]],
         [0, focal_length, center[1]],
         [0, 0, 1]], dtype="double"
    )

    dist_coeffs = np.zeros((4, 1)) 
    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
    )

    rmat, _ = cv2.Rodrigues(rotation_vector)
    _, _, _, _, _, _, angles = cv2.decomposeProjectionMatrix(np.hstack((rmat, translation_vector)))
    
    pitch = angles[0][0]
    yaw = angles[1][0]

    # Normalization
    if pitch > 160: pitch -= 180
    elif pitch < -160: pitch += 180
    
    if yaw > 160: yaw -= 180
    elif yaw < -160: yaw += 180

    return pitch, yaw

@app.post("/verify-pose")
async def verify_pose(pose: str = Form(...), file: UploadFile = File(...)):
    # Read Image
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file uploaded")

    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image")

    h, w, _ = img.shape

    # Process with MediaPipe
    results = face_mesh.process(cv2.cvtColor(img, cv2.COLOR_BGR2RGB))

    if not results.multi_face_landmarks:
        return {"valid": False, "detail": "No face detected", "current_yaw": 0, "current_pitch": 0}

    # Calculate Head Pose
    pitch, yaw = get_head_pose(results.multi_face_landmarks[0].landmark, w, h)

    # Pitch Rule
    # Valid Range: -10 to +15
    # If outside this range, fail.
    if pitch > 15:
        return {
            "valid": False, 
            "detail": "Keep head level! (Look UP a bit)", 
            "current_yaw": yaw, 
            "current_pitch": pitch
        }

    if pitch < -10:
        return {
            "valid": False, 
            "detail": "Keep head level! (Look DOWN a bit)", 
            "current_yaw": yaw, 
            "current_pitch": pitch
        }
    # Yaw Rules
    if pose == "center":
        # Keep center standard at 20
        if abs(yaw) < 20:
            return {"valid": True, "yaw": yaw, "pitch": pitch, "current_yaw": yaw, "current_pitch": pitch}
        return {"valid": False, "detail": "Look straight at the camera", "current_yaw": yaw, "current_pitch": pitch}
    
    elif pose == "left":
        if yaw < -45:
            return {"valid": True, "yaw": yaw, "pitch": pitch, "current_yaw": yaw, "current_pitch": pitch}
        return {"valid": False, "detail": "Turn your head MORE to the left", "current_yaw": yaw, "current_pitch": pitch}

    elif pose == "right":
        if yaw > 45:
            return {"valid": True, "yaw": yaw, "pitch": pitch, "current_yaw": yaw, "current_pitch": pitch}
        return {"valid": False, "detail": "Turn your head MORE to the right", "current_yaw": yaw, "current_pitch": pitch}

    return {"valid": False, "detail": "Invalid pose requested", "current_yaw": yaw, "current_pitch": pitch}

@app.get("/")
def health_check():
    return {"status": "Face Registration System is Live"}