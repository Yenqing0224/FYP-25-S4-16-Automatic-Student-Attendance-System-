from django.utils import timezone
from datetime import datetime, timedelta

class AcademicLogic:

    @staticmethod
    def get_upcoming_class_window():
        local_now = timezone.localtime(timezone.now())
        start_range = local_now
        end_range = local_now + timedelta(minutes=30)
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
