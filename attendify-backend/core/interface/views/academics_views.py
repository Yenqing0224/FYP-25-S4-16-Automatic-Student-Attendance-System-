from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from core.models import Student, ClassSession, Semester, AttendanceRecord
# Serializers
from core.interface.serializers.academics_serializers import ClassSessionSerializer, AttendanceRecordSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    try:
        student = Student.objects.get(user=request.user)

        today = timezone.now()
        current_semester = Semester.objects.filter(start_date__lte=today, end_date__gte=today).first()
        
        semester_range = "No Active Semester"
        if current_semester:
            s_start = current_semester.start_date.strftime("%b %Y")
            s_end = current_semester.end_date.strftime("%b %Y")
            semester_range = f"{s_start} - {s_end}"

        today_start = today.replace(hour=0, minute=0, second=0)
        today_end = today.replace(hour=23, minute=59, second=59)

        todays_sessions = ClassSession.objects.filter(
            module__students=student,
            date_time__range=(today_start, today_end)
        ).order_by('date_time')

        upcoming_sessions = ClassSession.objects.filter(
            module__students=student,
            date_time__gt=today_end
        ).order_by('date_time')[:5]

        return Response({
            "attendance_rate": student.attendance_rate,
            "semester_range": semester_range,
            "today_classes": ClassSessionSerializer(todays_sessions, many=True).data,
            "upcoming_classes": ClassSessionSerializer(upcoming_sessions, many=True).data
        })

    except Student.DoesNotExist:
        return Response({"error": "This user is not a Student"}, status=403)
    except Exception as e:
        print(f"Dashboard Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timetable(request):
    try:
        student = Student.objects.get(user=request.user)

        sessions = ClassSession.objects.filter(
            module__students=student
        ).order_by('date_time')

        return Response(ClassSessionSerializer(sessions, many=True).data)

    except Student.DoesNotExist:
        return Response({"error": "This user is not a Student"}, status=403)
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