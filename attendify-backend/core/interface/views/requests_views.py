from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from core.models import Student, ClassSession
# Import Services
from core.services.requests_services import RequestService
#  Serializers
from core.interface.serializers.requests_serializers import LeaveRequestSerializer
from core.interface.serializers.requests_serializers import AttendanceAppealSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaves(request):
    service = RequestService()

    try:
        leaves = service.get_leaves(request.user)
        serializer = LeaveRequestSerializer(leaves, many=True)

        return Response(serializer.data)

    except Exception as e:
        print(f"Get Leaves Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser]) 
def apply_leaves(request):
    service = RequestService()

    try:
        leave = service.apply_leaves(request.user, request.data)

        return Response({
            "message": "Leave submitted successfully", 
            "id": leave.id
        }, status=201)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Submit Leave Error: {e}")
        return Response({"error": str(e)}, status=500)
    

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_appeals(request):
    service = RequestService()

    try:
        appeal = service.get_student_appeals(request.user)
        serializer = AttendanceAppealSerializer(appeal, many=True)
        
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
    service = RequestService()

    try:
        appeal = service.apply_appeals(request.user, request.data)

        return Response({
            "message": "Appeal submitted successfully",
            "appeal_id": appeal.id
        }, status=201)
    
    except Student.DoesNotExist:
        return Response({'error': 'Student profile not found'}, status=404)
    
    except ClassSession.DoesNotExist:
        return Response({'error': 'Class Session not found'}, status=404)
    
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Appeal Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_appeal_document_url(request, appeal_id):
    service = RequestService()
    url, error = service.get_appeal_document_url(request.user, appeal_id)
    
    if error:
        return Response({"error": error}, status=404)
        
    return Response({"document_url": url}, status=200)