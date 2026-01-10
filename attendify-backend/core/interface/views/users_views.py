from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.exceptions import ObjectDoesNotExist
# Import Services
from core.services.users_services import UserService
# Import Serializers
from core.interface.serializers.users_serializers import StudentSerializer, LecturerSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    service = UserService()
    try:
        user_profile = service.get_profile(request.user)
        
        serializer = None
        
        if request.user.role_type == 'student':
            serializer = StudentSerializer(user_profile)  
        elif request.user.role_type == 'lecturer':
            serializer = LecturerSerializer(user_profile)

        if serializer:
            return Response(serializer.data, status=200)
        else:
            return Response({"error": "Unknown role type"}, status=400)

    except ObjectDoesNotExist:
        return Response({"error": "Profile details not found in database"}, status=404)
        
    except ValueError as e:
        return Response({"error": str(e)}, status=400)
        
    except Exception as e:
        return Response({"error": "Something went wrong!!!"}, status=500)
    

@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def edit_profile(request):
    try:
        user = request.user 

        user.phone_number = request.data.get('phone_number', user.phone_number)
        user.personal_email = request.data.get('personal_email', user.personal_email)
        user.address_country = request.data.get('address_country', user.address_country)
        user.address_street = request.data.get('address_street', user.address_street)
        user.address_unit = request.data.get('address_unit', user.address_unit)
        user.address_postal = request.data.get('address_postal', user.address_postal)

        user.save()

        return Response({"message": "Profile updated successfully"}, status=200)

    except Exception as e:
        print(f"Update Profile Error: {e}")
        return Response({"error": str(e)}, status=500)