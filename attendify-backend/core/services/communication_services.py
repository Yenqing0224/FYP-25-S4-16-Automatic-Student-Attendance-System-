from core.models import Notification, News, Event, ClassSession, AttendanceRecord
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count
from rest_framework.exceptions import ValidationError
# Import Logic
from core.logic.communication_logics import CommunicationLogic

class CommunicationService:

    def get_newsevent(self):
        today = timezone.localtime(timezone.now()).date()
        start_date = today - timedelta(days=90)
        end_date = today + timedelta(days=90)
        
        news_object = News.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=today
        ).order_by('-created_at')

        events_object = Event.objects.filter(
            event_date__gte=start_date,
            event_date__lte=end_date
        ).exclude(
            status='cancelled'
        ).annotate(
            joined_count=Count('students')
        ).order_by('event_date')

        return news_object, events_object
    

    def get_notifications(self, user):
        return Notification.objects.filter(recipient=user)
    

    def mark_notifications_read(self, user):
        count = Notification.objects.filter(
            recipient=user, 
            is_read=False
        ).update(is_read=True)

        return count
    

    def mark_single_notifications_read(self, user, notification_id):
        notification = Notification.objects.filter(
            pk=notification_id,
            recipient=user
        ).update(is_read=True)


    def check_event_status(self, user, data):
        event_id = data.get('event_id')
        
        if not event_id:
            raise ValidationError("Event ID is required.")

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            raise ValidationError("Event not found.")
            
        is_joined = False
        if hasattr(user, 'student_profile'):
            student = user.student_profile
            is_joined = event.students.filter(pk=student.pk).exists()

        return {
            "id": event.id,
            "title": event.title,
            "is_joined": is_joined,
            "slots_remaining": event.slots_remaining,
            "is_full": event.is_full,
            "status": event.status
        }


    def join_event(self, user, data):
        event_id = data.get('event_id')
        
        if not event_id:
            raise ValidationError("Event ID is required.")

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            raise ValidationError("Event not found.")

        if not hasattr(user, 'student_profile'):
            raise ValidationError("Only students can join events.")
        
        student = user.student_profile

        if event.students.filter(pk=student.pk).exists():
            raise ValidationError("You have already joined this event.")

        if event.slots_remaining <= 0:
            raise ValidationError("Event is full.")

        event.students.add(student)
        
        return {
            "status": "success", 
            "message": "Successfully joined the event."
        }


    def quit_event(self, user, data):
        event_id = data.get('event_id')
        
        if not event_id:
            raise ValidationError("Event ID is required.")

        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            raise ValidationError("Event not found.")

        if not hasattr(user, 'student_profile'):
            raise ValidationError("Only students can perform this action.")
        
        student = user.student_profile

        if not event.students.filter(pk=student.pk).exists():
            raise ValidationError("You have not joined this event.")

        event.students.remove(student)
        
        return {
            "status": "success", 
            "message": "Successfully cancelled participation."
        }


    def auto_update_event_status(self):
        local_now = timezone.localtime(timezone.now())
        current_date = local_now.date()

        events = Event.objects.filter(
            event_date__date__lte=current_date
        ).exclude(status__in=['completed', 'cancelled'])

        updated_count = 0

        for event in events:
            new_status = CommunicationLogic.determine_event_status(
            local_now,
            event.event_date,
            event.status
        )

            if event.status != new_status:
                event.status = new_status
                event.save()
                updated_count += 1

        return f"Updated status for {updated_count} events."

    def auto_send_reminder(self):
        local_now = timezone.localtime(timezone.now())
        
        active_sessions = ClassSession.objects.filter(
            date=local_now.date(),
            status__in=['upcoming', 'in_progress']
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

