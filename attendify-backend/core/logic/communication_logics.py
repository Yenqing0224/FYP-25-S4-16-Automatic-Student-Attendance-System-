from datetime import timedelta

class CommunicationLogic:
    
    @staticmethod
    def is_within_reminder_window(current_dt, session_start_dt):

        window_start = session_start_dt - timedelta(minutes=10)
        window_end = session_start_dt + timedelta(minutes=30)

        return window_start <= current_dt <= window_end