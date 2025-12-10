from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# Import all models
from core.models import *

# Import all serializers
from core.interface.serializers.admin_serializers import *

# Helper Function
def create_crud_views(model_class, serializer_class):
    @api_view(['GET', 'POST'])
    @permission_classes([IsAdminUser])
    def list_create(request):
        if request.method == 'GET':
            filter_kwargs = {k: v for k, v in request.query_params.items() if k in [f.name for f in model_class._meta.fields]}
            items = model_class.objects.filter(**filter_kwargs)
            serializer = serializer_class(items, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            serializer = serializer_class(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=201)
            return Response(serializer.errors, status=400)


    @api_view(['GET', 'PATCH', 'DELETE'])
    @permission_classes([IsAdminUser])
    def detail(request, pk):
        item = get_object_or_404(model_class, pk=pk)

        if request.method == 'GET':
            serializer = serializer_class(item)
            return Response(serializer.data)

        elif request.method == 'PATCH':
            serializer = serializer_class(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

        elif request.method == 'DELETE':
            item.delete()
            return Response({"message": "Item deleted successfully"}, status=204)

    return list_create, detail


# Users
users_list, users_detail = create_crud_views(User, AdminUserSerializer)
students_list, students_detail = create_crud_views(Student, AdminStudentSerializer)
lecturers_list, lecturers_detail = create_crud_views(Lecturer, AdminLecturerSerializer)
admins_list, admins_detail = create_crud_views(Admin, AdminAdminSerializer)

# Academics
semesters_list, semesters_detail = create_crud_views(Semester, AdminSemesterSerializer)
modules_list, modules_detail = create_crud_views(Module, AdminModuleSerializer)
sessions_list, sessions_detail = create_crud_views(ClassSession, AdminClassSessionSerializer)
records_list, records_detail = create_crud_views(AttendanceRecord, AdminAttendanceRecordSerializer)

# Communication
notifs_list, notifs_detail = create_crud_views(Notification, AdminNotificationSerializer)
news_list, news_detail = create_crud_views(News, AdminNewsSerializer)
events_list, events_detail = create_crud_views(Event, AdminEventSerializer)

# Requests
leaves_list, leaves_detail = create_crud_views(LeaveRequest, AdminLeaveRequestSerializer)
appeals_list, appeals_detail = create_crud_views(AttendanceAppeal, AdminAttendanceAppealSerializer)