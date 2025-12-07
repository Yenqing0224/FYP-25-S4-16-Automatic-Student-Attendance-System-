from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from core.models import Student, ClassSession, Semester
# Serializers
from core.interface.serializers.academics_serializers import ClassSessionSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def get_dashboard(request):
    try:
        user = request.user
        if user.is_anonymous:
            user_id = request.query_params.get('user_id')
            student = Student.objects.get(user__id=user_id)
        else:
            student = Student.objects.get(user=user)

        today = timezone.now()
        current_semester = Semester.objects.filter(start_date__lte=today, end_date__gte=today).first()
        
        semester_range = "No Active Semester"
        if current_semester:
            s_start = current_semester.start_date.strftime("%b %Y")
            s_end = current_semester.end_date.strftime("%b %Y")
            semester_range = f"{s_start} - {s_end}"

        today_start = today.replace(hour=0, minute=0, second=0)
        today_end = today.replace(hour=23, minute=59, second=59)

        todays_sessions = ClassSession.objects.filter(
            module__students=student,
            date_time__range=(today_start, today_end)
        ).order_by('date_time')

        upcoming_sessions = ClassSession.objects.filter(
            module__students=student,
            date_time__gt=today_end
        ).order_by('date_time')[:5]

        return Response({
            "semester_range": semester_range,
            "today_classes": ClassSessionSerializer(todays_sessions, many=True).data,
            "upcoming_classes": ClassSessionSerializer(upcoming_sessions, many=True).data
        })

    except Exception as e:
        print(f"Dashboard Error: {e}")
        return Response({"error": str(e)}, status=500)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_timetable(request):
    try:
        user = request.user
        if user.is_anonymous:
            user_id = request.query_params.get('user_id')
            student = Student.objects.get(user__id=user_id)
        else:
            student = Student.objects.get(user=user)

        sessions = ClassSession.objects.filter(
            module__students=student
        ).order_by('date_time')

        return Response(ClassSessionSerializer(sessions, many=True).data)

    except Exception as e:
        print(f"Timetable Error: {e}")
        return Response({"error": str(e)}, status=500)