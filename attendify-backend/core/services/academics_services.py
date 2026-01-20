from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer, LeaveRequest, Announcement, Notification
from django.utils import timezone
from datetime import timedelta, datetime, time
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied, ValidationError
from core.logic.academics_logics import AcademicLogic


class AcademicService:

    def get_student_dashboard(self, user):
        student = Student.objects.get(user=user)
        today = timezone.localtime(timezone.now())
        today_date = today.date()
        current_time = today.time()

        current_semester = Semester.objects.filter(
            start_date__lte=today, 
            end_date__gte=today
        ).first()
        
        semester_range = "No Active Semester"
        if current_semester:
            s_start = current_semester.start_date.strftime("%b %Y")
            s_end = current_semester.end_date.strftime("%b %Y")
            semester_range = f"{s_start} - {s_end}"

        todays_announcements = Announcement.objects.filter(
            created_at__date=today_date
        )

        todays_sessions = ClassSession.objects.filter(
            module__students=student,
            date=today_date
        ).order_by('start_time')
        
        upcoming_sessions = ClassSession.objects.filter(
            module__students=student,
            date=today_date,
            start_time__gte=current_time
        ).order_by('start_time')[:5]

        return {
            "attendance_rate": student.attendance_rate,
            "semester_range": semester_range,
            "announcements": todays_announcements,
            "todays_sessions": todays_sessions,    
            "upcoming_sessions": upcoming_sessions
        }
    

    def get_lecturer_dashboard(self, user):
        lecturer = Lecturer.objects.get(user=user)
        today = timezone.localtime(timezone.now())
        today_date = today.date()

        # 1. Stats
        today_sessions = ClassSession.objects.filter(
            module__lecturer=lecturer, 
            date=today_date
        ).order_by('start_time')

        start_week = today_date - timedelta(days=today_date.weekday())
        end_week = start_week + timedelta(days=6)
        
        week_sessions = ClassSession.objects.filter(
            module__lecturer=lecturer,
            date__range=[start_week, end_week]
        ).order_by('date', 'start_time')

        next_class = ClassSession.objects.filter(
            module__lecturer=lecturer
        ).filter(
            Q(date__gt=today_date) | Q(date=today_date, start_time__gte=today.time())
        ).order_by('date', 'start_time').first()

        todays_announcements = Announcement.objects.filter(
            created_at__date=today_date
        )

        return {
            "stats": {
                "today": today_sessions.count(),
                "week": week_sessions.count()
            },
            "today_sessions": today_sessions,
            "week_sessions": week_sessions,
            "next_class": next_class,
            "announcements": todays_announcements
        }
    

    def get_timetable(self, user):
        if user.role_type == 'student':
            profile = Student.objects.get(user=user)
            filter_kwargs = {'module__students': profile}
        elif user.role_type == 'lecturer':
            profile = Lecturer.objects.get(user=user)
            filter_kwargs = {'module__lecturer': profile}
        else:
            raise ValueError("Timetable not available for this role")
        
        return ClassSession.objects.filter(**filter_kwargs).order_by('date', 'start_time')
    

    def get_class_details(self, user, session_id):
        student = Student.objects.get(user=user)

        session = ClassSession.objects.get(id=session_id)
        
        attendance = AttendanceRecord.objects.filter(
            session=session, 
            student=student
        ).first()

        return session, attendance
    

    def get_attendance_history(self, user):
        student = Student.objects.get(user=user)

        records = AttendanceRecord.objects.filter(
            student=student
        ).select_related(
            'session', 
            'session__module',
            'session__module__semester' 
        ).order_by('-session__date')

        return records


    def auto_create_attendance(self):
        target_date, start_range, end_range = AcademicLogic.get_upcoming_class_window()
        
        upcoming_sessions = ClassSession.objects.filter(
            date=target_date,
            start_time__range=(start_range, end_range)
        )

        created_count = 0

        for session in upcoming_sessions:
            if AttendanceRecord.objects.filter(session=session).exists():
                continue

            students = session.module.students.all()

            for student in students:

                has_leave = LeaveRequest.objects.filter(
                    user=student.user,
                    start_date__lte=target_date,
                    end_date__gte=target_date,
                    status='approved'
                ).exists()

                status = AcademicLogic.determine_leave_status(has_leave)

                _, created = AttendanceRecord.objects.get_or_create(
                    session=session,
                    student=student,
                    defaults={
                        'status': status, 
                    }
                )
                if created:
                    created_count += 1

        return f"Generated {created_count} attendance records."
    
    
    def auto_update_class_status(self):
        local_now = timezone.localtime(timezone.now())
        current_date = local_now.date()

        sessions = ClassSession.objects.filter(
            date__lte=current_date
        ).exclude(status__in=['completed', 'cancelled'])

        updated_count = 0
        
        for session in sessions:
            new_status = AcademicLogic.determine_class_status(
                local_now,
                session.date, 
                session.start_time, 
                session.end_time,
                session.status
            )

            if session.status != new_status:
                session.status = new_status
                session.save()
                updated_count += 1

        return f"Updated status for {updated_count} sessions."
    

    def reschedule_class(self, lecturer, data):
        session_id = data.get('session_id')

        try:
            session = ClassSession.objects.get(id=session_id)
        except ClassSession.DoesNotExist:
            raise ValueError("Class session not found.")
        
        try:
            lecturer = Lecturer.objects.get(user=lecturer)
            if session.module.lecturer != lecturer:
                raise PermissionDenied("You are not the lecturer for this module.")
        except Lecturer.DoesNotExist:
             raise PermissionDenied("User is not a lecturer.")
        
        session_start_dt = datetime.combine(session.date, session.start_time)
        session_start_dt = timezone.make_aware(session_start_dt)
        deadline = session_start_dt - timedelta(hours=1)
        
        if timezone.now() > deadline:
            raise ValidationError(f"You can only reschedule up to 1 hour before the class starts")
        
        session.status = 'cancelled'
        session.save()

        duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
    
        start_date = timezone.now().date() + timedelta(days=1)
        days_to_check = 7 
        possible_slots = []
        students = session.module.students.all()

        for i in range(days_to_check):
            current_date = start_date + timedelta(days=i)
            
            if current_date.weekday() > 4: 
                continue

            for hour in range(9, 17): 
                slot_start = time(hour, 0)
                slot_end = (datetime.combine(current_date, slot_start) + duration).time()
                
                lecturer_busy = ClassSession.objects.filter(
                    module__lecturer=lecturer, 
                    date=current_date,
                    status='upcoming',
                    start_time__lt=slot_end,
                    end_time__gt=slot_start
                ).exists()

                if lecturer_busy:
                    continue

                conflict_count = ClassSession.objects.filter(
                    module__students__in=students, 
                    date=current_date,
                    status='upcoming',
                    start_time__lt=slot_end,
                    end_time__gt=slot_start
                ).values('module__students').distinct().count()

                possible_slots.append({
                    'date': current_date,
                    'start_time': slot_start,
                    'end_time': slot_end,
                    'conflicts': conflict_count
                })

        if not possible_slots:
            raise ValidationError("No available slots found for the lecturer in the next 7 days.")
            
        best_slot = sorted(possible_slots, key=lambda x: x['conflicts'])[0]

        new_session = ClassSession.objects.create(
            module=session.module,
            type=session.type,
            name=f"{session.name} (Rescheduled)",
            date=best_slot['date'],
            start_time=best_slot['start_time'],
            end_time=best_slot['end_time'],
            venue=session.venue, 
            status='upcoming'
        )

        notifications = []
        for student in students:
            notifications.append(Notification(
                recipient=student.user,
                title="Class Rescheduled",
                description=f"Your class {session.name} has been moved to {new_session.date} at {new_session.start_time}."
            ))
        Notification.objects.bulk_create(notifications)

        return {
            "status": "success",
            "message": "Class rescheduled successfully.",
            "old_session": f"{session.date} (Cancelled)",
            "new_session": {
                "date": new_session.date,
                "time": new_session.start_time,
                "conflicts_found": best_slot['conflicts']
            }
        }

    def mark_attendance(self, student_id, time_stamp):
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            raise Exception(f"Student with ID {student_id} not found.")
            
        

        active_session = ClassSession.objects.filter(
            module__students=student,          
            date=time_stamp.date(),             
            start_time__lte=(time_stamp + timedelta(minutes=30)).time(),
            end_time__gte=time_stamp.time()     
        ).first()

        if not active_session:
            return {
                "status": "ignored",
                "message": f"Student {student.user.username} is not enrolled in any active session at this time."
            }
        
        attendance, created = AttendanceRecord.objects.get_or_create(
            session=active_session,
            student=student,
            defaults={'status': 'absent'}
        )

        message = ""

        if attendance.entry_time is None:
            attendance.entry_time = time_stamp
            attendance.exit_time = time_stamp
            if AcademicLogic.is_valid_attendance_window(time_stamp, active_session):
                attendance.status = 'present'
                message = f"Entry marked for {student.user.username}"

                Notification.objects.create(
                    recipient=student.user,
                    title="Attendance Marked",
                    description=f"You have successfully marked attendance for {active_session.name}."
                )
            else:
                message = f"Entry rejected. You must scan within +/- 30 mins of {active_session.start_time}"
                Notification.objects.create(
                    recipient=student.user,
                    title="Attendance Alert",
                    description=f"Your attendance for {active_session.name} was recorded but marked as ABSENT/LATE due to timing."
                )
            
            attendance.save()
        else:
            attendance.exit_time = time_stamp
            attendance.save()
            message = f"Exit time updated for {student.user.username}"

        return {
            "status": "success",
            "student": student.user.username,
            "session": active_session.name,
            "message": message,
            "entry": timezone.localtime(attendance.entry_time).isoformat() if attendance.entry_time else None,
            "exit": timezone.localtime(attendance.exit_time).isoformat() if attendance.exit_time else None
        }
    