from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from core.models import Student, ClassSession, Semester, AttendanceRecord, Lecturer, User
from core.services.academics_services import AcademicService
from pgvector.django import CosineDistance
# Serializers
from core.interface.serializers.academics_serializers import ClassSessionSerializer, AttendanceRecordSerializer, FaceRecognitionSerializer
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

        return Response(ClassSessionSerializer(sessions, many=True).data)

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
@permission_classes([AllowAny])
def mark_attendance(request):
    serializer = FaceRecognitionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    student_id = serializer.validated_data['student_id']
    timestamp = serializer.validated_data['timestamp']

    try:
        result = AcademicService.mark_attendance(student_id, timestamp)
        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# @api_view(['POST'])
# @permission_classes([AllowAny])
# def recognize_face(request):
#     try:
#         serializer = MultiFaceEmbeddingSerializer(data=request.data)
#         if not serializer.is_valid():
#             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

#         received_embeddings = serializer.validated_data['embeddings']
#         results = []
        
#         THRESHOLD = 0.4 

#         for index, vector in enumerate(received_embeddings):
            
#             closest_user = User.objects.filter(role_type='student').annotate(
#                 distance=CosineDistance('face_embedding_512', vector)
#             ).order_by('distance').first()

#             if closest_user:
#                 print(f"Face {index} closest match: {closest_user.username} (Dist: {closest_user.distance:.4f})")

#             if closest_user and closest_user.distance < THRESHOLD:
#                 try:
#                     student_profile = closest_user.student_profile
#                     results.append({
#                         "index": index,
#                         "status": "success",
#                         "student_name": closest_user.username,
#                         "student_id": student_profile.student_id,
#                         "distance": closest_user.distance
#                     })
#                 except Student.DoesNotExist:
#                      results.append({
#                         "index": index,
#                         "status": "error",
#                         "message": "User has no student profile"
#                     })
#             else:
#                 results.append({
#                     "index": index,
#                     "status": "unknown",
#                     "message": "Face not recognized"
#                 })

#         return Response({"results": results}, status=status.HTTP_200_OK)

#     except Exception as e:
#         print(f"Recognition Error: {e}")
#         return Response({"error": str(e)}, status=500)
    

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def register_face(request):
#     try:
#         target_id = request.data.get('student_id')
#         embedding = request.data.get('embedding')

#         if not target_id or not embedding:
#             return Response({"error": "Missing student_id or embedding"}, status=400)

#         student = Student.objects.get(student_id=target_id)
        
#         user = student.user 
        
#         user.face_embedding_512 = embedding
#         user.save()

#         return Response({
#             "status": "success", 
#             "message": f"Face vector updated for User: {user.username} (Student: {student.student_id})"
#         }, status=200)

#     except Student.DoesNotExist:
#         return Response({"error": f"Student ID {target_id} not found"}, status=404)
#     except Exception as e:
#         return Response({"error": str(e)}, status=500)