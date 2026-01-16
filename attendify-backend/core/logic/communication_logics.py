from datetime import timedelta

class CommunicationLogic:
    
    @staticmethod
    def is_within_reminder_window(current_dt, session_start_dt):

        window_start = session_start_dt - timedelta(minutes=10)
        window_end = session_start_dt + timedelta(minutes=29)

        return window_start <= current_dt <= window_end
    

    @staticmethod
    def determine_event_status(local_now, event_datetime, current_status):

        if current_status == 'cancelled':
            return 'cancelled'

        current_date = local_now.date()
        event_date = event_datetime.date()

        if event_date < current_date:
            return 'completed'
        elif event_date == current_date:
            return 'happening_today'
        else:
            return 'upcoming'
