from django.utils import timezone
from datetime import timedelta

class AcademicLogic:

    @staticmethod
    def get_upcoming_class_window():
        now = timezone.now()
        start_range = now + timedelta(minutes=25)
        end_range = now + timedelta(minutes=35)
        return now.date(), start_range.time(), end_range.time()

    @staticmethod
    def determine_status(has_leave):
        if has_leave:
            return 'medical'
        return 'absent'
