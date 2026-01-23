from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
# Import Services
from core.services.users_services import UserService
# Import Serializers
from core.interface.serializers.users_serializers import StudentSerializer, LecturerSerializer
from core.interface.serializers.academics_serializers import ModuleSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    service = UserService()
    
    try:
        user_profile = service.get_profile(request.user)
        
        serializer = None
        
        if request.user.role_type == 'student':
            serializer = StudentSerializer(user_profile) 
            return Response(serializer.data, status=200) 
        elif request.user.role_type == 'lecturer':
            serializer = LecturerSerializer(user_profile)
            
            response = dict(serializer.data)

            response['active_modules'] = ModuleSerializer(getattr(user_profile, 'active_modules', []), many=True).data
            response['active_modules_count'] = getattr(user_profile, 'active_modules_count', 0)
            response['total_students'] = getattr(user_profile, 'total_students', 0)
            
            return Response(response, status=200)

    except ObjectDoesNotExist:
        return Response({"error": "Profile details not found in database"}, status=404)
        
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
        
    except Exception as e:
        return Response({"error": "Something went wrong!!!"}, status=500)
    

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_profile(request):
    service = UserService()
    try:
        message = service.edit_profile(request.user, request.data)

        return Response({"message": message}, status=200)
    
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Update Profile Error: {e}")
        return Response({"error": str(e)}, status=500)