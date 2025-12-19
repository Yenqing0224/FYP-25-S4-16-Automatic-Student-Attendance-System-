from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from django.utils import timezone
from django.db.models import Q
from datetime import timedelta
from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer, User
from pgvector.django import L2Distance
# Serializers
from core.interface.serializers.academics_serializers import ClassSessionSerializer, AttendanceRecordSerializer
from core.interface.serializers.users_serializers import FaceEmbeddingSerializer


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


@api_view(['POST'])
@permission_classes([AllowAny]) 
def recognize_face(request):
    try:
        serializer = FaceEmbeddingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        query_embedding = serializer.validated_data['embedding']

        closest_user = User.objects.filter(role_type='student').annotate(
            distance=L2Distance('face_embedding_512', query_embedding)
        ).order_by('distance').first()

        THRESHOLD = 1.0 

        if closest_user and closest_user.distance < THRESHOLD:
            try:
                student_profile = closest_user.student_profile
                student_name = closest_user.username
                student_id = student_profile.student_id
            except Student.DoesNotExist:
                return Response({"error": "User found but has no student profile"}, status=404)

            return Response({
                "status": "success",
                "student_id": student_id,
                "student_name": student_name,
                "distance": closest_user.distance,
                "message": f"Identified {student_name}"
            }, status=status.HTTP_200_OK)

        else:
            return Response({
                "status": "unknown",
                "message": "Face not recognized",
                "distance": closest_user.distance if closest_user else None
            }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        print(f"Recognition Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def register_face(request):
    try:
        target_id = request.data.get('student_id')
        embedding = request.data.get('embedding')

        if not target_id or not embedding:
            return Response({"error": "Missing student_id or embedding"}, status=400)

        student = Student.objects.get(student_id=target_id)
        
        user = student.user 
        
        user.face_embedding_512 = embedding
        user.save()

        return Response({
            "status": "success", 
            "message": f"Face vector updated for User: {user.username} (Student: {student.student_id})"
        }, status=200)

    except Student.DoesNotExist:
        return Response({"error": f"Student ID {target_id} not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)