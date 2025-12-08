from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import authenticate
# Import Serializers
from core.interface.serializers.users_serializers import UserSerializer, StudentSerializer
from core.models import Student


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



@api_view(['GET'])
@permission_classes([AllowAny])
def get_student_profile(request):
    try:
        user_id = request.query_params.get('id')
        
        if not user_id:
            return Response({"error": "For testing, please send ?id=YOUR_USER_ID"}, status=400)

        student = Student.objects.get(user__id=user_id)
        student_data = StudentSerializer(student).data
        
        student_data['email'] = student.user.email
        student_data['username'] = student.user.username
        
        return Response(student_data)

    except Student.DoesNotExist:
        return Response({"error": "Student profile not found"}, status=404)
        
    except Exception as e:
        print(f"Profile Error: {str(e)}")
        return Response({"error": "Server error"}, status=500)