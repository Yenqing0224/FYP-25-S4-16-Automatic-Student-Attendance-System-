from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer
# Serializers
from core.interface.serializers.academics_serializers import ClassSessionSerializer, AttendanceRecordSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    try:
        user = request.user
        today = timezone.now()
        today_date = today.date()

        if user.role_type == 'student':
            profile = Student.objects.get(user=user)
            
            current_semester = Semester.objects.filter(start_date__lte=today, end_date__gte=today).first()
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

            return Response({
                "attendance_rate": profile.attendance_rate,
                "semester_range": semester_range,
                "today_classes": ClassSessionSerializer(todays_sessions, many=True).data,
                "upcoming_classes": ClassSessionSerializer(upcoming_sessions, many=True).data
            })

        elif user.role_type == 'lecturer':
            profile = Lecturer.objects.get(user=user)
            
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

            return Response({
                "stats": {
                    "today": today_count,
                    "week": week_count
                },
                "next_class": ClassSessionSerializer(next_class).data if next_class else None,
            })

        else:
            return Response({"error": "Role not supported"}, status=403)

    except Exception as e:
        print(f"Dashboard Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timetable(request):
    try:
        user = request.user

        if user.role_type == 'student':
            profile = Student.objects.get(user=user)
            filter_kwargs = {'module__students': profile}
        elif user.role_type == 'lecturer':
            profile = Lecturer.objects.get(user=user)
            filter_kwargs = {'module__lecturer': profile}
        else:
            return Response({"error": "Timetable not available for this role"}, status=403)

        sessions = ClassSession.objects.filter(**filter_kwargs).order_by('date', 'start_time')

        return Response(ClassSessionSerializer(sessions, many=True).data)

    except (Student.DoesNotExist, Lecturer.DoesNotExist):
        return Response({"error": "Profile not found"}, status=404)
    except Exception as e:
        print(f"Timetable Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_class_details(request, session_id):
    try:
        student = Student.objects.get(user=request.user)

        session = ClassSession.objects.get(id=session_id)
        session_data = ClassSessionSerializer(session).data
        
        attendance = AttendanceRecord.objects.filter(
            session=session, 
            student=student
        ).first()

        session_data['entry_time'] = attendance.entry_time if attendance else None
        session_data['exit_time'] = attendance.exit_time if attendance else None
        session_data['attendance_status'] = attendance.status if attendance else "absent"

        return Response(session_data)

    except Student.DoesNotExist:
        return Response({"error": "User is not a student"}, status=403)
    except ClassSession.DoesNotExist:
        return Response({"error": "Class session not found"}, status=404)
    except Exception as e:
        print(f"Class Details Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_attendance_history(request):
    try:
        student = Student.objects.get(user=request.user)

        records = AttendanceRecord.objects.filter(
            student=student
        ).select_related(
            'session', 
            'session__module',
            'session__module__semester' 
        ).order_by('-session__date_time')

        serializer = AttendanceRecordSerializer(records, many=True)

        return Response(serializer.data)

    except Student.DoesNotExist:
        return Response({"error": "This user is not a Student"}, status=403)
    except Exception as e:
        print(f"Attendance History Error: {e}")
        return Response({"error": str(e)}, status=500)