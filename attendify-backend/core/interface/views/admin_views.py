# core/interface/views/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from core.models import *
from core.interface.serializers.users_serializers import StudentSerializer
from core.interface.serializers.communication_serializers import NotificationSerializer, NewsSerializer, EventSerializer
from django.shortcuts import get_object_or_404


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def news_list_create(request):
    if request.method == 'GET':
        news = News.objects.all().order_by('-news_date')
        serializer = NewsSerializer(news, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = NewsSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def news_detail(request, pk):
    news = get_object_or_404(News, pk=pk)
    
    if request.method == 'GET':
        serializer = NewsSerializer(news)
        return Response(serializer.data)
    elif request.method == 'PATCH':
        serializer = NewsSerializer(news, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        news.delete()
        return Response({"message": "News deleted successfully"}, status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def events_list_create(request):
    if request.method == 'GET':
        events = Event.objects.all().order_by('-event_date')
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def events_detail(request, pk):
    event = get_object_or_404(Event, pk=pk)

    if request.method == 'GET':
        serializer = EventSerializer(event)
        return Response(serializer.data)
    elif request.method == 'PATCH':
        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    elif request.method == 'DELETE':
        event.delete()
        return Response({"message": "Event deleted successfully"}, status=204)


@api_view(['GET', 'POST'])
@permission_classes([IsAdminUser])
def notifications_list_create(request):
    if request.method == 'GET':
        notes = Notification.objects.all().order_by('-date_sent')
        serializer = NotificationSerializer(notes, many=True)
        return Response(serializer.data)
    elif request.method == 'POST':
        serializer = NotificationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

@api_view(['GET', 'DELETE'])
@permission_classes([IsAdminUser])
def notifications_detail(request, pk):
    note = get_object_or_404(Notification, pk=pk)

    if request.method == 'GET':
        serializer = NotificationSerializer(note)
        return Response(serializer.data)
    elif request.method == 'DELETE':
        note.delete()
        return Response({"message": "Notification deleted successfully"}, status=204)