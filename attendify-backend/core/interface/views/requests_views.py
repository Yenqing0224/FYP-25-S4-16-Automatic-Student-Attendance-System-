from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.models import LeaveRequest, AttendanceAppeal, Student

#  Serializers
from core.interface.serializers.requests_serializers import LeaveRequestSerializer
from core.interface.serializers.requests_serializers import AttendanceAppealSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_student_leaves(request):
    try:
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            return Response({"error": "User ID required"}, status=400)

        leaves = LeaveRequest.objects.filter(student__user__id=user_id).order_by('-created_at')

        serializer = LeaveRequestSerializer(leaves, many=True)

        return Response(serializer.data)

    except Exception as e:
        print(f"Get Leaves Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([AllowAny])
def get_student_appeals(request):
    try:
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"error": "User ID required"}, status=400)

        appeals = AttendanceAppeal.objects.filter(student__user__id=user_id).order_by('-created_at')
        
        serializer = AttendanceAppealSerializer(appeals, many=True)
        
        return Response(serializer.data)

    except Exception as e:
        print(f"Get Appeals Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser]) 
def apply_leaves(request):
    try:
        user_id = request.data.get('user_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        reason = request.data.get('reason') 
        description = request.data.get('description')

        if not user_id:
            return Response({"error": "User ID is required"}, status=400)
            
        student = Student.objects.get(user__id=user_id)

        leave = LeaveRequest.objects.create(
            student=student,
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
        return Response({"error": "Student not found"}, status=404)
    except Exception as e:
        print(f"Submit Leave Error: {e}")
        return Response({"error": str(e)}, status=500)