from django.utils import timezone
from datetime import timedelta

class AcademicLogic:

    @staticmethod
    def get_upcoming_class_window():
        utc_now = timezone.now()
        local_now = timezone.localtime(utc_now)
        start_range = local_now + timedelta(minutes=25)
        end_range = local_now + timedelta(minutes=35)
        return local_now.date(), start_range.time(), end_range.time()

    @staticmethod
    def determine_status(has_leave):
        if has_leave:
            return 'medical'
        return 'absent'
