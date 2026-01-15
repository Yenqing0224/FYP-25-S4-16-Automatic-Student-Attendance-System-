from core.models import Notification, News, Event, ClassSession, AttendanceRecord
from django.utils import timezone
from datetime import datetime
# Import Logic
from core.logic.communication_logics import CommunicationLogic

class CommunicationService:

    def get_newsevent(self):
        news_object = News.objects.all()
        events_object = Event.objects.filter(status__in=['upcoming', 'in_progress'])

        return news_object, events_object
    

    def get_notifications(self, user):
        return Notification.objects.filter(recipient=user)
    

    def mark_notifications_read(self, user):
        count = Notification.objects.filter(
            recipient=user, 
            is_read=False
        ).update(is_read=True)

        return count
    

    def auto_send_reminder(self):
        utc_now = timezone.now()
        local_now = timezone.localtime(utc_now)
        
        active_sessions = ClassSession.objects.filter(
            date=local_now.date(),
            status='in_progress'
        )

        sent_count = 0

        for session in active_sessions:
            start_dt_unaware = datetime.combine(session.date, session.start_time)
            session_start_dt = timezone.make_aware(start_dt_unaware, timezone.get_current_timezone())

            if CommunicationLogic.is_within_reminder_window(local_now, session_start_dt):
                
                absent_students = AttendanceRecord.objects.filter(
                    session=session,
                    entry_time__isnull=True,
                    status='absent'
                )

                for record in absent_students:
                    student_user = record.student.user
                    
                    Notification.objects.create(
                        recipient=student_user,
                        title="Attendance Pending",
                        description=f"Please scan in for {session.module.name}. You are marked absent until scanned.",
                    )
                    sent_count += 1
                    print(f"Reminder sent to {student_user.username}")

        return f"Sent {sent_count} reminders."

