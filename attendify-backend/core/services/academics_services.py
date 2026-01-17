from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer, LeaveRequest, Announcement
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q
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
    