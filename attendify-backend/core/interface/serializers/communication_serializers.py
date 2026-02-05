from rest_framework import serializers
from core.models import Notification, News, Event, Announcement


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = '__all__'


class EventSerializer(serializers.ModelSerializer):
    total_student = serializers.ReadOnlyField()
    is_full = serializers.ReadOnlyField()
    slots_remaining = serializers.ReadOnlyField()
    class Meta:
        model = Event
        fields = '__all__'


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'