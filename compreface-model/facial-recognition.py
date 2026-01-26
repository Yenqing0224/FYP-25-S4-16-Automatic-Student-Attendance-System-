import cv2
import argparse
import time
from threading import Thread 
from collections import deque
import requests
from datetime import datetime, timezone
import sys
from pathlib import Path 
from liveness_detection.tsn_predict import TSNPredictor

BASE_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(BASE_DIR))
from compreface import CompreFace
from compreface.service import RecognitionService

# Global vars
recog_interval = 0          # does reognition every x seconds
absence_threshold = 5       # y seconds of not seen, will update leave time, RMB TO CHANGE 
liveness_history_len = 5    # stores how many history??
spoof_threshold = 0.2       # can only be detected as spoof x% of the time
blink_threshold = 0.20

def parseArguments():
    parser = argparse.ArgumentParser()

    # API currently uses a 1062dlanmarks
    parser.add_argument("--api-key", help="CompreFace recognition service API key", type=str, default='17769fd0-cc56-4b6f-83fc-08e2fe636758')   # mobilenet-gpu
    parser.add_argument("--host", help="CompreFace host", type=str, default='http://13.251.225.129')
    #http://localhost
    parser.add_argument("--port", help="CompreFace port", type=str, default='8000')

    args = parser.parse_args()

    return args

class ThreadedCamera:
    def __init__(self, api_key, host, port):
        self.active = True
        self.results = []
        self.last_recog_time = datetime.now(timezone.utc)  # stores in datetime format
        self.attendance_state = {}              # For writing to DB
        self.capture = cv2.VideoCapture(0)
        self.capture.set(cv2.CAP_PROP_BUFFERSIZE, 2)
        self.liveness_predictor = TSNPredictor()

        compre_face: CompreFace = CompreFace(host, port, {
            "limit": 0,
            "det_prob_threshold": 0.8,
            "prediction_count": 1,
            "face_plugins": "age,gender", #landmarks2d106
            "status": False
        })

        self.recognition: RecognitionService = compre_face.init_face_recognition(api_key)
        self.FPS = 1/30

        # Start frame retrieval thread
        self.thread = Thread(target=self.show_frame, args=())
        self.thread.daemon = True
        self.thread.start()


    def send_request(self, student_id, timestamp, duration):
        try:
            duration_secs = int(duration) if duration else 0   # rounds down to int
            requests.post(
                "https://attendify-ekg6.onrender.com/api/mark-attendance/",
                json={
                    "student_id": student_id,
                    "time_stamp": timestamp.isoformat() if timestamp else None,
                    "duration": duration_secs
                },
                timeout=2
            )
        except requests.RequestException as e:
            print(f"Attendance API error: {student_id}: {e}")


    def show_frame(self):
        while self.capture.isOpened():
            (status, frame_raw) = self.capture.read()
            if not status:
                continue
            
            self.frame = cv2.flip(frame_raw, 1)

            if self.results:
                results = self.results
                for result in results:
                    box = result.get('box')
                    age = result.get('age')
                    gender = result.get('gender')
                    mask = result.get('mask')
                    subjects = result.get('subjects')
                    landmarks = result.get('landmarks')
                    if box:
                        cv2.rectangle(img=self.frame, pt1=(box['x_min'], box['y_min']),
                                      pt2=(box['x_max'], box['y_max']), color=(0, 255, 0), thickness=1)
                        if age:
                            age = f"Age: {age['low']} - {age['high']}"
                            cv2.putText(self.frame, age, (box['x_max'], box['y_min'] + 15),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
                        if gender:
                            gender = f"Gender: {gender['value']}"
                            cv2.putText(self.frame, gender, (box['x_max'], box['y_min'] + 35),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
                        if mask:
                            mask = f"Mask: {mask['value']}"
                            cv2.putText(self.frame, mask, (box['x_max'], box['y_min'] + 55),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
                        
                        # Draw points & index of points for visual
                        if landmarks:
                            for i, (x, y) in enumerate(landmarks):
                                cv2.circle(
                                    self.frame,
                                    (int(x), int(y)),
                                    radius=2,
                                    color=(0, 0, 255),
                                    thickness=-1
                                )
                                # for index visual 
                                cv2.putText(
                                    self.frame,
                                    str(i),
                                    (int(x) + 2, int(y) + 2),
                                    cv2.FONT_HERSHEY_SIMPLEX,
                                    0.35,
                                    (0,255,0),
                                    1
                                ) 
                        
                        if subjects:
                            # subjects already takes the highest similarity
                            #subjects = sorted(subjects, key=lambda k: k['similarity'], reverse=True)
                            # to put a threshold on matching faces
                            #if subjects[0]['similarity'] >= 0:
                                subject = f"Subject: {subjects[0]['subject']}"
                                similarity = f"Similarity: {subjects[0]['similarity']}"
                                cv2.putText(self.frame, subject, (box['x_max'], box['y_min'] + 75),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
                                cv2.putText(self.frame, similarity, (box['x_max'], box['y_min'] + 95),
                                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)
                                        
                        else:
                            subject = f"No known faces"
                            cv2.putText(self.frame, subject, (box['x_max'], box['y_min'] + 75),
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 1)

            cv2.imshow('CompreFace demo', self.frame)
            time.sleep(self.FPS)

            if cv2.waitKey(1) & 0xFF == 27:
                self.capture.release()
                cv2.destroyAllWindows()
                self.active=False


    def is_active(self):
        return self.active

    def update(self):
        if not hasattr(self, 'frame'):
            return

        now = datetime.now(timezone.utc)

        # throttle recognition 
        if (now - self.last_recog_time).total_seconds() < recog_interval:
            return 

        # Updates the time the last recognition is done, to apply the throttling  
        self.last_recog_time = now

        _, im_buf_arr = cv2.imencode(".jpg", self.frame)
        byte_im = im_buf_arr.tobytes()
        data = self.recognition.recognize(byte_im)
        self.results = data.get('result')

        self.process_attendance(self.results, now)
        self.check_leavers(now)


    # results contains all recognized faces in the frame
    def process_attendance(self, results, now):
        if not results:
            return  # nothing to process

        for result in results:
            subjects = result.get("subjects")
            box = result.get("box")

            if not subjects:
                continue
            
            # sort with the highest similarity first. As we only take the match with the highest confidence
            #subjects = sorted(subjects, key = lambda k: k['similarity'], reverse = True)
            
            # Skips everything if similarity less than threshold
            if subjects[0]['similarity'] < 0.8:
                continue

            student_id = subjects[0]['subject'] # subject will be using student id
            
            # Detects recognition for the first time
            if student_id not in self.attendance_state:   
                self.attendance_state[student_id] = {
                    "entry" : None,    # Needs to check for liveness
                    "exit" : None,     # used to check the last time student is in class
                    "present" : False,      # False until liveness checked
                    "liveness_history": deque(maxlen = liveness_history_len),   # 0 == live, 1 == spoof
                    "has_left" : False,     # used as a flag
                    "last_seen" : None,  # mainly used for student return to class
                    "duration" : 0,
                    "curr_entry" : None     # Datetime for tracking duration stayed in class
                }

            # Check for liveness before confirming attendance
            student_state = self.attendance_state[student_id] # curr student based on result
            
            # crops the face that was detected
            x_min, y_min, x_max, y_max = box['x_min'], box['y_min'] , box['x_max'], box['y_max']
            face_crop = [self.frame[y_min:y_max, x_min:x_max]]
            liveness = self.liveness_predictor.predict(face_crop)
            if liveness[0][0] > liveness[0][1]:
                print("Live", student_id)   # for debug
                isLive = 0
            else:
                print("Spoof", student_id)  # for debug
                isLive = 1
            
            live_hist = student_state["liveness_history"]
            live_hist.append(isLive)
            
            # If is live, add to DB
            if (len(live_hist) == liveness_history_len and \
                (sum(live_hist) / len(live_hist)) <= spoof_threshold):

                # entry time only needs to be updated the first time
                if not student_state["entry"]:
                    student_state["entry"] = now
                    student_state["curr_entry"] = now
                    student_state["present"] = True
                    self.send_request(student_id, student_state["entry"], 0)    # Updates entry time in DB, duration is 0 as student just entered

                # Student re-entry, exit would have data
                if student_state["has_left"]:
                    student_state["curr_entry"] = now
                    student_state["has_left"] = False
                    self.send_request(student_id, None, student_state["duration"])  # duration is not computed
                    # sets exit time back to '-'
                
                # exit updated on both (student entry, student re-entry). But not updated in DB
                student_state["exit"] = now

    
    # leavers: present = True, and left halfway
    # do not need to check for absent, there is no record anyway
    def check_leavers(self, now):
        # to be included in self.attendance means they are already present and recorded entry time
        for student_id, state in self.attendance_state.items():
            exit_time = state.get("exit")
            present = state.get("present")
            has_left = state.get("has_left")

            if exit_time and present and not has_left:
                delta_seconds = (now - exit_time).total_seconds()
                if delta_seconds > absence_threshold:
                    # Sets exit time and calculate duration
                    curr_entry = state.get("curr_entry")
                    duration = state.get("duration")
                    if curr_entry is not None:
                        duration += (exit_time - curr_entry).total_seconds()

                    state["duration"] = duration
                    state["curr_entry"] = None      # resets curr_entry
                    self.send_request(student_id, exit_time, duration)
                    state["liveness_history"].clear()
                    state["has_left"] = True    # set flag to True

#=====================================================================
if __name__ == '__main__':
    args = parseArguments()
    threaded_camera = ThreadedCamera(args.api_key, args.host, args.port)
    while threaded_camera.is_active():
        threaded_camera.update()
        time.sleep(0.2)     # limits main loop