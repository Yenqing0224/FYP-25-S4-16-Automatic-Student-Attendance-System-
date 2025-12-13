from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination

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
            filter_kwargs = {k: v for k, v in request.query_params.items() 
                           if k in [f.name for f in model_class._meta.fields]}
            queryset = model_class.objects.filter(**filter_kwargs).order_by('pk') 

            # Pagination Setup
            paginator = PageNumberPagination()
            paginator.page_size = 12  # Default 10 items per page
            paginator.page_size_query_param = 'page_size' # Allow client to override ?page_size=20
            
            page = paginator.paginate_queryset(queryset, request)
            
            if page is not None:
                serializer = serializer_class(page, many=True)
                
                # Construct the Custom "Data" Object with Pagination Info
                response_data = {
                    "pagination": {
                        "total_items": paginator.page.paginator.count,
                        "total_pages": paginator.page.paginator.num_pages,
                        "current_page": paginator.page.number,
                        "page_size": paginator.page_size,
                        "has_next": paginator.page.has_next(),
                        "has_previous": paginator.page.has_previous(),
                    },
                    "results": serializer.data
                }
                
                return Response({
                    "status": "success",
                    "code": 200,
                    "message": f"{model_class.__name__} list retrieved successfully",
                    "data": response_data
                })

            serializer = serializer_class(queryset, many=True)
            return Response({
                "status": "success",
                "code": 200,
                "message": "List retrieved",
                "data": {"results": serializer.data}
            })
        
        elif request.method == 'POST':
            serializer = serializer_class(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "code": 201,
                    "message": f"{model_class.__name__} created successfully",
                    "data": serializer.data
                }, status=201)
            
            return Response({
                "status": "error",
                "code": 400,
                "message": "Validation failed",
                "data": serializer.errors
            }, status=400)


    @api_view(['GET', 'PATCH', 'DELETE'])
    @permission_classes([IsAdminUser])
    def detail(request, pk):
        try:
            item = model_class.objects.get(pk=pk)
        except model_class.DoesNotExist:
            return Response({
                "status": "error",
                "code": 404,
                "message": f"{model_class.__name__} not found",
                "data": None
            }, status=404)

        if request.method == 'GET':
            serializer = serializer_class(item)
            return Response({
                "status": "success",
                "code": 200,
                "message": "Retrieved successfully",
                "data": serializer.data
            })

        elif request.method == 'PATCH':
            serializer = serializer_class(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "status": "success",
                    "code": 200,
                    "message": "Updated successfully",
                    "data": serializer.data
                })
            
            return Response({
                "status": "error",
                "code": 400,
                "message": "Update failed",
                "data": serializer.errors
            }, status=400)

        elif request.method == 'DELETE':
            item.delete()
            return Response({
                "status": "success",
                "code": 204,
                "message": "Deleted successfully",
                "data": None
            }, status=200)

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