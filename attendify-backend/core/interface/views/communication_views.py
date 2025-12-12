from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone
from core.models import Notification, News, Event, User
#  Serializers
from core.interface.serializers.communication_serializers import NotificationSerializer, NewsSerializer, EventSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_newsevent(request):
    try:
        news_object = News.objects.all().order_by('-date_posted')
        events_object = Event.objects.filter(status__in=['upcoming', 'in_progress']).order_by('date')

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
    try:
        notification_object = Notification.objects.filter(
            recipient=request.user
        ).order_by('-date_sent')
        
        serializer = NotificationSerializer(notification_object, many=True)
        return Response(serializer.data)

    except Exception as e:
        print(f"Notification Error: {e}")
        return Response({"error": "Failed to load notifications"}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notifications_read(request):
    try:
        count = Notification.objects.filter(
            recipient=request.user, 
            is_read=False
        ).update(is_read=True)
        
        return Response({"message": f"Marked {count} notifications as read"})

    except Exception as e:
        print(f"Mark Read Error: {e}")
        return Response({"error": "Failed to update"}, status=500)