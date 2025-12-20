from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.models import LeaveRequest, AttendanceAppeal, Student, ClassSession

#  Serializers
from core.interface.serializers.requests_serializers import LeaveRequestSerializer
from core.interface.serializers.requests_serializers import AttendanceAppealSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaves(request):
    try:
        leaves = LeaveRequest.objects.filter(user=request.user).order_by('-created_at')
        serializer = LeaveRequestSerializer(leaves, many=True)

        return Response(serializer.data)

    except Exception as e:
        print(f"Get Leaves Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser]) 
def apply_leaves(request):
    try:
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        reason = request.data.get('reason') 
        description = request.data.get('description')

        if not start_date or not end_date:
            return Response({"error": "Start Date and End Date are required"}, status=400)

        leave = LeaveRequest.objects.create(
            user=request.user,
            start_date=start_date,
            end_date=end_date,
            reason=reason,
            description=description, 
            status='pending',
        )

        return Response({
            "message": "Leave submitted successfully", 
            "id": leave.id
        }, status=201)

    except Student.DoesNotExist:
        return Response({"error": "Student profile not found"}, status=404)
    except Exception as e:
        print(f"Submit Leave Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_appeals(request):
    try:
        student = Student.objects.get(user=request.user)

        appeals = AttendanceAppeal.objects.filter(student=student).order_by('-created_at')
        serializer = AttendanceAppealSerializer(appeals, many=True)
        
        return Response(serializer.data)

    except Student.DoesNotExist:
        return Response({"error": "Student profile not found for this user"}, status=404)
    except Exception as e:
        print(f"Get Appeals Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def apply_appeals(request):
    try:
        session_id = request.data.get('session_id')
        reason = request.data.get('reason')
        description = request.data.get('description')
                
        if not session_id:
            return Response({'error': 'Session ID is required'}, status=400)

        try:
            student = Student.objects.get(user=request.user)
            session = ClassSession.objects.get(id=session_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found'}, status=404)
        except ClassSession.DoesNotExist:
            return Response({'error': 'Class Session not found'}, status=404)

        appeal = AttendanceAppeal.objects.create(
            student=student,
            session=session,
            reason=reason,
            description=description,
            document_url=None,
            status='pending'
        )

        return Response({
            "message": "Appeal submitted successfully",
            "appeal_id": appeal.id
        }, status=201)

    except Exception as e:
        print(f"Appeal Error: {e}")
        return Response({"error": str(e)}, status=500)