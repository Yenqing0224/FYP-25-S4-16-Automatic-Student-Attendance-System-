from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer, LeaveRequest, Announcement, Notification, ClassRoom
from django.utils import timezone
from datetime import timedelta, datetime, time
from django.db.models import Q, Prefetch
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
            created_at__date__gte = today_date -timedelta(days=7),
            created_at__date__lte = today_date
        ).order_by('-created_at')

        todays_sessions = ClassSession.objects.filter(
            module__students=student,
            date=today_date
        ).order_by('start_time')
        
        end_of_week = today_date + timedelta(days= 6 - today_date.weekday())

        upcoming_sessions = ClassSession.objects.filter(
            module__students=student,
            date__range=[today_date, end_of_week],
            ).filter(
            Q(date__gt=today_date) | 
            Q(date=today_date, start_time__gte=current_time)
        ).order_by('date', 'start_time')

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
            created_at__date__gte = today_date -timedelta(days=7),
            created_at__date__lte = today_date
        ).order_by('-created_at')

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
            attendance_prefetch = Prefetch(
                'attendance_records', 
                queryset=AttendanceRecord.objects.filter(student=profile),
                to_attr='my_attendance'
            )

            return ClassSession.objects.filter(**filter_kwargs)\
                .select_related('module', 'venue')\
                .prefetch_related(attendance_prefetch)\
                .order_by('date', 'start_time')
        
        elif user.role_type == 'lecturer':
            profile = Lecturer.objects.get(user=user)
            filter_kwargs = {'module__lecturer': profile}

            return ClassSession.objects.filter(**filter_kwargs)\
            .select_related('module', 'venue')\
            .order_by('date', 'start_time')
        
        else:
            raise ValueError("Timetable not available for this role")
        
    
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
    

    def get_reschedule_options(self, user, data):
        session_id = data.get('session_id')

        try:
            session = ClassSession.objects.get(id=session_id)
        except ClassSession.DoesNotExist:
            raise ValidationError("Class session not found.")
        
        if session.status != 'upcoming':
            raise ValidationError(f"Only 'Upcoming' classes can be rescheduled.")

        if "(Rescheduled)" in session.name:
            raise ValidationError("This class is already a replacement class and cannot be rescheduled again.")
        
        try:
            lecturer = Lecturer.objects.get(user=user)
            if session.module.lecturer != lecturer:
                raise PermissionDenied("You are not the lecturer for this module.")
        except Lecturer.DoesNotExist:
             raise PermissionDenied("User is not a lecturer.")

        session_start_dt = timezone.make_aware(datetime.combine(session.date, session.start_time))
        if timezone.now() > (session_start_dt - timedelta(hours=1)):
             raise ValidationError("Too late! You can only reschedule up to 1 hour before the class starts.")

        duration = datetime.combine(session.date, session.end_time) - datetime.combine(session.date, session.start_time)
        start_date = timezone.now().date() + timedelta(days=1)
        days_to_check = 14 
        possible_slots = []

        students = session.module.students.all()
        total_student_count = students.count()
        if total_student_count == 0:
            total_student_count = 1 

        for i in range(days_to_check):
            current_date = start_date + timedelta(days=i)
            
            if current_date.weekday() > 4: 
                continue
            
            current_slot_datetime = datetime.combine(current_date, time(8, 30))
            latest_start_limit = datetime.combine(current_date, time(19, 0))

            while current_slot_datetime <= latest_start_limit:
                
                slot_start = current_slot_datetime.time()
                slot_end_dt = current_slot_datetime + duration
                slot_end = slot_end_dt.time()
                
                if slot_end_dt.date() != current_date:
                    current_slot_datetime += timedelta(minutes=30)
                    continue

                lecturer_busy = ClassSession.objects.filter(
                    module__lecturer=lecturer, 
                    date=current_date,
                    status='upcoming',
                    start_time__lt=slot_end, 
                    end_time__gt=slot_start
                ).exists()

                if not lecturer_busy:
                    conflict_count = ClassSession.objects.filter(
                        module__students__in=students, 
                        date=current_date,
                        status='upcoming',
                        start_time__lt=slot_end,
                        end_time__gt=slot_start
                    ).values('module__students').distinct().count()

                    attendance_rate = (total_student_count - conflict_count) / total_student_count

                    if attendance_rate >= 0.9:
                        possible_slots.append({
                            'date': current_date,
                            'start_time': slot_start,
                            'end_time': slot_end,
                            'conflicts': conflict_count,
                            'attendance_percentage': round(attendance_rate * 100, 1)
                        })

                current_slot_datetime += timedelta(minutes=30)

        sorted_slots = sorted(possible_slots, key=lambda x: (-x['attendance_percentage'], x['date']))

        return {
            "status": "success",
            "options": sorted_slots
        }
    

    def reschedule_class(self, lecturer, data):
        session_id = data.get('session_id')
        new_date_str = data.get('date')
        new_start_str = data.get('start_time')
        new_end_str = data.get('end_time')

        try:
            session = ClassSession.objects.get(id=session_id)
        except ClassSession.DoesNotExist:
            raise ValidationError("Class session not found.")

        if session.status != 'upcoming':
            raise ValidationError(f"Only 'Upcoming' classes can be rescheduled.")
        
        if "(Rescheduled)" in session.name:
            raise ValidationError("This class is already a replacement class and cannot be rescheduled again.")

        try:
            lecturer = Lecturer.objects.get(user=lecturer)
            if session.module.lecturer != lecturer:
                raise PermissionDenied("You are not the lecturer for this module.")
        except Lecturer.DoesNotExist:
             raise PermissionDenied("User is not a lecturer.")
                    
        try:
            new_date = datetime.strptime(new_date_str, "%Y-%m-%d").date()
            new_start = datetime.strptime(new_start_str, "%H:%M:%S").time()
            new_end = datetime.strptime(new_end_str, "%H:%M:%S").time()
        except (ValueError, TypeError):
             raise ValidationError("Invalid date/time format. Use YYYY-MM-DD and HH:MM:SS.")
        
        available_venue = ClassRoom.objects.exclude(
            sessions_venue__date=new_date,
            sessions_venue__status=['upcoming', 'in_progress', 'completed'],
            sessions_venue__start_time__lt=new_end,
            sessions_venue__end_time__gt=new_start
        ).first()

        if not available_venue:
            raise ValidationError("No classrooms are available at this selected time. Please choose a different slot.")

        session.status = 'rescheduled'
        session.save()

        new_session = ClassSession.objects.create(
            module=session.module,
            type=session.type,
            name=f"{session.name} (Rescheduled)",
            date=new_date,
            start_time=new_start,
            end_time=new_end,
            venue=available_venue,
            status='upcoming'
        ),
            'duration': 0

        students = session.module.students.all()
        notifications = []
        for student in students:
            notifications.append(Notification(
                recipient=student.user,
                title="Class Rescheduled",
                description=f"Your class {session.name} has been moved to {new_session.date} at {new_session.start_time} in {available_venue.name}."
            ))
        Notification.objects.bulk_create(notifications)

        return {
            "status": "success",
            "message": "Class rescheduled successfully.",
            "new_session": {
                "id": new_session.id,
                "date": new_session.date,
                "time": new_session.start_time,
                "venue": available_venue.name
            }
        }


    def mark_attendance(self, student_id, venue, entry_time_stamp, exit_time_stamp):
        try:
            student = Student.objects.get(student_id=student_id)
        except Student.DoesNotExist:
            raise Exception(f"Student with ID {student_id} not found.")
            
        active_session = ClassSession.objects.filter(
            module__students=student,          
            date=entry_time_stamp.date(),             
            start_time__lte=(entry_time_stamp + timedelta(minutes=30)).time(),
            end_time__gte=entry_time_stamp.time(),
            venue__name=venue
        ).first()

        if not active_session:
            return {
                "status": "ignored",
                "message": f"Student {student.user.username} is not enrolled in any active session at this time."
            }
        
        attendance, created = AttendanceRecord.objects.get_or_create(
            session=active_session,
            student=student,
            defaults={'status': 'absent','duration': 0})

        if attendance.entry_time is None:
            naive_start_dt = datetime.combine(active_session.date, active_session.start_time)
            official_start_dt = timezone.make_aware(naive_start_dt)
            if entry_time_stamp < official_start_dt:
                attendance.entry_time = official_start_dt
            else:
                attendance.entry_time = entry_time_stamp
            if AcademicLogic.is_valid_attendance_window(entry_time_stamp, active_session):
                attendance.status = 'present'

                Notification.objects.create(
                    recipient=student.user,
                    title="Attendance Marked",
                    description=f"You have successfully marked attendance for {active_session.name}."
                )
            else:
                Notification.objects.create(
                    recipient=student.user,
                    title="Attendance Alert",
                    description=f"Your attendance for {active_session.name} was recorded but marked as ABSENT/LATE due to timing."
                )
            attendance.save()
        else:
            attendance.exit_time = exit_time_stamp
            time_diff = exit_time_stamp - entry_time_stamp
            attendance.duration += int(time_diff.total_seconds())
            attendance.save()

        return {
            "status": "success",    
            "student": student.user.username,
            "session": active_session.name,
            "entry": timezone.localtime(attendance.entry_time).isoformat() if attendance.entry_time else None,
            "exit": timezone.localtime(attendance.exit_time).isoformat() if attendance.exit_time else None
        }
    