from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
# Import Serializers
from core.interface.serializers.users_serializers import StudentSerializer
from core.models import User, Student


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_student_profile(request):
    try:
        student = Student.objects.get(user=request.user)
        
        return Response(StudentSerializer(student).data)

    except Student.DoesNotExist:
        return Response({"error": "Student profile not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    

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