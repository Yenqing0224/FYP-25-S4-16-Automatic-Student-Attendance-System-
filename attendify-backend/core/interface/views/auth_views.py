from rest_framework.decorators import api_view, permission_classes
from django.core.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    service = AuthService()

    try:
        service.logout_user(request.user)

        return Response({
            "message": "Logged out successfully"
        }, status=200)

    except Exception as e:
        print(f"Logout Error: {str(e)}")
        return Response({"error": "Server error during logout"}, status=500)
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    service = AuthService()

    try:
        service.change_password(request.user, request.data)

        return Response({
            "message": "Password updated successfully"
        }, status=200)
    

    except ValidationError as e:
        error_message = e.message if hasattr(e, 'message') else str(e)
        return Response({"error": error_message}, status=400)
    
    except Exception as e:
        print(f"Logout Error: {str(e)}")
        return Response({"error": "Server error during logout"}, status=500)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def request_otp(request):
    service = AuthService()

    try:
        service.request_otp(request.data)

        return Response({
            "message": "OTP has been sent to your email",
            "email": request.data.get('email')
        }, status=200)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Password Reset Error: {str(e)}")
        return Response({"error": "Server error processing request"}, status=500)
    

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    service = AuthService()

    try:
        service.verify_otp(request.data)

        return Response({
            "message": "OTP verified successfully.",
        }, status=200)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Verify OTP Error: {str(e)}")
        return Response({"error": "Server error processing request"}, status=500)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    service = AuthService()

    try:
        service.reset_password(request.data)

        return Response({
            "message": "Password has been reset successfully. You can now login."
        }, status=200)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Reset Password Error: {str(e)}")
        return Response({"error": "Server error processing request"}, status=500)