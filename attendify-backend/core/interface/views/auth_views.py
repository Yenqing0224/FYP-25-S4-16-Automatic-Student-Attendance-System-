from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.contrib.auth import authenticate
from rest_framework.response import Response
# Import Serializers
from core.interface.serializers.users_serializers import UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    try:
        # Get data from Frontend
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"error": "Please provide both username and password"}, status=400)

        # Authentication
        user = authenticate(username=username, password=password)

        if user is not None:
            serializer = UserSerializer(user)
            return Response({
                "message": "Login successful", 
                "user": serializer.data
            }, status=200)
        else:
            return Response({"error": "Invalid Credentials"}, status=401)

    except Exception as e:
        print(f"Login Error: {str(e)}") 
        return Response({"error": "Server error. Please try again later."}, status=500)