from django.utils import timezone
from datetime import datetime, timedelta
import cv2
import numpy as np
import mediapipe as mp
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
        
        file_bytes = np.frombuffer(uploaded_file.read(), np.uint8)
        image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        uploaded_file.seek(0)

        if image is None:
            raise ValidationError("Could not decode image file. Ensure it is a valid JPG/PNG.")

        mp_face_mesh = mp.solutions.face_mesh
        with mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face_mesh:


            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_image)

            if not results.multi_face_landmarks:
                raise ValidationError(f"No face detected in the {target_pose} image. Please retake.")

            face_landmarks = results.multi_face_landmarks[0]
            img_h, img_w, _ = image.shape

            face_3d = []
            face_2d = []
            
            key_landmarks = [1, 152, 263, 33, 287, 57]

            for idx in key_landmarks:
                lm = face_landmarks.landmark[idx]
                x, y = int(lm.x * img_w), int(lm.y * img_h)
                face_2d.append([x, y])
                face_3d.append([x, y, lm.z * 3000]) 

            face_2d = np.array(face_2d, dtype=np.float64)
            face_3d = np.array(face_3d, dtype=np.float64)

            focal_length = 1 * img_w
            cam_matrix = np.array([[focal_length, 0, img_h / 2],
                                   [0, focal_length, img_w / 2],
                                   [0, 0, 1]])
            dist_matrix = np.zeros((4, 1), dtype=np.float64)

            success, rot_vec, trans_vec = cv2.solvePnP(face_3d, face_2d, cam_matrix, dist_matrix)
            rmat, jac = cv2.Rodrigues(rot_vec)
            angles, _, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

            yaw = angles[1] * 360

            THRESHOLD = 12.0
            
            if target_pose == "center":
                if abs(yaw) > THRESHOLD:
                    raise ValidationError(f"Image not centered (Yaw: {yaw:.1f}°). Please look straight at the camera.")
            
            elif target_pose == "left":
                if yaw < THRESHOLD: 
                    raise ValidationError(f"You are not turning LEFT enough (Yaw: {yaw:.1f}°). Please turn your head more.")

            elif target_pose == "right":
                if yaw > -THRESHOLD:
                    raise ValidationError(f"You are not turning RIGHT enough (Yaw: {yaw:.1f}°). Please turn your head more.")

            return True
