from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
# Import Services
from core.services.auth_services import AuthService
# Import Serializers
from core.interface.serializers.users_serializers import UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    service = AuthService()

    try:
        user, token  = service.login_user(request.data)
        serializer = UserSerializer(user)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": serializer.data
        }, status=200)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Login Error: {str(e)}") 
        return Response({"error": "Server error. Please try again later."}, status=500)