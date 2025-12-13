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
            filter_kwargs = {}
            model_name = model_class.__name__

            # Path to user
            user_path_map = {
                'Student': 'user',
                'Lecturer': 'user',
                'Admin': 'user',
                'Notification': 'recipient',
                'LeaveRequest': 'student__user',
                'AttendanceAppeal': 'student__user',
                'AttendanceRecord': 'student__user',
                'Module': 'students__user',           
                'ClassSession': 'module__students__user', 
            }
            allowed_user_fields = [
                'id', 'username', 'email', 
                'first_name', 'last_name', 'phone_number', 'gender', 'personal_email', 'image_url',
                'address_street', 'address_unit', 'address_postal', 'address_country', 
                'role_type', 'status', 'is_staff', 'is_active'
            ]

            # Deep Relationship
            relationship_map = {
                'Module': {
                    'semester': 'semester',
                    'lecturer': 'lecturer',
                    'student': 'students',
                },
                'ClassSession': {
                    'semester': 'module__semester',
                    'module': 'module',
                    'lecturer': 'module__lecturer',
                },
                'AttendanceRecord': {
                    'semester': 'session__module__semester',
                    'module': 'session__module',
                    'session': 'session',
                    'student': 'student'
                },
                'LeaveRequest': {
                    'student': 'student'
                },
                'AttendanceAppeal': {
                    'semester': 'session__module__semester',
                    'module': 'session__module',
                    'session': 'session',
                    'student': 'student'
                },
                'Notification': {
                    'recipient': 'recipient'
                }
            }

            # Filtering Logic
            direct_fields = [f.name for f in model_class._meta.fields]

            for key, value in request.query_params.items():
                
                # Direct Field (Field that inside the model)
                if key in direct_fields:
                    filter_kwargs[key] = value

                # Use ID to filter 
                elif model_name in relationship_map and key in relationship_map[model_name]:
                    db_path = relationship_map[model_name][key]
                    filter_kwargs[db_path] = value

                # Allow all field (Any field on a related model)
                elif '__' in key:
                    prefix, suffix = key.split('__', 1) # Split 'semester__name'
                    if model_name in relationship_map and prefix in relationship_map[model_name]:
                        base_path = relationship_map[model_name][prefix]
                        filter_kwargs[f"{base_path}__{suffix}"] = value
                
                # User Model(Field that allow in 'allowed_user_fields')
                elif key in allowed_user_fields:
                    if model_name in user_path_map:
                        prefix = user_path_map[model_name]
                        filter_kwargs[f'{prefix}__{key}'] = value

            # distinct() to prevent duplicate
            queryset = model_class.objects.filter(**filter_kwargs).distinct().order_by('pk') 

            # Pagination
            paginator = PageNumberPagination()
            paginator.page_size = 10
            paginator.page_size_query_param = 'page_size'
            
            page = paginator.paginate_queryset(queryset, request)
            
            if page is not None:
                serializer = serializer_class(page, many=True)
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

    # --- DETAIL VIEW (GET/PATCH/DELETE) ---
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