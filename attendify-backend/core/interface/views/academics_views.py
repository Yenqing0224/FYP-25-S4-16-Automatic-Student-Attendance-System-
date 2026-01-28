from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from core.models import Student, ClassSession, Lecturer
from core.services.academics_services import AcademicService
# Serializers
from core.interface.serializers.academics_serializers import ClassSessionSerializer, AttendanceRecordSerializer, TimeTableSerializer, FaceRecognitionSerializer
from core.interface.serializers.communication_serializers import AnnouncementSerializer
from core.interface.serializers.users_serializers import MultiFaceEmbeddingSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard(request):
    service = AcademicService()
    user = request.user

    try:
        if user.role_type == 'student':
            data = service.get_student_dashboard(user)

            return Response({
                "attendance_rate": data['attendance_rate'],
                "semester_range": data['semester_range'],
                "announcements" : AnnouncementSerializer(data['announcements'], many=True).data,
                "today_classes": ClassSessionSerializer(data['todays_sessions'], many=True).data,
                "upcoming_classes": ClassSessionSerializer(data['upcoming_sessions'], many=True).data
            })

        elif user.role_type == 'lecturer':
            data = service.get_lecturer_dashboard(user)

            next_class_data = None
            if data['next_class']:
                next_class_data = ClassSessionSerializer(data['next_class']).data

            return Response({
                "stats": data['stats'],
                "today_sessions": ClassSessionSerializer(data['today_sessions'], many=True).data,
                "week_sessions": ClassSessionSerializer(data['week_sessions'], many=True).data,
                "next_class": next_class_data,
                "announcements": AnnouncementSerializer(data['announcements'], many=True).data
            })
        else:
            return Response({"error": "Role not supported"}, status=403)

    except (Student.DoesNotExist, Lecturer.DoesNotExist):
        return Response({"error": "Profile not found for this user"}, status=404)

    except Exception as e:
        print(f"Dashboard Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timetable(request):
    service = AcademicService()

    try:
        sessions = service.get_timetable(request.user)

        return Response(TimeTableSerializer(sessions, many=True).data)

    except (Student.DoesNotExist, Lecturer.DoesNotExist):
        return Response({"error": "Profile not found"}, status=404)
    
    except ValueError as e:
        return Response({"error": str(e)}, status=403)
                        
    except Exception as e:
        print(f"Timetable Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_class_details(request, session_id):
    service = AcademicService()

    try:
        session, attendance = service.get_class_details(request.user, session_id)

        session_data = ClassSessionSerializer(session).data

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
    service = AcademicService()

    try:
        records = service.get_attendance_history(request.user)

        return Response(AttendanceRecordSerializer(records, many=True).data)

    except Student.DoesNotExist:
        return Response({"error": "This user is not a Student"}, status=403)
    except Exception as e:
        print(f"Attendance History Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_reschedule_options(request):
    service = AcademicService()

    try:
        result = service.get_reschedule_options(request.user, request.data)

        return Response(result, status=200)

    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reschedule_class(request):
    service = AcademicService()

    try:
        result = service.reschedule_class(request.user, request.data)

        return Response(result, status=200)

    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def mark_attendance(request):
    service = AcademicService()

    try:
        serializer = FaceRecognitionSerializer(data=request.data)
        if not serializer.is_valid():
            print("❌ Serializer Validation Errors:", serializer.errors)
            return Response(serializer.errors, status=400)

        student_id = serializer.validated_data['student_id']
        venue = serializer.validated_data['venue']
        entry_time_stamp = serializer.validated_data['entry_time_stamp']
        exit_time_stamp = serializer.validated_data['exit_time_stamp']


        result = service.mark_attendance(student_id, venue, entry_time_stamp, exit_time_stamp)
        
        return Response(result, status=200)

    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return Response({"error": str(e)}, status=400)
