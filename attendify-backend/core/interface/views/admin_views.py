from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
# Import Service
from core.services.admin_services import AdminService

# Import all serializers
from core.interface.serializers.admin_serializers import *

# Helper Function
def create_crud_views(model_class, serializer_class):
    
    @api_view(['GET', 'POST'])
    @permission_classes([IsAdminUser])
    @parser_classes([MultiPartParser, FormParser, JSONParser])
    def list_create(request):
        service = AdminService(model_class)

        if request.method == 'GET':
            queryset = service.get_filtered_queryset(request.query_params)

            paginator = PageNumberPagination()
            paginator.page_size = 10
            page = paginator.paginate_queryset(queryset, request)
            
            if page is not None:
                serializer = serializer_class(page, many=True)
                return paginator.get_paginated_response(serializer.data)

            serializer = serializer_class(queryset, many=True)
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data, errors = service.create_item(request.data, serializer_class)
            
            if errors:
                return Response(errors, status=400)
            
            return Response(data, status=201)

    @api_view(['GET', 'PATCH', 'DELETE'])
    @permission_classes([IsAdminUser])
    @parser_classes([MultiPartParser, FormParser, JSONParser])
    def detail(request, pk):
        try:
            item = model_class.objects.get(pk=pk)
        except model_class.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

        if request.method == 'GET':
            return Response(serializer_class(item).data)

        elif request.method == 'PATCH':
            serializer = serializer_class(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=400)

        elif request.method == 'DELETE':
            item.delete()
            return Response(status=204)

    return list_create, detail


@api_view(['GET'])
@permission_classes([IsAdminUser])
def get_student_semester_attendance(request, student_id):
    try:
        data = AdminService.get_student_semester_attendance(student_id)
    
        if data is None:
            return Response({"error": "Student not found"}, status=404)

        paginator = PageNumberPagination()
        paginator.page_size = 10  
    
        result_page = paginator.paginate_queryset(data, request)
    
        return paginator.get_paginated_response(result_page)
    
    except Exception as e:
        return Response({"error": "Internal Server Error"}, status=500)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def get_secure_document_url(request):
    doc_id = request.data.get('id')
    doc_type = request.data.get('type')

    if not doc_id or not doc_type:
        return Response({"error": "Both 'id' and 'type' are required."}, status=400)

    try:
        url = AdminService.get_secure_document_url(doc_id, doc_type)
        
        return Response({"url": url}, status=200)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
        
    except Exception as e:
        return Response({"error": "Internal Server Error"}, status=500)


# Users
users_list, users_detail = create_crud_views(User, AdminUserSerializer)
students_list, students_detail = create_crud_views(Student, AdminStudentSerializer)
lecturers_list, lecturers_detail = create_crud_views(Lecturer, AdminLecturerSerializer)
admins_list, admins_detail = create_crud_views(Admin, AdminAdminSerializer)

# Academics
uni_list, uni_detail = create_crud_views(PartnerUni, AdminPartnerUniSerializer)
semesters_list, semesters_detail = create_crud_views(Semester, AdminSemesterSerializer)
modules_list, modules_detail = create_crud_views(Module, AdminModuleSerializer)
sessions_list, sessions_detail = create_crud_views(ClassSession, AdminClassSessionSerializer)
classrooms_list, classrooms_detail = create_crud_views(ClassRoom, AdminClassRoomSerializer)
records_list, records_detail = create_crud_views(AttendanceRecord, AdminAttendanceRecordSerializer)

# Communication
notifs_list, notifs_detail = create_crud_views(Notification, AdminNotificationSerializer)
news_list, news_detail = create_crud_views(News, AdminNewsSerializer)
events_list, events_detail = create_crud_views(Event, AdminEventSerializer)
announcement_list, announcement_detail = create_crud_views(Announcement, AdminAnnouncementSerializer)

# Requests
leaves_list, leaves_detail = create_crud_views(LeaveRequest, AdminLeaveRequestSerializer)
appeals_list, appeals_detail = create_crud_views(AttendanceAppeal, AdminAttendanceAppealSerializer)