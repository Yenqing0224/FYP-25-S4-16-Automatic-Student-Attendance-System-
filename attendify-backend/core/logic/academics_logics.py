from django.utils import timezone
from datetime import datetime, timedelta
import cv2
import os
from django.conf import settings
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

        # 2. Path Discovery (Bundled Files)
        # These paths look for the 'opencv_data' folder you created in Step 1
        face_path = os.path.join(settings.BASE_DIR, 'opencv_data', 'haarcascade_frontalface_default.xml')
        nose_path = os.path.join(settings.BASE_DIR, 'opencv_data', 'haarcascade_mcs_nose.xml')

        face_cascade = cv2.CascadeClassifier(face_path)
        nose_cascade = cv2.CascadeClassifier(nose_path)

        # Emergency check if files didn't deploy correctly
        if face_cascade.empty() or nose_cascade.empty():
            raise ValidationError("Server Error: Facial detection models missing.")

        # 3. Detect Face
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        if len(faces) == 0:
            raise ValidationError("No face detected. Please ensure good lighting.")

        # Pick largest face
        (x, y, w, h) = sorted(faces, key=lambda f: f[2]*f[3])[-1]
        roi_gray = gray[y:y+h, x:x+w]

        # 4. Detect Nose within the face ROI
        # We focus on the nose because it's the best anchor for "turning"
        noses = nose_cascade.detectMultiScale(roi_gray, 1.1, 10)

        if len(noses) == 0:
            # Fallback for side poses: if we see a face but no nose, 
            # it might be turned too far for this specific cascade
            if target_pose == "center":
                raise ValidationError("Please look straight at the camera.")
            return True 

        # 5. Calculate Nose Symmetry
        # Nose X-center relative to the Face Box width
        nose_x = noses[0][0] + (noses[0][2] // 2)
        face_width = w
        
        # nose_ratio: 0.5 is perfectly centered
        nose_ratio = nose_x / face_width

        # 6. Pose Validation Logic
        if target_pose == "center":
            if not (0.4 <= nose_ratio <= 0.6):
                raise ValidationError("Please look straight at the camera.")
        
        elif target_pose == "left":
            # In a non-mirrored image: turning left moves nose to the right side of the box
            if nose_ratio < 0.62:
                raise ValidationError("Turn your head further to the LEFT.")
                
        elif target_pose == "right":
            # Turning right moves nose to the left side of the box
            if nose_ratio > 0.38:
                raise ValidationError("Turn your head further to the RIGHT.")

        return True
