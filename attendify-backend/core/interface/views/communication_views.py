from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from core.models import Notification, News, Event
# Import Services
from core.services.communication_services import CommunicationService
#  Serializers
from core.interface.serializers.communication_serializers import NotificationSerializer, NewsSerializer, EventSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_newsevent(request):
    service = CommunicationService()
    
    try:
        news_object , events_object = service.get_newsevent()

        return Response({
            "news": NewsSerializer(news_object, many=True).data,
            "events": EventSerializer(events_object, many=True).data
        })

    except Exception as e:
        print(f"Home Feed Error: {e}")
        return Response({"error": "Failed to load home feed"}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_notifications(request):
    service = CommunicationService()

    try:
        notification_object = service.get_notifications(request.user)

        serializer = NotificationSerializer(notification_object, many=True)
        return Response(serializer.data)

    except Exception as e:
        print(f"Notification Error: {e}")
        return Response({"error": "Failed to load notifications"}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    service = CommunicationService()

    try:
        count = service.mark_notifications_read(request.user)
        
        return Response({"message": f"Marked {count} notifications as read"})

    except Exception as e:
        print(f"Mark Read Error: {e}")
        return Response({"error": "Failed to update"}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_event_status(request):
    service = CommunicationService()
    
    try:
        data = service.check_event_status(request.user, request.data)
        return Response(data)
        
    except Exception as e:
        return Response({"error": str(e)}, status=400)
    