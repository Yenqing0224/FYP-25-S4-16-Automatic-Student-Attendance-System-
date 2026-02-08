from rest_framework.decorators import api_view, permission_classes
from django.core.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
import datetime
# Import Services
from core.services.auth_services import AuthService
# Import Serializers
from core.interface.serializers.users_serializers import UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    service = AuthService()

    try:
        result  = service.login_user(request.data)
        user = result.pop('user')
        token = result.pop('token')

        user_data = UserSerializer(user).data
        
        user_data.update(result)

        return Response({
            "message": "Login successful",
            "token": token.key,
            "user": user_data
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
    

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_push_token(request):
    service = AuthService()

    try:
        service.save_push_token(request.user, request.data)

        return Response({
            "message": "Push token saved successfully"
        }, status=200)

    except ValueError as e:
        return Response({"error": str(e)}, status=400)
    
    except Exception as e:
        print(f"Save Token Error: {str(e)}")
        return Response({"error": "Server error saving token"}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def remove_push_token(request):
    service = AuthService()

    try:
        service.remove_push_token(request.user)

        return Response({
            "message": "Push token removed successfully"
        }, status=200)

    except Exception as e:
        print(f"Remove Token Error: {str(e)}")
        return Response({"error": "Server error removing token"}, status=500)
    

@api_view(['GET'])
@permission_classes([AllowAny])
def keep_redis_alive(request):
    try:
        current_time = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cache.set("system_heartbeat", f"alive_at_{current_time}", timeout=30)
        return Response({
            "status": "alive", 
            "redis": "write_success", 
            "timestamp": current_time
        }, status=200)
    except Exception as e:
        return Response({"status": "error", "detail": str(e)}, status=500)
    