from django.utils import timezone
from datetime import datetime, timedelta
import cv2
import numpy as np
from rest_framework.exceptions import ValidationError

class AcademicLogic:

    @staticmethod
    def get_upcoming_class_window():
        local_now = timezone.localtime(timezone.now())
        start_range = local_now
        end_range = local_now + timedelta(minutes=40)
        target_date = start_range.date()
        
        return target_date, start_range.time(), end_range.time()


    @staticmethod
    def determine_leave_status(has_leave):
        if has_leave:
            return 'on_leave'
        return 'absent'
    

    @staticmethod
    def determine_class_status(current_dt, class_date, start_time, end_time, current_status):
        if current_status == "cancelled":
            return 'cancelled'

        start_dt = datetime.combine(class_date, start_time)
        end_dt = datetime.combine(class_date, end_time)

        if end_dt < start_dt:
            end_dt += timedelta(days=1)
        
        start_dt = start_dt.replace(tzinfo=current_dt.tzinfo)
        end_dt = end_dt.replace(tzinfo=current_dt.tzinfo)

        if current_dt < start_dt:
            return 'upcoming'
        elif start_dt <= current_dt < end_dt:
            return 'in_progress'
        else:
            return 'completed'
        

    @staticmethod
    def is_valid_attendance_window(current_time, session):
        session_start_dt = datetime.combine(session.date, session.start_time)

        if timezone.is_aware(current_time):
            session_start_dt = timezone.make_aware(session_start_dt)

        earliest_allowed = session_start_dt - timedelta(minutes=30)
        latest_allowed = session_start_dt + timedelta(minutes=30)

        return earliest_allowed <= current_time <= latest_allowed
    

    @staticmethod
    def verify_head_pose(uploaded_file, target_pose):
        # 1. Decode Image
        file_bytes = np.frombuffer(uploaded_file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        uploaded_file.seek(0)

        if image is None:
            raise ValidationError("Could not decode image file.")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # 2. Load OpenCV Cascades (Ensure these XML files are in your project or environment)
        # In Django, you might need to provide the full path to these .xml files
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        nose_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_mcs_nose.xml')

        # 3. Detect Face
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        if len(faces) == 0:
            raise ValidationError(f"No face detected in the {target_pose} image. Please ensure good lighting.")

        # Use the largest face
        (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3])[-1]
        roi_gray = gray[y:y+h, x:x+w]

        # 4. Detect Eyes and Nose within the face
        eyes = eye_cascade.detectMultiScale(roi_gray, 1.1, 10)
        noses = nose_cascade.detectMultiScale(roi_gray, 1.1, 10)

        # We need at least 2 eyes and 1 nose to calculate symmetry
        if len(eyes) < 2 or len(noses) < 1:
            # If we can't find features, we can't verify the angle accurately
            # In 'center' pose, we should definitely find them.
            if target_pose == "center":
                raise ValidationError("Face detected, but eyes/nose not clear. Please look straight at the camera.")
            return True # Fallback: Allow it if it's a side profile where eyes are hard to see

        # 5. Calculate Symmetry Ratio
        # Sort eyes: left to right
        eyes = sorted(eyes, key=lambda e: e[0])
        left_eye_x = eyes[0][0] + (eyes[0][2] // 2)
        right_eye_x = eyes[-1][0] + (eyes[-1][2] // 2)
        nose_x = noses[0][0] + (noses[0][2] // 2)

        # total_width is distance between eyes
        total_width = right_eye_x - left_eye_x
        if total_width <= 0: return True

        # nose_pos is where the nose sits between eyes (0.5 is center)
        nose_ratio = (nose_x - left_eye_x) / total_width

        # 6. Verify Target Pose
        # Note: If image is mirrored by frontend, LEFT/RIGHT logic might flip
        if target_pose == "center":
            if nose_ratio < 0.35 or nose_ratio > 0.65:
                raise ValidationError("Please look straight at the camera for the center pose.")
        
        elif target_pose == "left":
            # Nose moves towards the right eye (higher ratio) when turning left
            if nose_ratio < 0.60:
                raise ValidationError("You are not turning LEFT enough. Please turn your head more.")
                
        elif target_pose == "right":
            # Nose moves towards the left eye (lower ratio) when turning right
            if nose_ratio > 0.40:
                raise ValidationError("You are not turning RIGHT enough. Please turn your head more.")

        return True
