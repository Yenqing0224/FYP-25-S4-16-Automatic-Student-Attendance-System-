from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.utils import timezone

from core.models import Notification, News, Event, User

# Import Serializers
from core.interface.serializers.communication_serializers import NotificationSerializer, NewsSerializer, EventSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_newsevent(request):
    try:
        news_object = News.objects.all()
        events_object = Event.objects.filter(status__in=['upcoming', 'in_progress'])

        return Response({
            "news": NewsSerializer(news_object, many=True).data,
            "events": EventSerializer(events_object, many=True).data
        })

    except Exception as e:
        print(f"Home Feed Error: {e}")
        return Response({"error": "Failed to load home feed"}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_notifications(request):
    try:
        user = request.user
        
        if user.is_anonymous:
            user_id = request.query_params.get('user_id')
            if not user_id:
                return Response({"error": "Test Mode: Please add ?user_id=YOUR_ID to the URL"}, status=400)
            user = User.objects.get(id=user_id)

        notification_object = Notification.objects.filter(recipient=user).order_by('-date_sent')
        
        serializer = NotificationSerializer(notification_object, many=True)
        return Response(serializer.data)

    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
    except Exception as e:
        print(f"Notification Error: {e}")
        return Response({"error": "Failed to load notifications"}, status=500)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def mark_notifications_read(request):
    try:
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response({"error": "User ID required"}, status=400)

        # Update all notifications
        count = Notification.objects.filter(recipient_id=user_id, is_read=False).update(is_read=True)
        
        return Response({"message": f"Marked {count} notifications as read"})

    except Exception as e:
        print(f"Mark Read Error: {e}")
        return Response({"error": "Failed to update"}, status=500)