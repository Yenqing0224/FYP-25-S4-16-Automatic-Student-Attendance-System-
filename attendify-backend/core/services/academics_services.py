from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer, User
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q

class AcademicService:

    def get_student_dashboard(self, user):
        profile = Student.objects.get(user=user)
        today = timezone.now()
        today_date = today.date()

        current_semester = Semester.objects.filter(
            start_date__lte=today, 
            end_date__gte=today
        ).first()
        
        semester_range = "No Active Semester"
        if current_semester:
            s_start = current_semester.start_date.strftime("%b %Y")
            s_end = current_semester.end_date.strftime("%b %Y")
            semester_range = f"{s_start} - {s_end}"

        todays_sessions = ClassSession.objects.filter(
            module__students=profile,
            date=today_date
        ).order_by('start_time')
        
        upcoming_sessions = ClassSession.objects.filter(
            module__students=profile,
            date__gt=today_date
        ).order_by('date', 'start_time')[:5]

        return {
            "attendance_rate": profile.attendance_rate,
            "semester_range": semester_range,
            "todays_sessions": todays_sessions,    
            "upcoming_sessions": upcoming_sessions  
        }
    

    def get_lecturer_dashboard(self, user):
        profile = Lecturer.objects.get(user=user)
        today = timezone.now()
        today_date = today.date()

        # 1. Stats
        today_count = ClassSession.objects.filter(
            module__lecturer=profile, 
            date=today_date
        ).count()

        start_week = today_date - timedelta(days=today_date.weekday())
        end_week = start_week + timedelta(days=6)
        
        week_count = ClassSession.objects.filter(
            module__lecturer=profile,
            date__range=[start_week, end_week]
        ).count()

        next_class = ClassSession.objects.filter(
            module__lecturer=profile
        ).filter(
            Q(date__gt=today_date) | Q(date=today_date, start_time__gte=today.time())
        ).order_by('date', 'start_time').first()

        return {
            "stats": {
                "today": today_count,
                "week": week_count
            },
            "next_class": next_class
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


