from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from core.models import LeaveRequest
#  Serializers
from core.interface.serializers.requests_serializers import LeaveRequestSerializer

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